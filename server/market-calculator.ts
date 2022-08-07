import Axios from 'axios';
import axiosRetry from 'axios-retry';
import sqlite3 from 'better-sqlite3';
const item_ids = require('./item_ids.json');

interface IMarketBoardSettings {
    baseURL: string
    dataCenters: string[]
    db: any
    worlds: Map<string, string>
    item_limit: number
    rate_limit: number
    entries_to_return: number
    entries_within: number
}

/**
 * Response from Universalis with item sale history over given period of time.
 * Individual sales are in the "entries" array.
 */
interface IUniversalisItemHistoryResponse {
    itemID: number
    lastUploadTyime: number
    entries: IUniversalisItemSaleEntry[]
    dcName: string
}

/**
 * Part of the IUniversalisItemHistoryResponse.
 * Each "entry" is a sale.
 */
interface IUniversalisItemSaleEntry {
    hq: boolean
    pricePerUnit: number
    quantity: number
    buyerName: string
    onMannequin: boolean
    timestamp: number
    worldName: string
    worldID: number
}

/**
 * All items and DC names for items with sale history
 */
interface IDataCenterSaleItem {
    itemID: number
    dataCenterName: string
}

/**
 * Price and quality of an item sold in a DC.
 * Used for calculating the median sale price in a DC.
 */
interface IPricePerUnitAndQuality {
    pricePerUnit: number
    hq: boolean
}

interface IAllItemIDsWithSaleHistory {
    itemID: number
}

/**
 * Lowest price median DC for an item.
 * Additionally, the selected DC median data for comparing against the lowest.
 */
interface IItemLowestMedianDCAndSelectedDCMedian {
    itemID: number
    itemName: string
    medianPrice: number // lowest median sale price
    dataCenterName: string // lowest median sale price DC name
    saleCount: number // sale count from lowest median DC
    hq: boolean // quality
    selectedDataCenterMedian: number // median sale price from selected DC
    selectedSaleCount: number // number of sales from selected DC
    quantitySold: number // total quantity sold across all DC's
    averageStackSize: number // average stack size sold across all DC's
    difference?: number // calculated difference between lowest sale price DC and selected DC
    predictedTotalProfit?: number // calculated profit between selected DC and lowest sale price DC
    profitPercentage?: number //calculated profit percentage between selected DC and lowest sale price DC
}

interface ISelectedDCMedianSalePriceForItem {
    medianSalePrice: number
    dataCenterName: string
    hq: boolean
}

interface ICraftableItem {
    itemID: number
    itemName: string
}

interface IRecipe {
    craftType: string
    ingredients: IRecipeIngredientWithCost[]
}

interface IRecipeIngredientWithCost {
    itemID: number
    itemName?: string
    lowestMedianPrice: number
    lowestMedianWorld?: string
    ingredientAmount: number
    predictedCost: number
    hq: boolean
}

interface ICraftableItemMedianData {
    itemID: number
    itemName: string
    profit: number
    selectedDataCenter: string
    medianSalePrice: number
    totalCraftCost: number
    profitPercentage: number
    volume: number
    avgStackSize: number
    craftTypes: string[]
    recipes: IRecipe[]
    hq: boolean
}

export class MarketCalculator implements IMarketBoardSettings { 
    baseURL: string
    dataCenters: string[]
    db: any
    worlds: Map<string, string>
    item_limit: number
    rate_limit: number
    entries_to_return: number
    entries_within: number

    constructor() {
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
        this.entries_within = 172800; // 2 days in seconds
    }
   
    // Deletes data from local SQL and replaces with new data
    async updateItemSaleHistory(): Promise<string> {
        const saleHistory: IUniversalisItemHistoryResponse[] = await this.getItemSaleHistoryFromUniversalis();

        // delete old item sale history to SQL
        this.deleteItemSaleHistoryFromSQL();

        // insert new item sale history to SQL
        this.insertNewSaleDataToSQL(saleHistory);
        console.log("Updated item sale history.");

        // clear old median calculated data from nq and hq tables in SQL
        console.log("Clearing calculated median data.")
        this.deleteItemSaleMediansFromSQL('nq');
        this.deleteItemSaleMediansFromSQL('hq');

        // calculate and insert new median data to SQL
        this.calculateMedianSalePricesAndInsertToSQL();
        return "done";
    }

