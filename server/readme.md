## Get the updated item IDs
1. Download the latest items.json file from https://github.com/Universalis-FFXIV/mogboard-next/blob/main/data/game/en/items.json and save it in the `/src/` directory (replace the existing items.json file).
2. Delete `item_ids.json` file in the `/src/` directory if it exists.
3. Run the following command in the server directory:  
    `node src/extract_item_ids.js`
4. The item IDs will be extracted and saved to the item_ids.json file.

## Get the updated crafting recipes

Download the latest crafting.json file from https://github.com/xivapi/ffxiv-datamining/blob/master/csv/Recipe.csv and save it in the `/src/` directory (replace the existing file).

## Get updated item descriptions and info

Download the latest item_info.json file from https://github.com/xivapi/ffxiv-datamining/blob/master/csv/Item.csv and save it in the `/src/` directory (replace the existing file).