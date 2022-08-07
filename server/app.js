const MarketCalculator = require('./market-calculator');
const market = new MarketCalculator();
const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();

/**************************************************************************
 ************* API routes *************************************************
**************************************************************************/

// Default response
router.get('/', (ctx, next) => {
    ctx.body = 'Hello there';
});

// Default response
router.get('/api/test', (ctx, next) => {
    // console.log(ctx.params.itemID);
    // const result = market.getCraftedItemCostAndIngredients(ctx.params.itemID);
    market.calculateMedianSalePricesAndInsertToSQL();
    ctx.body = result;
});

// api get median price for all items
router.get('/api/getMedianSoldPrice/allItems/:dataCenterName', async (ctx, next) => {
    const medianSoldPriceList = market.getMedianDifference(ctx.params.dataCenterName);
    ctx.body = medianSoldPriceList;
});

// api get craftableItems
router.get('/api/getCraftableItems/:dataCenterName', async (ctx, next) => {
    const craftableItems = market.getCraftableItemsAndMedians(ctx.params.dataCenterName);
    ctx.body = craftableItems;
});

// update item data... WARNING DO NOT DOTHIS UNLESS YOU REALLY NEED TO
router.get('/api/updateSaleData', async (ctx, next) => {
    console.log("Updating sale history data...THIS MAY TAKE A WHILE!");
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



