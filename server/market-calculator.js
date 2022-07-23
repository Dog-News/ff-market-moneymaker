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
        this.entries_within = 604800; // seconds
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
            const insertStatement = this.db.prepare('INSERT INTO item_sale_history VALUES(?,?,?,?,?,?,?,?,?)');
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

                insertStatement.run(itemID, hq, pricePerUnit, quantity, buyerName, onMannequin, timestamp, worldName, worldID);
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
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID, worldName FROM item_sale_history');
        const itemList = selectStatement1.all();

        // normal quality
        for (let item of itemList) {
            const selectStatement2 = this.db.prepare('SELECT pricePerUnit, hq FROM item_sale_history WHERE itemID = ? AND worldName = ? ORDER BY pricePerUnit DESC');
            const worldSales = selectStatement2.all(item.itemID, item.worldName);
            let salesNQ = [];
            let salesHQ = [];
            let NQSaleCount = 0;
            let HQSaleCount = 0;
            for (let sale of worldSales) {
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
                insertStatement1.run(item.itemID, Math.floor(medianNQ), item.worldName, NQSaleCount);
                console.log(`Inserted ${item.itemID} NQ median`);
            }

            if (salesHQ.length > 0) {
                const insertStatement2 = this.db.prepare('INSERT INTO item_sale_median_data_hq VALUES(?, ?, ?, ?)');
                insertStatement2.run(item.itemID, Math.floor(medianHQ), item.worldName, HQSaleCount);
                console.log(`Inserted ${item.itemID} HQ median`);
            }
        }
        return "testing";
    }

    // get list of item IDs and the lowest median sale price/world
    getMedianDifference(selectedWorld) {
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID FROM item_sale_history');
        const itemList = selectStatement1.all(); // retrieve all item IDs
        const itemMedianData = [] // store results here
        
        for (let item of itemList) {
            const itemLowestMedianNormalQuality = this.getLowestMedianSaleDataAndSelectedWorld(item.itemID, selectedWorld, 'nq');
            const itemLowestMedianHighQuality = this.getLowestMedianSaleDataAndSelectedWorld(item.itemID, selectedWorld, 'hq');

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
    getLowestMedianSaleDataAndSelectedWorld(itemID, selectedWorld, quality) {
        const hq = (quality == 'hq') ? 1 : 0;
        const selectStatement = this.db.prepare(
            `SELECT
                item_sale_median_data_${quality}.itemID,
                item_info.Name as itemName,
                item_sale_median_data_${quality}.medianPrice, 
                item_sale_median_data_${quality}.worldName, 
                item_sale_median_data_${quality}.saleCount,
                ${hq} as hq,
                (SELECT medianPrice FROM item_sale_median_data_${quality} WHERE itemID = @itemID AND worldName = @selectedWorld) as selectedWorldMedian,
                (SELECT saleCount FROM item_sale_median_data_${quality} WHERE itemID = @itemID AND worldName = @selectedWorld) as selectedSaleCount,
                (SELECT SUM(quantity) FROM item_sale_history WHERE itemID = @itemID AND hq = ${hq} LIMIT 1) as quantitySold,
                (SELECT AVG(quantity) FROM item_sale_history WHERE itemID = @itemID AND  hq = ${hq} LIMIT 1) as averageStackSize
            FROM item_sale_median_data_${quality}
            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_${quality}.itemID
            WHERE item_sale_median_data_${quality}.itemID = @itemID
            ORDER BY medianPrice ASC LIMIT 1`
        );

        const itemLowestMedianAndSelectedWorld = selectStatement.get({itemID: itemID, selectedWorld: selectedWorld});
        return itemLowestMedianAndSelectedWorld;
    }

    // add some calculated values to the item data
    getCalculatedProfits(itemData) {
        itemData.difference = Math.floor(itemData.selectedWorldMedian - itemData.medianPrice);
        itemData.predictedTotalProfit = (itemData.averageStackSize * itemData.selectedWorldMedian) - (itemData.averageStackSize * itemData.medianPrice);
        itemData.profitPercentage = Math.floor((itemData.difference / itemData.medianPrice) * 100);
        return itemData;
    }

    // get all craftable

    // need to define our own sleep method since nodeJS doesn't have one...
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

module.exports = MarketCalculator;