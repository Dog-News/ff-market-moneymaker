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
            axiosRetry(Axios, {retries: 10, retryDelay: () => {return 1000 * 5}, retryCondition: (error) => {return error.response.status === 500}});
            while (idArray.length > 0) {
                let urlItemList = [];
                for (let i = 0; i < this.item_limit; i++) {
                    urlItemList.push(idArray.pop());
                }
                let requestURL = `${this.baseURL}/${dataCenter}/${urlItemList.toString()}?entriesWithin=${this.entries_within}`;
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
        console.log("DONE");

        this.calculateMedianSalePricesAndInsertToSQL();
    return "done";
    }

    calculateMedianSalePricesAndInsertToSQL() {
        // clear old data
        this.db.exec('DELETE FROM item_sale_median_data', (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Cleared median data.");
            }
        });

        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID, worldName FROM item_sale_history');
        const itemList = selectStatement1.all();        
        for (let item of itemList) {
            const selectStatement2 = this.db.prepare('SELECT pricePerUnit FROM item_sale_history WHERE itemID = ? AND worldName = ? ORDER BY pricePerUnit DESC');
            const worldSales = selectStatement2.all(item.itemID, item.worldName);
            let sales = [];
            for (let sale of worldSales) {
                sales.push(sale.pricePerUnit);
            }
            // math stuff
            const mid = Math.floor(sales.length / 2), 
            nums = [...sales].sort((a, b) => a - b);
            const median = sales.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
            // insert median data to SQL
            const insertStatement = this.db.prepare('INSERT INTO item_sale_median_data VALUES(?, ?, ?, ?)');
            insertStatement.run(item.itemID, Math.floor(median), item.worldName, worldSales.length);
            console.log("inserted median data");
        }
        return "testing";
    }

    // get list of item IDs and the lowest median sale price/world
    getMedianDifference(selectedWorld) {
        const selectStatement1 = this.db.prepare('SELECT DISTINCT itemID FROM item_sale_history');
        const itemList = selectStatement1.all();
        const itemMedianData = [] // store results here
        for (let item of itemList) {
            // const selectStatement2 = this.db.prepare('SELECT * FROM item_sale_median_data WHERE itemID = ? ORDER BY medianPrice ASC LIMIT 1');
            const selectStatement2 = this.db.prepare(
                `SELECT
                    itemID, 
                    medianPrice, 
                    worldName, 
                    saleCount,
                    (SELECT medianPrice FROM item_sale_median_data WHERE itemID = ? AND worldName = ?) as selectedWorldMedian
                FROM item_sale_median_data WHERE itemID = ? 
                ORDER BY medianPrice ASC LIMIT 1`
            );

            const itemLowestMedian = selectStatement2.get(item.itemID, selectedWorld, item.itemID);
            itemLowestMedian.difference = Math.floor(itemLowestMedian.selectedWorldMedian - itemLowestMedian.medianPrice);
            itemMedianData.push(itemLowestMedian);
            // console.log("got median");
        }
        itemMedianData.sort((a, b) => {return a.difference < b.difference ? 1 : -1});
        return itemMedianData;
    }

    // need to define our own sleep method since nodeJS doesn't have one...
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}

module.exports = MarketCalculator;