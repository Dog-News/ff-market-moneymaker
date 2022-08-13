"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketCalculator = void 0;
var axios_1 = __importDefault(require("axios"));
var axios_retry_1 = __importDefault(require("axios-retry"));
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var item_ids_json_1 = __importDefault(require("./item_ids.json"));
var MarketCalculator = (function () {
    function MarketCalculator() {
        this.baseURL = "https://universalis.app/api/v2/history";
        this.dataCenters = [
            "Primal",
            "Crystal",
            "Aether"
        ];
        this.db = new better_sqlite3_1.default('./database/ffmarket.db');
        this.db.pragma('journal_mode = WAL');
        this.worlds = this.getWorldNameAndIDs();
        this.item_limit = 50;
        this.rate_limit = 1000;
        this.entries_to_return = 999999;
        this.entries_within = 172800;
    }
    MarketCalculator.prototype.updateItemSaleHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var saleHistory;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getItemSaleHistoryFromUniversalis()];
                    case 1:
                        saleHistory = _a.sent();
                        this.deleteItemSaleHistoryFromSQL();
                        this.insertNewSaleDataToSQL(saleHistory);
                        console.log("Updated item sale history.");
                        console.log("Clearing calculated median data.");
                        this.deleteItemSaleMediansFromSQL('nq');
                        this.deleteItemSaleMediansFromSQL('hq');
                        this.calculateMedianSalePricesAndInsertToSQL();
                        return [2, "done"];
                }
            });
        });
    };
    MarketCalculator.prototype.test = function () {
        this.calculateMedianSalePricesAndInsertToSQL();
    };
    MarketCalculator.prototype.insertNewSaleDataToSQL = function (saleData) {
        for (var _i = 0, saleData_1 = saleData; _i < saleData_1.length; _i++) {
            var item = saleData_1[_i];
            var insertStatement = this.db.prepare('INSERT INTO item_sale_history VALUES(?,?,?,?,?,?,?,?,?,?)');
            for (var _a = 0, _b = item.entries; _a < _b.length; _a++) {
                var entry = _b[_a];
                var itemID = item.itemID || null;
                var hq = entry.hq ? 1 : 0;
                var pricePerUnit = entry.pricePerUnit || null;
                var quantity = entry.quantity || null;
                var buyerName = entry.buyerName || null;
                var onMannequin = entry.onMannequin ? 1 : 0;
                var timestamp = entry.timestamp || null;
                var worldName = entry.worldName || null;
                var worldID = entry.worldID || null;
                var dataCenterName = item.dcName || null;
                insertStatement.run(itemID, hq, pricePerUnit, quantity, buyerName, onMannequin, timestamp, worldName, worldID, dataCenterName);
            }
        }
    };
    MarketCalculator.prototype.deleteItemSaleHistoryFromSQL = function () {
        this.db.exec('DELETE FROM item_sale_history', function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Deleted item_sale_history table contents.");
            }
            ;
        });
    };
    MarketCalculator.prototype.deleteItemSaleMediansFromSQL = function (quality) {
        this.db.exec("DELETE FROM item_sale_median_data_".concat(quality), function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log("Cleared normal quality median data.");
            }
        });
    };
    MarketCalculator.prototype.calculateMedianSalePricesAndInsertToSQL = function () {
        console.log("Calculating new median sale data...");
        var selectDistinctItems = this.db.prepare('SELECT DISTINCT itemID, dataCenterName FROM item_sale_history');
        var itemList = selectDistinctItems.all();
        for (var _i = 0, itemList_1 = itemList; _i < itemList_1.length; _i++) {
            var item = itemList_1[_i];
            var selectStatement2 = this.db.prepare('SELECT pricePerUnit, hq FROM item_sale_history WHERE itemID = ? AND dataCenterName = ? ORDER BY pricePerUnit DESC');
            var dataCenterSales = selectStatement2.all(item.itemID, item.dataCenterName);
            var salesNQ = [];
            var salesHQ = [];
            var NQSaleCount = 0;
            var HQSaleCount = 0;
            for (var _a = 0, dataCenterSales_1 = dataCenterSales; _a < dataCenterSales_1.length; _a++) {
                var sale = dataCenterSales_1[_a];
                if (sale.hq) {
                    salesHQ.push(sale.pricePerUnit);
                    HQSaleCount++;
                }
                else {
                    salesNQ.push(sale.pricePerUnit);
                    NQSaleCount++;
                }
            }
            var medianNQ = this.getDataCenterItemSaleMedian(salesNQ);
            var medianHQ = this.getDataCenterItemSaleMedian(salesHQ);
            if (salesNQ.length > 0) {
                this.insertDataCenterItemSaleMediansToSQL(item, medianNQ, NQSaleCount, 'nq');
            }
            if (salesHQ.length > 0) {
                this.insertDataCenterItemSaleMediansToSQL(item, medianHQ, HQSaleCount, 'hq');
            }
        }
        return "done";
    };
    MarketCalculator.prototype.getDataCenterItemSaleMedian = function (sales) {
        var mid = Math.floor(sales.length / 2);
        var nums = __spreadArray([], sales, true).sort(function (a, b) { return a.pricePerUnit - b.pricePerUnit; });
        var median = sales.length % 2 !== 0 ? nums[mid].pricePerUnit : (nums[mid - 1].pricePerUnit + nums[mid].pricePerUnit) / 2;
        return median;
    };
    MarketCalculator.prototype.getWorldNameAndIDs = function () {
        var selectStatement = this.db.prepare('SELECT * FROM worlds');
        var worldDataResults = selectStatement.all();
        var worldDataFormatted = new Map();
        for (var _i = 0, worldDataResults_1 = worldDataResults; _i < worldDataResults_1.length; _i++) {
            var worldData = worldDataResults_1[_i];
            worldDataFormatted.set(worldData.worldID, worldData.worldName);
        }
        return worldDataFormatted;
    };
    MarketCalculator.prototype.getItemSaleHistoryFromUniversalis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var saleHistory, _i, _a, dataCenter, idArray, urlItemList, i, requestURL, response, item;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        saleHistory = [];
                        _i = 0, _a = this.dataCenters;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3, 5];
                        dataCenter = _a[_i];
                        idArray = item_ids_json_1.default.slice();
                        (0, axios_retry_1.default)(axios_1.default, {
                            retries: 20,
                            retryDelay: function () { return 1000 * 5; },
                            retryCondition: function (error) {
                                var _a;
                                return ((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) != 200 || true;
                            }
                        });
                        _b.label = 2;
                    case 2:
                        if (!(idArray.length > 0)) return [3, 4];
                        urlItemList = [];
                        for (i = 0; i < this.item_limit; i++) {
                            urlItemList.push(idArray.pop());
                        }
                        requestURL = "".concat(this.baseURL, "/").concat(dataCenter, "/").concat(urlItemList.toString(), "?entriesToReturn=").concat(this.entries_to_return, "&entriesWithin=").concat(this.entries_within);
                        console.log(requestURL);
                        return [4, (0, axios_1.default)({
                                method: "get",
                                timeout: 1000 * 30,
                                url: requestURL
                            })];
                    case 3:
                        response = _b.sent();
                        for (item in response.data.items) {
                            saleHistory.push(response.data.items[item]);
                        }
                        this.sleep(this.rate_limit);
                        return [3, 2];
                    case 4:
                        _i++;
                        return [3, 1];
                    case 5: return [2, saleHistory];
                }
            });
        });
    };
    MarketCalculator.prototype.insertDataCenterItemSaleMediansToSQL = function (item, medianNQ, saleCount, quality) {
        var insertStatement1 = this.db.prepare("INSERT INTO item_sale_median_data_".concat(quality, " VALUES(?, ?, ?, ?)"));
        insertStatement1.run(item.itemID, item.dataCenterName, Math.floor(medianNQ), saleCount);
        console.log("Inserted ".concat(item.itemID, " NQ median"));
    };
    MarketCalculator.prototype.getAllItemsAndLowestSaleMedians = function (selectedDataCenter) {
        var selectStatement1 = this.db.prepare('SELECT DISTINCT itemID FROM item_sale_history');
        var itemList = selectStatement1.all();
        var itemMedianData = [];
        for (var _i = 0, itemList_2 = itemList; _i < itemList_2.length; _i++) {
            var item = itemList_2[_i];
            var itemLowestMedianNormalQuality = this.getLowestMedianSaleDataAndselectedDataCenter(item.itemID, selectedDataCenter, 'nq');
            var itemLowestMedianHighQuality = this.getLowestMedianSaleDataAndselectedDataCenter(item.itemID, selectedDataCenter, 'hq');
            if (!!itemLowestMedianNormalQuality) {
                itemMedianData.push(this.getCalculatedProfits(itemLowestMedianNormalQuality));
            }
            if (!!itemLowestMedianHighQuality) {
                itemMedianData.push(this.getCalculatedProfits(itemLowestMedianHighQuality));
            }
        }
        itemMedianData.sort(function (a, b) { return a.predictedTotalProfit < b.predictedTotalProfit ? 1 : -1; });
        return itemMedianData;
    };
    MarketCalculator.prototype.getLowestMedianSaleDataAndselectedDataCenter = function (itemID, selectedDataCenter, quality) {
        var hq = (quality == 'hq') ? 1 : 0;
        var selectStatement = this.db.prepare("SELECT\n                item_sale_median_data_".concat(quality, ".itemID,\n                item_info.Name as itemName,\n                item_sale_median_data_").concat(quality, ".medianPrice, \n                --item_sale_median_data_").concat(quality, ".worldName,\n                item_sale_median_data_").concat(quality, ".dataCenterName,\n                item_sale_median_data_").concat(quality, ".saleCount,\n                ").concat(hq, " as hq,\n                (SELECT medianPrice FROM item_sale_median_data_").concat(quality, " WHERE itemID = @itemID AND dataCenterName = @selectedDataCenter) as selectedDataCenterMedian,\n                (SELECT saleCount FROM item_sale_median_data_").concat(quality, " WHERE itemID = @itemID AND dataCenterName = @selectedDataCenter) as selectedSaleCount,\n                (SELECT SUM(quantity) FROM item_sale_history WHERE itemID = @itemID AND hq = ").concat(hq, " LIMIT 1) as quantitySold,\n                (SELECT AVG(quantity) FROM item_sale_history WHERE itemID = @itemID AND  hq = ").concat(hq, " LIMIT 1) as averageStackSize\n            FROM item_sale_median_data_").concat(quality, "\n            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_").concat(quality, ".itemID\n            WHERE item_sale_median_data_").concat(quality, ".itemID = @itemID\n            ORDER BY medianPrice ASC LIMIT 1"));
        var itemLowestMedianAndselectedDataCenter = selectStatement.get({ itemID: itemID, selectedDataCenter: selectedDataCenter });
        return itemLowestMedianAndselectedDataCenter;
    };
    MarketCalculator.prototype.getMedianSaleDataForselectedDataCenter = function (itemID, selectedDataCenter, quality) {
        var hq = (quality == 'hq') ? 1 : 0;
        var selectStatement = this.db.prepare("SELECT\n                medianPrice as medianSalePrice,\n                --worldName,\n                dataCenterName,\n                ".concat(hq, " as hq\n            FROM item_sale_median_data_").concat(quality, "\n            WHERE itemID = @itemID AND dataCenterName = @selectedDataCenter\n            ORDER BY medianPrice ASC LIMIT 1"));
        var itemMedianSaleData = selectStatement.get({ itemID: itemID, selectedDataCenter: selectedDataCenter });
        return itemMedianSaleData;
    };
    MarketCalculator.prototype.getCalculatedProfits = function (itemData) {
        itemData.difference = Math.floor(itemData.selectedDataCenterMedian - itemData.medianPrice);
        itemData.predictedTotalProfit = (itemData.averageStackSize * itemData.selectedDataCenterMedian) - (itemData.averageStackSize * itemData.medianPrice);
        itemData.profitPercentage = Math.floor((itemData.difference / itemData.medianPrice) * 100);
        return itemData;
    };
    MarketCalculator.prototype.getCraftingProfitPercentage = function (totalCraftCost, salePrice) {
        if (salePrice === 0) {
            return 0;
        }
        ;
        return Math.floor(((salePrice - totalCraftCost) / salePrice) * 100);
    };
    MarketCalculator.prototype.getCraftableItemsAndMedians = function (selectedDataCenter) {
        var selectStatement = this.db.prepare("\n            SELECT DISTINCT \n                item_recipes.[Item{Result}] as itemID,\n                item_info.Name as itemName\n            FROM item_recipes \n            LEFT JOIN item_info ON item_info.itemID = item_recipes.[Item{Result}]\n            WHERE [Item{Result}] <> 0");
        var craftableItems = selectStatement.all();
        var craftableItemsWithMedianData = [];
        for (var _i = 0, craftableItems_1 = craftableItems; _i < craftableItems_1.length; _i++) {
            var item = craftableItems_1[_i];
            var normalQualityMedianData = this.getMedianSaleDataForselectedDataCenter(item.itemID, selectedDataCenter, 'nq');
            var highQualityMedianData = this.getMedianSaleDataForselectedDataCenter(item.itemID, selectedDataCenter, 'hq');
            var recipes = this.getCraftedItemCostAndIngredients(item.itemID);
            var craftTypes = recipes.map(function (recipe) { return recipe.craftType; });
            var hqAvgStackSize = this.getItemAvgStackSize(item.itemID, 'hq', selectedDataCenter);
            var nqAvgStackSize = this.getItemAvgStackSize(item.itemID, 'nq', selectedDataCenter);
            var totalCraftCost = this.getTotalCraftCost(recipes);
            var hqVolume = this.getItemSaleVolume(item.itemID, 'hq', selectedDataCenter);
            var nqVolume = this.getItemSaleVolume(item.itemID, 'nq', selectedDataCenter);
            if (!!normalQualityMedianData) {
                craftableItemsWithMedianData.push(this.formatCraftableItemData(item, selectedDataCenter, Math.floor(normalQualityMedianData.medianSalePrice * nqAvgStackSize), recipes, craftTypes, Math.floor(totalCraftCost * nqAvgStackSize), nqVolume, Math.floor(nqAvgStackSize), 'nq'));
            }
            if (!!highQualityMedianData) {
                craftableItemsWithMedianData.push(this.formatCraftableItemData(item, selectedDataCenter, Math.floor(highQualityMedianData.medianSalePrice * hqAvgStackSize), recipes, craftTypes, Math.floor(totalCraftCost * hqAvgStackSize), hqVolume, Math.floor(hqAvgStackSize), 'hq'));
            }
        }
        return craftableItemsWithMedianData;
    };
    MarketCalculator.prototype.formatCraftableItemData = function (item, selectedDataCenter, medianSalePrice, recipes, craftTypes, totalCraftCost, volume, avgStackSize, quality) {
        var craftableItem = {
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
    };
    MarketCalculator.prototype.getCraftedItemCostAndIngredients = function (itemID) {
        var selectStatement = this.db.prepare("SELECT *, craft_type.Name as craftTypeName FROM item_recipes LEFT JOIN craft_type ON craft_type.craftTypeID = item_recipes.CraftType WHERE [Item{Result}] = @itemID");
        var itemRecipes = selectStatement.all({ itemID: itemID });
        var recipeDetails = [];
        for (var _i = 0, itemRecipes_1 = itemRecipes; _i < itemRecipes_1.length; _i++) {
            var recipe = itemRecipes_1[_i];
            var craftType = recipe.craftTypeName;
            var ingredients = [];
            var maxIngredients = 9;
            for (var i = 0; i <= maxIngredients; i++) {
                if (recipe["Item{Ingredient}[".concat(i, "]")] > 0) {
                    var ingredientItemID = recipe["Item{Ingredient}[".concat(i, "]")];
                    var ingredientAmount = recipe["Amount{Ingredient}[".concat(i, "]")];
                    ingredients.push(this.getIngedientCost(ingredientItemID, ingredientAmount));
                }
            }
            recipeDetails.push({ craftType: craftType, ingredients: ingredients });
        }
        return recipeDetails;
    };
    MarketCalculator.prototype.getTotalCraftCost = function (recipes) {
        var recipeCosts = [];
        for (var _i = 0, recipes_1 = recipes; _i < recipes_1.length; _i++) {
            var recipe = recipes_1[_i];
            var totalRecipeCost = 0;
            for (var _a = 0, _b = recipe.ingredients; _a < _b.length; _a++) {
                var ingredient = _b[_a];
                totalRecipeCost += ingredient.predictedCost || 0;
            }
            recipeCosts.push(totalRecipeCost);
        }
        return Math.min.apply(Math, recipeCosts);
    };
    MarketCalculator.prototype.getItemSaleVolume = function (itemID, quality, selectedDataCenter) {
        var selectStatement = this.db.prepare("SELECT SUM(quantity) as totalQuantity FROM item_sale_history WHERE itemID = @itemID AND hq = @quality AND dataCenterName = @selectedDataCenter LIMIT 1");
        var volume = selectStatement.get({ itemID: itemID, quality: quality === 'hq' ? 1 : 0, selectedDataCenter: selectedDataCenter });
        return volume.totalQuantity;
    };
    MarketCalculator.prototype.getItemAvgStackSize = function (itemID, quality, selectedDataCenter) {
        var selectStatement = this.db.prepare("SELECT AVG(quantity) as avgStackSize FROM item_sale_history WHERE itemID = @itemID AND hq = @quality AND dataCenterName = @selectedDataCenter LIMIT 1");
        var avgStackSize = selectStatement.get({ itemID: itemID, quality: quality === 'hq' ? 1 : 0, selectedDataCenter: selectedDataCenter }).avgStackSize;
        return avgStackSize;
    };
    MarketCalculator.prototype.getIngedientCost = function (ingredientItemID, ingredientAmount) {
        var selectStatement = this.db.prepare("\n            SELECT\n                item_sale_median_data_hq.itemID,\n                item_info.Name as itemName,\n                item_sale_median_data_hq.medianPrice, \n                --item_sale_median_data_hq.worldName, \n                item_sale_median_data_hq.dataCenterName, \n                item_sale_median_data_hq.saleCount,\n                1 as hq\n            FROM item_sale_median_data_hq\n            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_hq.itemID\n            WHERE item_sale_median_data_hq.itemID = @itemID\n            UNION ALL\n            SELECT\n                item_sale_median_data_nq.itemID,\n                item_info.Name as itemName,\n                item_sale_median_data_nq.medianPrice, \n                --item_sale_median_data_nq.worldName, \n                item_sale_median_data_nq.dataCenterName, \n                item_sale_median_data_nq.saleCount,\n                0 as hq\n            FROM item_sale_median_data_nq\n            LEFT JOIN item_info ON item_info.itemID = item_sale_median_data_nq.itemID\n            WHERE item_sale_median_data_nq.itemID = @itemID\n            ORDER BY medianPrice ASC LIMIT 1");
        var ingredientInfo = selectStatement.get({ itemID: ingredientItemID });
        return {
            itemID: ingredientItemID,
            itemName: (ingredientInfo === null || ingredientInfo === void 0 ? void 0 : ingredientInfo.itemName) || null,
            lowestMedianPrice: (ingredientInfo === null || ingredientInfo === void 0 ? void 0 : ingredientInfo.medianPrice) || 0,
            lowestMedianWorld: (ingredientInfo === null || ingredientInfo === void 0 ? void 0 : ingredientInfo.dataCenterName) || null,
            ingredientAmount: ingredientAmount,
            predictedCost: Math.floor(((ingredientInfo === null || ingredientInfo === void 0 ? void 0 : ingredientInfo.medianPrice) || 0) * ingredientAmount),
            hq: (ingredientInfo === null || ingredientInfo === void 0 ? void 0 : ingredientInfo.hq) || null
        };
    };
    MarketCalculator.prototype.sleep = function (ms) {
        return new Promise(function (r) { return setTimeout(r, ms); });
    };
    return MarketCalculator;
}());
exports.MarketCalculator = MarketCalculator;
