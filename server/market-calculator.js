const Axios = require('axios');
const axiosRetry = require('axios-retry');
const item_ids = require('./item_ids.json');
const sqlite3 = require('better-sqlite3');

class MarketCalculator { 
    constructor() {
        // database connection
        this.baseURL = "https://universalis.app/api/v2/history";
        this.dataCenters = [
            "Primal",
            "Crystal",
            "Aether"
        ];
        this.db = new sqlite3('./database/ffmarket.db');
        this.db.pragma('journal_mode = WAL');
        this.worlds = this.getWorldNameAndIDs();
        this.item_limit = 50; // limit length of item list in URL
        this.rate_limit = 1000 // wait 1 second so we don't DDOS universalis
        this.entries_to_return = 999999; 
        // this.entries_within = 604800; // 7 seconds
        this.entries_within = 172800; // 2 days seconds
    }

    getWorldNameAndIDs() {
        const selectStatement = this.db.prepare('SELECT * FROM worlds');
        const worldDataResults = selectStatement.all();
        const worldDataFormatted = new Map();
        for (let worldData of worldDataResults) {
            worldDataFormatted.set(worldData.worldID, worldData.worldName);
        }
        return worldDataFormatted;
    }
    
    // Query Universalis API and pull latest market transactions
    // Deletes data from local SQL and replaces with new data
    async updateItemSaleHistory() {
        let saleData = [];
        for (let dataCenter of this.dataCenters) {
            // temporary array, remove IDs from this to avoid rate limit on universalis API
            let idArray = item_ids.slice();
            axiosRetry(Axios, {retries: 10, retryDelay: () => {return 1000 * 5}, retryCondition: (error) => {return error?.response?.status === 500 || true}});
            while (idArray.length > 0) {
                let urlItemList = [];
                for (let i = 0; i < this.item_limit; i++) {
                    urlItemList.push(idArray.pop());
                }
                let requestURL = `${this.baseURL}/${dataCenter}/${urlItemList.toString()}?entriesToReturn=${this.entries_to_return}&entriesWithin=${this.entries_within}`;
                console.log(requestURL);
                const response = await Axios({method: "get", timeout: 1000 * 30, url: requestURL});
                for (const item in response.data.items) {
                    saleData.push(response.data.items[item]);
                }
                this.sleep(this.rate_limit);
            }
        }

        // Delete old data
        this.db.exec('DELETE FROM item_sale_history', (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Deleted item_sale_history table contents.");
            };
        });

