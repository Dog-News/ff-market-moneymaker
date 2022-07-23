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
    // TODO: Cleanup the copy/paste duplicate code
    getMedianDifference(selectedWorld) {
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID FROM item_sale_history');
        const itemList = selectStatement1.all();
        const itemMedianData = [] // store results here
        for (let item of itemList) {
            // const selectStatement2 = this.db.prepare('SELECT * FROM item_sale_median_data WHERE itemID = ? ORDER BY medianPrice ASC LIMIT 1');
            const selectStatement2 = this.db.prepare(
                `SELECT
                    item_sale_median_data_nq.itemID,
                    item_info.Name as itemName,
                    item_sale_median_data_nq.medianPrice, 
                    item_sale_median_data_nq.worldName, 
                    item_sale_median_data_nq.saleCount,
                    0 as hq,
                    (SELECT medianPrice FROM item_sale_median_data_nq WHERE itemID = ? AND worldName = ?) as selectedWorldMedian,
                    (SELECT saleCount FROM item_sale_median_data_nq WHERE itemID = ? AND worldName = ?) as selectedSaleCount,
                    (SELECT SUM(quantity) FROM item_sale_history WHERE itemID = ? AND  hq = 0 LIMIT 1) as quantitySold,
                    (SELECT AVG(quantity) FROM item_sale_history WHERE itemID = ? AND  hq = 0 LIMIT 1) as averageStackSize
                FROM item_sale_median_data_nq
                LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_nq.itemID
                WHERE item_sale_median_data_nq.itemID = ?
                ORDER BY medianPrice ASC LIMIT 1`
            );
            const selectStatement3 = this.db.prepare(
                `SELECT
                    item_sale_median_data_hq.itemID,
                    item_info.Name as itemName,
                    item_sale_median_data_hq.medianPrice, 
                    item_sale_median_data_hq.worldName, 
                    item_sale_median_data_hq.saleCount,
                    1 as hq,
                    (SELECT medianPrice FROM item_sale_median_data_hq WHERE itemID = ? AND worldName = ?) as selectedWorldMedian,
                    (SELECT saleCount FROM item_sale_median_data_hq WHERE itemID = ? AND worldName = ?) as selectedSaleCount,
                    (SELECT SUM(quantity) FROM item_sale_history WHERE itemID = ? AND hq = 1 LIMIT 1) as quantitySold,
                    (SELECT AVG(quantity) FROM item_sale_history WHERE itemID = ? AND  hq = 1 LIMIT 1) as averageStackSize
                FROM item_sale_median_data_hq
                LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_hq.itemID
                WHERE item_sale_median_data_hq.itemID = ?
                ORDER BY medianPrice ASC LIMIT 1`
            );

            const itemLowestMedianNQ = selectStatement2.get(item.itemID, selectedWorld, item.itemID, selectedWorld, item.itemID, item.itemID, item.itemID);
            const itemLowestMedianHQ = selectStatement3.get(item.itemID, selectedWorld, item.itemID, selectedWorld, item.itemID, item.itemID, item.itemID);
            if (!!itemLowestMedianNQ) {
                itemLowestMedianNQ.difference = Math.floor(itemLowestMedianNQ.selectedWorldMedian - itemLowestMedianNQ.medianPrice);
                itemLowestMedianNQ.predictedTotalProfit = (itemLowestMedianNQ.averageStackSize * itemLowestMedianNQ.selectedWorldMedian) - (itemLowestMedianNQ.averageStackSize * itemLowestMedianNQ.medianPrice);
                itemLowestMedianNQ.profitPercentage = Math.floor((itemLowestMedianNQ.difference / itemLowestMedianNQ.medianPrice) * 100);
                itemMedianData.push(itemLowestMedianNQ);
            }

            if (!!itemLowestMedianHQ) {
                itemLowestMedianHQ.difference = Math.floor(itemLowestMedianHQ.selectedWorldMedian - itemLowestMedianHQ.medianPrice);
                itemLowestMedianHQ.predictedTotalProfit = (itemLowestMedianHQ.averageStackSize * itemLowestMedianHQ.selectedWorldMedian) - (itemLowestMedianHQ.averageStackSize * itemLowestMedianHQ.medianPrice);
                itemLowestMedianHQ.profitPercentage = Math.floor((itemLowestMedianHQ.difference / itemLowestMedianHQ.medianPrice) * 100);
                itemMedianData.push(itemLowestMedianHQ);
            }
            // console.log("got median");
        }
        itemMedianData.sort((a, b) => {return a.predictedTotalProfit < b.predictedTotalProfit ? 1 : -1}); // sort by predicted total profit
        // itemMedianData.sort((a, b) => {return a.difference < b.difference ? 1 : -1}); // sort by profit
        // itemMedianData.sort((a, b) => {return a.selectedSaleCount > b.selectedSaleCount ? -1 : 1}); // sort by sales on selected world
        return itemMedianData;
    }

    // need to define our own sleep method since nodeJS doesn't have one...
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

module.exports = MarketCalculator;