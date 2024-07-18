## To get the updated item IDs

1. Download the latest items.json file from https://github.com/Universalis-FFXIV/mogboard-next/blob/main/data/game/en/items.json and save it in the `/src/` directory (replace the existing items.json file).
2. Delete `item_ids.json` file in the `/src/` directory if it exists.
3. Run the following command in the server directory:

```bash
node src/extract_item_ids.js
```

4. The item IDs will be extracted and saved to the item_ids.json file.