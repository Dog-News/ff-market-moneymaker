const fs = require('fs');

function extractItemIds(jsonData) {
  return Object.values(jsonData).map(item => item.id);
}

// Read the JSON file
fs.readFile('items.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file items.json:', err);
    return;
  }

  try {
    // Parse the JSON data
    const jsonData = JSON.parse(data);

    // Extract the item IDs
    const itemIds = extractItemIds(jsonData);

    // Convert the array to JSON string
    const itemIdsJson = JSON.stringify(itemIds, null, 2);

    // Write the item IDs to a new file
    fs.writeFile('item_ids.json', itemIdsJson, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error writing to file item_ids.json:', writeErr);
      } else {
        console.log('Item IDs have been extracted from items.json and saved to item_ids.json');
        console.log('Total number of items:', itemIds.length);
      }
    });

  } catch (parseErr) {
    console.error('Error parsing JSON from items.json:', parseErr);
  }
});