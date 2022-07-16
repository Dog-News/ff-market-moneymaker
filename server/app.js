const MarketCalculator = require('./market-calculator');
const market = new MarketCalculator();
const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();

// const Axios = require('axios');
// const axiosRetry = require('axios-retry');
// const fs = require('fs');
// const sqlite3 = require('better-sqlite3')
// const db = new sqlite3('./database/ffmarket.db');
// db.pragma('journal_mode = WAL');
// const baseURL = "https://universalis.app/api/v2/history";

/**************************************************************************
 ************* API routes *************************************************
**************************************************************************/

// Default response
router.get('/', (ctx, next) => {
    ctx.body = 'Hello there';
});

// Default response
router.get('/test', (ctx, next) => {
    market.updateMedianSalePrices();
    ctx.body = 'testing';
});

// get median price for specific item
router.get('/api/getMedianSoldPrice/:itemID/:worldID', async (ctx, next) => {
    const medianSoldPriceList = market.getMedianDifference(ctx.params.worldID);
    ctx.body = medianSoldPriceList;
    // old code
    // const medianSoldPriceList = getMedianSoldPriceList(ctx.params.itemID);
    // // sort lowest to highest
    // medianSoldPriceList.sort((a, b) => {return a.medianSalePrice > b.medianSalePrice ? 1 : -1});
    // console.log(medianSoldPriceList);
    // // get selected world price
    // const selectedWorldPrice = getSelectedWorldPriceFromMedian(medianSoldPriceList, parseInt(ctx.params.worldID));
    // console.log(selectedWorldPrice);
    // ctx.body = {medianPriceData: medianSoldPriceList, selectedWorldPrice: selectedWorldPrice};
});

// api get median price for all items
router.get('/api/getMedianSoldPrice/allItems/:worldID', async (ctx, next) => {
    // get median price for all items
    const medianSoldPriceList = getMedianSoldPricesFromAllWorlds();
    // sort lowest to highest
    medianSoldPriceList.sort((a, b) => {return a.medianSalePrice > b.medianSalePrice ? 1 : -1});
    console.log(medianSoldPriceList);
    // get selected world price
    const selectedWorldPrice = getSelectedWorldPriceFromMedian(medianSoldPriceList, parseInt(ctx.params.worldID));
    console.log(selectedWorldPrice);
    ctx.body = {medianPriceData: medianSoldPriceList, selectedWorldPrice: selectedWorldPrice};
});

// update item data... WARNING DO NOT DOTHIS UNLESS YOU REALLY NEED TO
router.get('/api/updateSaleData', async (ctx, next) => {
    console.log("Updating sale history data...THIS MAY TAKE A WHILE!");
    // ctx.body = await updateSaleData();
    ctx.body = await market.updateItemSaleHistory();
});

app.use(cors());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(4000);    


/**************************************************************************
 ************* Functions *************************************************
**************************************************************************/

// get median price for specified world
function getSelectedWorldPriceFromMedian(medianPriceList, selectedWorldID) {
    return medianPriceList.filter((saleData) => saleData.worldID === selectedWorldID)[0].medianSalePrice || 0;
}

function getLowestMedianPrice(medianPriceList) {

}


// calculate median sold price, for specific item
// returns list of median sale price, per world
function getMedianSoldPriceList(itemID) {
    // sql
    const selectStatement = db.prepare('SELECT * FROM item_sale_history WHERE itemID = ?');
    const saleHistory = selectStatement.all(itemID);
    const worldNames = getWorldNameAndIDs();

    // add sale data to arrays
    let soldPrices = [];
    let worldIDs = [];
    for (let sale of saleHistory) {
        soldPrices.push([sale.worldID, sale.pricePerUnit]);
        if (worldIDs.indexOf(sale.worldID) === -1) {
            worldIDs.push(sale.worldID);
        }
    }

    // calculate median sale price for different worlds
    let worldMedianSaleData = [];
    for (let worldID of worldIDs) {
        let worldSoldPrices = soldPrices.filter((priceData) => {
            return priceData[0] === worldID
        }).map((priceData) => {return priceData[1]});

        // math stuff
        const mid = Math.floor(worldSoldPrices.length / 2), 
        nums = [...worldSoldPrices].sort((a, b) => a - b);
        const median = worldSoldPrices.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;

        // return value
        worldMedianSaleData.push({
            worldID: worldID, 
            worldName: worldNames.get(worldID), 
            medianSalePrice: Math.floor(median)
        });
    }

    return worldMedianSaleData;
};

// calculate median sold price, for ALL ITEMS
// this may take a while...
function getMedianSoldPriceListFromAllWorlds() {
    // sql
    const selectStatement = db.prepare('SELECT * FROM item_sale_history WHERE itemID = ?');
    const saleHistory = selectStatement.all(itemID);
    const worldNames = getWorldNameAndIDs();

    // add sale data to arrays
    let soldPrices = [];
    let worldIDs = [];
    for (let sale of saleHistory) {
        soldPrices.push([sale.worldID, sale.pricePerUnit]);
        if (worldIDs.indexOf(sale.worldID) === -1) {
            worldIDs.push(sale.worldID);
        }
    }

    // calculate median sale price for different worlds
    let worldMedianSaleData = [];
    for (let worldID of worldIDs) {
        let worldSoldPrices = soldPrices.filter((priceData) => {
            return priceData[0] === worldID
        }).map((priceData) => {return priceData[1]});

        // math stuff
        const mid = Math.floor(worldSoldPrices.length / 2), 
        nums = [...worldSoldPrices].sort((a, b) => a - b);
        const median = worldSoldPrices.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;

        // return value
        worldMedianSaleData.push({
            worldID: worldID, 
            worldName: worldNames.get(worldID), 
            medianSalePrice: Math.floor(median)
        });
    }

    return worldMedianSaleData;
};