    public test(){
        this.calculateMedianSalePricesAndInsertToSQL();
    }

    private insertNewSaleDataToSQL(saleData: IUniversalisItemHistoryResponse[]): void {
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
    }

    private deleteItemSaleHistoryFromSQL() : void {
        this.db.exec('DELETE FROM item_sale_history', (err: any) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Deleted item_sale_history table contents.");
            };
        });
    }

    private deleteItemSaleMediansFromSQL(quality : string) : void {
        this.db.exec(`DELETE FROM item_sale_median_data_${quality}`, (err: any) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Cleared normal quality median data.");
            }
        });
    }

    private calculateMedianSalePricesAndInsertToSQL() : string {
        // calculate new median data
        console.log("Calculating new median sale data...")
        const selectDistinctItems = this.db.prepare('SELECT DISTINCT itemID, dataCenterName FROM item_sale_history');
        const itemList : IDataCenterSaleItem[] = selectDistinctItems.all();

        for (let item of itemList) {
            const selectStatement2 = this.db.prepare('SELECT pricePerUnit, hq FROM item_sale_history WHERE itemID = ? AND dataCenterName = ? ORDER BY pricePerUnit DESC');
            const dataCenterSales = selectStatement2.all(item.itemID, item.dataCenterName);
            let salesNQ: IPricePerUnitAndQuality[] = [];
            let salesHQ: IPricePerUnitAndQuality[] = [];
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
            const medianNQ = this.getDataCenterItemSaleMedian(salesNQ);
            const medianHQ = this.getDataCenterItemSaleMedian(salesHQ)
            
            // insert median data to SQL
            if (salesNQ.length > 0) {
                this.insertDataCenterItemSaleMediansToSQL(item, medianNQ, NQSaleCount, 'nq');
            }

            if (salesHQ.length > 0) {
                this.insertDataCenterItemSaleMediansToSQL(item, medianHQ, HQSaleCount, 'hq');
            }
        }
        return "done";
    }

    private getDataCenterItemSaleMedian(sales: IPricePerUnitAndQuality[]): number {
        let mid = Math.floor(sales.length / 2);
        let nums = [...sales].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
        const median : number = sales.length % 2 !== 0 ? nums[mid].pricePerUnit : (nums[mid - 1].pricePerUnit + nums[mid].pricePerUnit) / 2;
        return median;
    }

    private getWorldNameAndIDs() : Map<string, string> {
        const selectStatement = this.db.prepare('SELECT * FROM worlds');
        const worldDataResults = selectStatement.all();
        const worldDataFormatted = new Map();
        for (let worldData of worldDataResults) {
            worldDataFormatted.set(worldData.worldID, worldData.worldName);
        }
        return worldDataFormatted;
    }

    private async getItemSaleHistoryFromUniversalis(): Promise<IUniversalisItemHistoryResponse[]> {
        const saleHistory: IUniversalisItemHistoryResponse[] = [];
        for (let dataCenter of this.dataCenters) {
            // temporary array, remove IDs from this to avoid rate limit on universalis API
            const idArray: number[] = item_ids.slice();
            axiosRetry(Axios, {
                retries: 20,
                retryDelay: () => { return 1000 * 5; },
                retryCondition: (error) => {
                    return error?.response?.status != 200 || true;
                }
            });
            while (idArray.length > 0) {
                let urlItemList: number[] = [];
                for (let i = 0; i < this.item_limit; i++) {
                    urlItemList.push(idArray.pop()!);
                }
                let requestURL = `${this.baseURL}/${dataCenter}/${urlItemList.toString()}?entriesToReturn=${this.entries_to_return}&entriesWithin=${this.entries_within}`;
                console.log(requestURL);
                const response = await Axios({
                    method: "get",
                    timeout: 1000 * 30,
                    url: requestURL
                });
                for (const item in response.data.items) {
                    saleHistory.push(response.data.items[item]);
                }
                this.sleep(this.rate_limit);
            }
        }
        return saleHistory;
    }


    private insertDataCenterItemSaleMediansToSQL(item: IDataCenterSaleItem, medianNQ: number, saleCount: number, quality: string): void {
        const insertStatement1 = this.db.prepare(`INSERT INTO item_sale_median_data_${quality} VALUES(?, ?, ?, ?)`);
        insertStatement1.run(item.itemID, item.dataCenterName, Math.floor(medianNQ), saleCount);
        console.log(`Inserted ${item.itemID} NQ median`);
    }

    // get list of item IDs and the lowest median sale price/datacenter
    public getAllItemsAndLowestSaleMedians(selectedDataCenter: string): IItemLowestMedianDCAndSelectedDCMedian[] {
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID FROM item_sale_history');
        const itemList: IAllItemIDsWithSaleHistory[] = selectStatement1.all(); // retrieve all item IDs
        const itemMedianData: IItemLowestMedianDCAndSelectedDCMedian[] = [] // store results here
        
        for (let item of itemList) {
            const itemLowestMedianNormalQuality: IItemLowestMedianDCAndSelectedDCMedian = this.getLowestMedianSaleDataAndselectedDataCenter(item.itemID, selectedDataCenter, 'nq');
            const itemLowestMedianHighQuality: IItemLowestMedianDCAndSelectedDCMedian = this.getLowestMedianSaleDataAndselectedDataCenter(item.itemID, selectedDataCenter, 'hq');

            if (!!itemLowestMedianNormalQuality) {
                itemMedianData.push(this.getCalculatedProfits(itemLowestMedianNormalQuality));
            }

            if (!!itemLowestMedianHighQuality) {
                itemMedianData.push(this.getCalculatedProfits(itemLowestMedianHighQuality));
            }
        }
        itemMedianData.sort((a, b) => {return a.predictedTotalProfit! < b.predictedTotalProfit! ? 1 : -1}); // sort by predicted total profit
        // itemMedianData.sort((a, b) => {return a.difference < b.difference ? 1 : -1}); // sort by profit
        // itemMedianData.sort((a, b) => {return a.selectedSaleCount > b.selectedSaleCount ? -1 : 1}); // sort by sales on selected world
        return itemMedianData;
    }

    // passed either NQ or HQ item median table
    // compares with selected world (home world)
    private getLowestMedianSaleDataAndselectedDataCenter(itemID: number, selectedDataCenter: string, quality: string): IItemLowestMedianDCAndSelectedDCMedian {
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

        const itemLowestMedianAndselectedDataCenter: IItemLowestMedianDCAndSelectedDCMedian = selectStatement.get({itemID: itemID, selectedDataCenter: selectedDataCenter});
        return itemLowestMedianAndselectedDataCenter;
    }

    // get median sale data for selected world
    // for specified quality
    private getMedianSaleDataForselectedDataCenter(itemID: number, selectedDataCenter: string, quality: string): ISelectedDCMedianSalePriceForItem {
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

        const itemMedianSaleData: ISelectedDCMedianSalePriceForItem = selectStatement.get({itemID: itemID, selectedDataCenter: selectedDataCenter});
        return itemMedianSaleData;
    }

    // add some calculated values to the item data
    private getCalculatedProfits(itemData: IItemLowestMedianDCAndSelectedDCMedian): IItemLowestMedianDCAndSelectedDCMedian {
        itemData.difference = Math.floor(itemData.selectedDataCenterMedian - itemData.medianPrice);
        itemData.predictedTotalProfit = (itemData.averageStackSize * itemData.selectedDataCenterMedian) - (itemData.averageStackSize * itemData.medianPrice);
        itemData.profitPercentage = Math.floor((itemData.difference / itemData.medianPrice) * 100);
        return itemData;
    }

    // get HQ or NQ profit percentage when crafting the item
    private getCraftingProfitPercentage(totalCraftCost: number, salePrice: number): number {
        if (salePrice === 0) {
            return 0;
        };
        return Math.floor(((salePrice - totalCraftCost) / salePrice) * 100);
    }

    // get all craftable items which are marketable
    // and median sale value on selected world
    public getCraftableItemsAndMedians(selectedDataCenter: string): ICraftableItemMedianData[] {
        const selectStatement = this.db.prepare(`
            SELECT DISTINCT 
                item_recipes.[Item{Result}] as itemID,
                item_info.Name as itemName
            FROM item_recipes 
            LEFT JOIN item_info ON item_info.itemID = item_recipes.[Item{Result}]
            WHERE [Item{Result}] <> 0`
        );
        const craftableItems: ICraftableItem[] = selectStatement.all();
        let craftableItemsWithMedianData: ICraftableItemMedianData[] = []
        for (let item of craftableItems) {
            const normalQualityMedianData: ISelectedDCMedianSalePriceForItem = this.getMedianSaleDataForselectedDataCenter(item.itemID, selectedDataCenter, 'nq');
            const highQualityMedianData: ISelectedDCMedianSalePriceForItem = this.getMedianSaleDataForselectedDataCenter(item.itemID, selectedDataCenter, 'hq');
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
    private formatCraftableItemData(item: { itemID: number; itemName: string; }, selectedDataCenter: string, medianSalePrice: number, recipes: IRecipe[], craftTypes: string[], totalCraftCost: number, volume: number, avgStackSize: number, quality: string) {
        const craftableItem: ICraftableItemMedianData = {
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
            hq: (quality === 'hq') ? true : false
        };

        return craftableItem;
    }

    // calculate cost to craft each item'
    private getCraftedItemCostAndIngredients(itemID: number): IRecipe[] {
        const selectStatement = this.db.prepare(`SELECT *, craft_type.Name as craftTypeName FROM item_recipes LEFT JOIN craft_type ON craft_type.craftTypeID = item_recipes.CraftType WHERE [Item{Result}] = @itemID`);
        const itemRecipes = selectStatement.all({itemID: itemID});
        const recipeDetails: IRecipe[] = []

        for (let recipe of itemRecipes) {
            const craftType: string = recipe.craftTypeName;
            let ingredients: IRecipeIngredientWithCost[] = [];
            const maxIngredients = 9;
            for (let i = 0; i<=maxIngredients; i++) {
                if (recipe[`Item{Ingredient}[${i}]`] > 0) {
                    const ingredientItemID = recipe[`Item{Ingredient}[${i}]`];
                    const ingredientAmount = recipe[`Amount{Ingredient}[${i}]`];
                    ingredients.push(this.getIngedientCost(ingredientItemID, ingredientAmount));
                }
            }
            recipeDetails.push({craftType: craftType, ingredients: ingredients});
        }
        return recipeDetails;
    }

    private getTotalCraftCost(recipes: IRecipe[]): number {
        // loop through each recipe and then get the cheapest to craft
        // note: some items can be crafted multiple ways, hence why we use array here
        let recipeCosts: number[] = [];
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
    private getItemSaleVolume(itemID: number, quality: string, selectedDataCenter: string): number {
        const selectStatement = this.db.prepare(`SELECT SUM(quantity) as totalQuantity FROM item_sale_history WHERE itemID = @itemID AND hq = @quality AND dataCenterName = @selectedDataCenter LIMIT 1`);
        const volume = selectStatement.get({itemID: itemID, quality: quality === 'hq' ? 1 : 0, selectedDataCenter});
        return volume.totalQuantity;
    }

    private getItemAvgStackSize(itemID: number, quality: string, selectedDataCenter: string): number {
        const selectStatement = this.db.prepare(`SELECT AVG(quantity) as avgStackSize FROM item_sale_history WHERE itemID = @itemID AND hq = @quality AND dataCenterName = @selectedDataCenter LIMIT 1`);
        const avgStackSize: number = selectStatement.get({itemID: itemID, quality: quality === 'hq' ? 1 : 0, selectedDataCenter}).avgStackSize;
        return avgStackSize;
    }

    private getIngedientCost(ingredientItemID: number, ingredientAmount: number): IRecipeIngredientWithCost {
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
    private sleep(ms: number | undefined): Promise<unknown> {
        return new Promise(r => setTimeout(r, ms));
    }
}