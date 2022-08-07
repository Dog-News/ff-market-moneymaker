import {MarketCalculator} from './market-calculator';
import Koa from 'koa';
const Router = require('koa-router');
const koaCors = require('@koa/cors');
const app = new Koa();
const router = new Router();
const market = new MarketCalculator();

/**************************************************************************
 ************* API routes *************************************************
**************************************************************************/

// Default response
router.get('/', (ctx: Koa.Context, next: Function) => {
    ctx.body = 'Hello there';
});

// Default response
router.get('/api/test', (ctx: Koa.Context, next: Function) => {
    // console.log(ctx.params.itemID);
    // const result = market.getCraftedItemCostAndIngredients(ctx.params.itemID);
    market.test();
    ctx.body = "done";
});

// api get median price for all items
router.get('/api/getMedianSoldPrice/allItems/:dataCenterName', async (ctx: Koa.Context, next: Function) => {
    const medianSoldPriceList = market.getAllItemsAndLowestSaleMedians(ctx.params.dataCenterName);
    ctx.body = medianSoldPriceList;
});

// api get craftableItems
router.get('/api/getCraftableItems/:dataCenterName', async (ctx: Koa.Context, next: Function) => {
    const craftableItems = market.getCraftableItemsAndMedians(ctx.params.dataCenterName);
    ctx.body = craftableItems;
});

// update item data... WARNING DO NOT DOTHIS UNLESS YOU REALLY NEED TO
router.get('/api/updateSaleData', async (ctx: Koa.Context, next: Function) => {
    console.log("Updating sale history data...THIS MAY TAKE A WHILE!");
    ctx.body = await market.updateItemSaleHistory();
});

app.use(koaCors());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(4000);    