        // insert new data
        for (let item of saleData) {
            const insertStatement = this.db.prepare('INSERT INTO item_sale_history VALUES(?,?,?,?,?,?,?,?,?,?)');
            for (let entry of item.entries) {
                const itemID = item.itemID || null;
                const hq = entry.hq ? 1 : 0;
                const pricePerUnit = entry.pricePerUnit || null;
                const quantity = entry.quantity || null;
                const buyerName = entry.buyerName || null;
                const onMannequin = entry.onMannequin ? 1 : 0;
                const timestamp = entry.timestamp || null;
                const worldName = entry.worldName || null;
                const worldID = entry.worldID || null;
                const dataCenterName = item.dcName || null;

                insertStatement.run(itemID, hq, pricePerUnit, quantity, buyerName, onMannequin, timestamp, worldName, worldID, dataCenterName);
            }
        }
        console.log("Updated sale data.");
        this.calculateMedianSalePricesAndInsertToSQL();
    return "done";
    }

    calculateMedianSalePricesAndInsertToSQL() {
        console.log("Clearing calculated median data.")
        // clear nq median data
        this.db.exec('DELETE FROM item_sale_median_data_nq', (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Cleared normal quality median data.");
            }
        });

        // clear hq median data
        this.db.exec('DELETE FROM item_sale_median_data_hq', (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Cleared high quality median data.");
            }
        });

        console.log("Calculating new item median sale data...")
        // const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID, worldName, dataCenterName FROM item_sale_history');
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID, dataCenterName FROM item_sale_history');
        const itemList = selectStatement1.all();

        for (let item of itemList) {
            // const selectStatement2 = this.db.prepare('SELECT pricePerUnit, hq FROM item_sale_history WHERE itemID = ? AND worldName = ? ORDER BY pricePerUnit DESC');
            const selectStatement2 = this.db.prepare('SELECT pricePerUnit, hq FROM item_sale_history WHERE itemID = ? AND dataCenterName = ? ORDER BY pricePerUnit DESC');
            const dataCenterSales = selectStatement2.all(item.itemID, item.dataCenterName);
            let salesNQ = [];
            let salesHQ = [];
            let NQSaleCount = 0;
            let HQSaleCount = 0;
            for (let sale of dataCenterSales) {
                if (sale.hq) {
                    salesHQ.push(sale.pricePerUnit);
                    HQSaleCount++;
                } else {
                    salesNQ.push(sale.pricePerUnit);
                    NQSaleCount++;
                }
            }

            // math stuff
            // NQ median
            let mid = Math.floor(salesNQ.length / 2), 
            nums = [...salesNQ].sort((a, b) => a - b);
            const medianNQ = salesNQ.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
            // HQ median
            mid = Math.floor(salesHQ.length / 2), 
            nums = [...salesHQ].sort((a, b) => a - b);
            const medianHQ = salesHQ.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
            
            // insert median data to SQL
            if (salesNQ.length > 0) {
                const insertStatement1 = this.db.prepare('INSERT INTO item_sale_median_data_nq VALUES(?, ?, ?, ?)');
                insertStatement1.run(item.itemID, item.dataCenterName, Math.floor(medianNQ), NQSaleCount);
                console.log(`Inserted ${item.itemID} NQ median`);
            }

            if (salesHQ.length > 0) {
                const insertStatement2 = this.db.prepare('INSERT INTO item_sale_median_data_hq VALUES(?, ?, ?, ?)');
                insertStatement2.run(item.itemID, item.dataCenterName, Math.floor(medianHQ), HQSaleCount);
                console.log(`Inserted ${item.itemID} HQ median`);
            }
        }
        return "testing";
    }

    // get list of item IDs and the lowest median sale price/world
    getMedianDifference(selectedDataCenter) {
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID FROM item_sale_history');
        const itemList = selectStatement1.all(); // retrieve all item IDs
        const itemMedianData = [] // store results here
        
        for (let item of itemList) {
            const itemLowestMedianNormalQuality = this.getLowestMedianSaleDataAndselectedDataCenter(item.itemID, selectedDataCenter, 'nq');
            const itemLowestMedianHighQuality = this.getLowestMedianSaleDataAndselectedDataCenter(item.itemID, selectedDataCenter, 'hq');

            if (!!itemLowestMedianNormalQuality) {
                itemMedianData.push(this.getCalculatedProfits(itemLowestMedianNormalQuality));
            }

            if (!!itemLowestMedianHighQuality) {
                itemMedianData.push(this.getCalculatedProfits(itemLowestMedianHighQuality));
            }
        }
        itemMedianData.sort((a, b) => {return a.predictedTotalProfit < b.predictedTotalProfit ? 1 : -1}); // sort by predicted total profit
        // itemMedianData.sort((a, b) => {return a.difference < b.difference ? 1 : -1}); // sort by profit
        // itemMedianData.sort((a, b) => {return a.selectedSaleCount > b.selectedSaleCount ? -1 : 1}); // sort by sales on selected world
        return itemMedianData;
    }

    // passed either NQ or HQ item median table
    // compares with selected world (home world)
    getLowestMedianSaleDataAndselectedDataCenter(itemID, selectedDataCenter, quality) {
        const hq = (quality == 'hq') ? 1 : 0;
        const selectStatement = this.db.prepare(
            `SELECT
                item_sale_median_data_${quality}.itemID,
                item_info.Name as itemName,
                item_sale_median_data_${quality}.medianPrice, 
                --item_sale_median_data_${quality}.worldName,
                item_sale_median_data_${quality}.dataCenterName,
                item_sale_median_data_${quality}.saleCount,
                ${hq} as hq,
                (SELECT medianPrice FROM item_sale_median_data_${quality} WHERE itemID = @itemID AND dataCenterName = @selectedDataCenter) as selectedDataCenterMedian,
                (SELECT saleCount FROM item_sale_median_data_${quality} WHERE itemID = @itemID AND dataCenterName = @selectedDataCenter) as selectedSaleCount,
                (SELECT SUM(quantity) FROM item_sale_history WHERE itemID = @itemID AND hq = ${hq} LIMIT 1) as quantitySold,
                (SELECT AVG(quantity) FROM item_sale_history WHERE itemID = @itemID AND  hq = ${hq} LIMIT 1) as averageStackSize
            FROM item_sale_median_data_${quality}
            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_${quality}.itemID
            WHERE item_sale_median_data_${quality}.itemID = @itemID
            ORDER BY medianPrice ASC LIMIT 1`
        );

        const itemLowestMedianAndselectedDataCenter = selectStatement.get({itemID: itemID, selectedDataCenter: selectedDataCenter});
        return itemLowestMedianAndselectedDataCenter;
    }

    // get median sale data for selected world
    // for specified quality
    getMedianSaleDataForselectedDataCenter(itemID, selectedDataCenter, quality) {
        const hq = (quality == 'hq') ? 1 : 0;
        const selectStatement = this.db.prepare(
            `SELECT
                medianPrice as medianSalePrice,
                --worldName,
                dataCenterName,
                ${hq} as hq
            FROM item_sale_median_data_${quality}
            WHERE itemID = @itemID AND dataCenterName = @selectedDataCenter
            ORDER BY medianPrice ASC LIMIT 1`
        );

        const itemMedianSaleData = selectStatement.get({itemID: itemID, selectedDataCenter: selectedDataCenter});
        return itemMedianSaleData;
    }

    // add some calculated values to the item data
    getCalculatedProfits(itemData) {
        itemData.difference = Math.floor(itemData.selectedDataCenterMedian - itemData.medianPrice);
        itemData.predictedTotalProfit = (itemData.averageStackSize * itemData.selectedDataCenterMedian) - (itemData.averageStackSize * itemData.medianPrice);
        itemData.profitPercentage = Math.floor((itemData.difference / itemData.medianPrice) * 100);
        return itemData;
    }

    // get HQ or NQ profit percentage when crafting the item
    getCraftingProfitPercentage(totalCraftCost, salePrice) {
        if (salePrice === 0) {
            return 0;
        };
        return Math.floor(((salePrice - totalCraftCost) / salePrice) * 100);
    }

    // get all craftable items which are marketable
    // and median sale value on selected world
    getCraftableItemsAndMedians(selectedDataCenter) {
        const selectStatement = this.db.prepare(`
            SELECT DISTINCT 
                item_recipes.[Item{Result}] as itemID,
                item_info.Name as itemName
            FROM item_recipes 
            LEFT JOIN item_info ON item_info.itemID = item_recipes.[Item{Result}]
            WHERE [Item{Result}] <> 0`
        );
        const craftableItems = selectStatement.all();
        let craftableItemsWithMedianData = []
        for (let item of craftableItems) {
            const normalQualityMedianData = this.getMedianSaleDataForselectedDataCenter(item.itemID, selectedDataCenter, 'nq');
            const highQualityMedianData = this.getMedianSaleDataForselectedDataCenter(item.itemID, selectedDataCenter, 'hq');
            const recipes = this.getCraftedItemCostAndIngredients(item.itemID);
            const craftTypes = recipes.map((recipe) => {return recipe.craftType});
            const hqAvgStackSize = this.getItemAvgStackSize(item.itemID, 'hq', selectedDataCenter);
            const nqAvgStackSize = this.getItemAvgStackSize(item.itemID, 'nq', selectedDataCenter);
            const totalCraftCost = this.getTotalCraftCost(recipes);
            const hqVolume = this.getItemSaleVolume(item.itemID, 'hq', selectedDataCenter);
            const nqVolume = this.getItemSaleVolume(item.itemID, 'nq', selectedDataCenter);
            if (!!normalQualityMedianData) {
                craftableItemsWithMedianData.push(this.formatCraftableItemData(
                    item, 
                    selectedDataCenter, 
                    Math.floor(normalQualityMedianData.medianSalePrice * nqAvgStackSize),  // medianSalePrice
                    recipes, 
                    craftTypes, 
                    Math.floor(totalCraftCost * nqAvgStackSize), // totalCraftCost
                    nqVolume, 
                    Math.floor(nqAvgStackSize), // average stack size
                    'nq'
                ));
            }
            if (!!highQualityMedianData) {
                craftableItemsWithMedianData.push(this.formatCraftableItemData(
                    item, 
                    selectedDataCenter, 
                    Math.floor(highQualityMedianData.medianSalePrice * hqAvgStackSize), // medianSalePrice
                    recipes, 
                    craftTypes, 
                    Math.floor(totalCraftCost * hqAvgStackSize), // totalCraftCost
                    hqVolume, 
                    Math.floor(hqAvgStackSize), // average stack size
                    'hq'
                ));
            }
        }
        return craftableItemsWithMedianData;
    }

    // return in format needed to display on craftable items page
    formatCraftableItemData(item, selectedDataCenter, medianSalePrice, recipes, craftTypes, totalCraftCost, volume, avgStackSize, quality) {
        const craftableItem = {
            itemID: item.itemID,
            itemName: item.itemName,
            profit: (medianSalePrice || 0) - (totalCraftCost || 0),
            selectedDataCenter: selectedDataCenter,
            medianSalePrice: medianSalePrice || 0,
            totalCraftCost: totalCraftCost,
            profitPercentage: this.getCraftingProfitPercentage(totalCraftCost, (medianSalePrice || 0)),
            volume: volume,
            avgStackSize: avgStackSize,
            craftTypes: craftTypes,
            recipes: recipes,
            hq: (quality === 'hq') ? 1 : 0
            // hqProfit: (highQualityMedianData?.medianSalePrice || 0) - (totalCraftCost || 0),
            // nqProfit: (normalQualityMedianData?.medianSalePrice || 0) - (totalCraftCost || 0),
            // hqMedianSalePrice: highQualityMedianData?.medianSalePrice || 0,
            // nqMedianSalePrice: normalQualityMedianData?.medianSalePrice || 0,
            // hqProfitPercentage: this.getCraftingProfitPercentage(totalCraftCost, (highQualityMedianData?.medianSalePrice || 0)),
            // nqProfitPercentage: this.getCraftingProfitPercentage(totalCraftCost, (normalQualityMedianData?.medianSalePrice || 0)),
        };

        return craftableItem;
    }

    // calculate cost to craft each item'
    getCraftedItemCostAndIngredients(itemID) {
        const selectStatement = this.db.prepare(`SELECT *, craft_type.Name as craftTypeName FROM item_recipes LEFT JOIN craft_type ON craft_type.craftTypeID = item_recipes.CraftType WHERE [Item{Result}] = @itemID`);
        const itemRecipes = selectStatement.all({itemID: itemID});
        const ingredientInfo = []
        for (let recipe of itemRecipes) {
            const craftType = recipe.craftTypeName;
            let ingredients = [];
            const maxIngredients = 9;
            for (let i = 0; i<=maxIngredients; i++) {
                if (recipe[`Item{Ingredient}[${i}]`] > 0) {
                    const ingredientItemID = recipe[`Item{Ingredient}[${i}]`];
                    const ingredientAmount = recipe[`Amount{Ingredient}[${i}]`];
                    ingredients.push(this.getIngedientCost(ingredientItemID, ingredientAmount));
                }
            }
            ingredientInfo.push({craftType: craftType, ingredients: ingredients});
        }
        return ingredientInfo;
    }

    getTotalCraftCost(recipes) {
        // loop through each recipe and then get the cheapest to craft
        // note: some items can be crafted multiple ways, hence why we use array here
        let recipeCosts = [];
        for (let recipe of recipes) {
            let totalRecipeCost = 0;
            for (let ingredient of recipe.ingredients) {
                totalRecipeCost += ingredient.predictedCost || 0;
            }
            recipeCosts.push(totalRecipeCost);
        }
        return Math.min(...recipeCosts);
    }

    // get quantity of items sold
    // ignore HQ vs. NQ for now...
    getItemSaleVolume(itemID, quality, selectedDataCenter) {
        const selectStatement = this.db.prepare(`SELECT SUM(quantity) as totalQuantity FROM item_sale_history WHERE itemID = @itemID AND hq = @quality AND dataCenterName = @selectedDataCenter LIMIT 1`);
        const volume = selectStatement.get({itemID: itemID, quality: quality === 'hq' ? 1 : 0, selectedDataCenter});
        return volume.totalQuantity;
    }

    getItemAvgStackSize(itemID, quality, selectedDataCenter) {
        const selectStatement = this.db.prepare(`SELECT AVG(quantity) as avgStackSize FROM item_sale_history WHERE itemID = @itemID AND hq = @quality AND dataCenterName = @selectedDataCenter LIMIT 1`);
        const avgStackSize = selectStatement.get({itemID: itemID, quality: quality === 'hq' ? 1 : 0, selectedDataCenter});
        return avgStackSize.avgStackSize;
    }

    getIngedientCost(ingredientItemID, ingredientAmount) {
        const selectStatement = this.db.prepare(`
            SELECT
                item_sale_median_data_hq.itemID,
                item_info.Name as itemName,
                item_sale_median_data_hq.medianPrice, 
                --item_sale_median_data_hq.worldName, 
                item_sale_median_data_hq.dataCenterName, 
                item_sale_median_data_hq.saleCount,
                1 as hq
            FROM item_sale_median_data_hq
            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_hq.itemID
            WHERE item_sale_median_data_hq.itemID = @itemID
            UNION ALL
            SELECT
                item_sale_median_data_nq.itemID,
                item_info.Name as itemName,
                item_sale_median_data_nq.medianPrice, 
                --item_sale_median_data_nq.worldName, 
                item_sale_median_data_nq.dataCenterName, 
                item_sale_median_data_nq.saleCount,
                0 as hq
            FROM item_sale_median_data_nq
            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_nq.itemID
            WHERE item_sale_median_data_nq.itemID = @itemID
            ORDER BY medianPrice ASC LIMIT 1`
        );
        const ingredientInfo = selectStatement.get({itemID: ingredientItemID});
        return {
            itemID: ingredientItemID,
            itemName: ingredientInfo?.itemName || null,
            lowestMedianPrice: ingredientInfo?.medianPrice || 0,
            lowestMedianWorld: ingredientInfo?.dataCenterName || null,
            ingredientAmount: ingredientAmount,
            predictedCost: Math.floor((ingredientInfo?.medianPrice || 0) * ingredientAmount),
            hq: ingredientInfo?.hq || null
        }
    }

    // need to define our own sleep method since nodeJS doesn't have one...
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

module.exports = MarketCalculator;