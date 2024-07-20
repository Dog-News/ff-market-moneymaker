const fs = require('fs');
const https = require('https');
const csv = require('csv-parser');
const Database = require('better-sqlite3');

const urls = [
    'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/Item.csv',
    'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/Recipe.csv',
    'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/CraftType.csv',
    'https://raw.githubusercontent.com/xivapi/ffxiv-datamining/master/csv/World.csv' // Added World URL
];

const localFiles = ['Item.csv', 'Recipe.csv', 'CraftType.csv', 'World.csv']; // Added World to local files

// Download files
function downloadFile(url, filename) {
    console.log(`Starting download: ${filename}`);
    const file = fs.createWriteStream(filename);
    https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded: ${filename}`);
            if (filename === 'Item.csv') {
                processItemCSV();
            } else if (filename === 'Recipe.csv') {
                processRecipeCSV();
            } else if (filename === 'CraftType.csv') {
                processCraftTypeCSV(); // Process CraftType CSV
            } else if (filename === 'World.csv') {
                processWorldCSV(); // Process World CSV
            }
        });
    }).on('error', (err) => {
        fs.unlink(filename);
        console.error(`Error downloading ${filename}: ${err.message}`);
    });
}

// Remove rows and process Item.csv
function processItemCSV() {
    const items = [];
    console.log('Processing Item.csv...');
    fs.createReadStream('Item.csv')
        .pipe(csv({ separator: ',', quote: '"', skipLines: 1 }))
        .on('data', (data) => {
            items.push(data);
        })
        .on('end', () => {
            console.log(`Read ${items.length} items from Item.csv`);
            if (items.length > 2) {
                items.splice(0, 1);
                items.splice(1, 1);
                console.log('Removed first and third rows from the data');
            } else {
                console.warn('Not enough rows to remove. Proceeding with existing data.');
            }
            updateItemDatabase(items);
        });
}

// Update the SQLite database for items
function updateItemDatabase(items) {
    const db = new Database('../database/ffmarket.db'); 
    console.log('Updating item_info database...');
    db.transaction(() => {
        console.log('Clearing existing data in item_info table...');
        db.exec("DELETE FROM item_info");
        const stmt = db.prepare("INSERT INTO item_info (itemID, Name) VALUES (?, ?)");
        items.forEach(item => {
            stmt.run(item['#'], item['Name']);
        });
        console.log(`Inserted ${items.length} items into item_info table.`);
    })();
    db.close();
    console.log('Item database update complete.');
}

// Remove rows and process Recipe.csv
function processRecipeCSV() {
    const recipes = [];
    console.log('Processing Recipe.csv...');
    fs.createReadStream('Recipe.csv')
        .pipe(csv({ separator: ',', quote: '"', skipLines: 1 }))
        .on('data', (data) => {
            recipes.push(data);
        })
        .on('end', () => {
            console.log(`Read ${recipes.length} recipes from Recipe.csv`);
            if (recipes.length > 2) {
                recipes.splice(0, 1);
                recipes.splice(1, 1);
                console.log('Removed first and third rows from the data');
            } else {
                console.warn('Not enough rows to remove. Proceeding with existing data.');
            }
            updateRecipeDatabase(recipes);
        });
}

// Update the SQLite database for recipes
function updateRecipeDatabase(recipes) {
    const db = new Database('../database/ffmarket.db'); 
    console.log('Updating item_recipes database...');
    db.transaction(() => {
        console.log('Clearing existing data in item_recipes table...');
        db.exec("DELETE FROM item_recipes");
        const stmt = db.prepare(`INSERT INTO item_recipes (
            "Item{Result}",
            "Item{Ingredient}[0]",
            "Item{Ingredient}[1]",
            "Item{Ingredient}[2]",
            "Item{Ingredient}[3]",
            "Item{Ingredient}[4]",
            "Item{Ingredient}[5]",
            "Item{Ingredient}[6]",
            "Item{Ingredient}[7]",
            "Item{Ingredient}[8]",
            "Item{Ingredient}[9]",
            "Amount{Ingredient}[0]",
            "Amount{Ingredient}[1]",
            "Amount{Ingredient}[2]",
            "Amount{Ingredient}[3]",
            "Amount{Ingredient}[4]",
            "Amount{Ingredient}[5]",
            "Amount{Ingredient}[6]",
            "Amount{Ingredient}[7]",
            "Amount{Ingredient}[8]",
            "Amount{Ingredient}[9]",
            "CraftType"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        recipes.forEach(recipe => {
            let values = [
                recipe['Item{Result}'],
                recipe['Item{Ingredient}[0]'],
                recipe['Item{Ingredient}[1]'],
                recipe['Item{Ingredient}[2]'],
                recipe['Item{Ingredient}[3]'],
                recipe['Item{Ingredient}[4]'],
                recipe['Item{Ingredient}[5]'],
                recipe['Item{Ingredient}[6]'],
                recipe['Item{Ingredient}[7]'],
                recipe['Item{Ingredient}[8]'],
                recipe['Item{Ingredient}[9]'],
                recipe['Amount{Ingredient}[0]'],
                recipe['Amount{Ingredient}[1]'],
                recipe['Amount{Ingredient}[2]'],
                recipe['Amount{Ingredient}[3]'],
                recipe['Amount{Ingredient}[4]'],
                recipe['Amount{Ingredient}[5]'],
                recipe['Amount{Ingredient}[6]'],
                recipe['Amount{Ingredient}[7]'],
                recipe['Amount{Ingredient}[8]'],
                recipe['Amount{Ingredient}[9]'],
                recipe['CraftType']
            ];

            if (values.length !== 22) {
                console.error(`Expected 22 values, but got ${values.length}. Recipe skipped:`, recipe);
                return;
            }
            
            try {
                stmt.run(...values);
                console.log(`Successfully inserted recipe with Item{Result}: ${recipe['Item{Result}']}`);
            } catch (error) {
                console.error(`Error inserting recipe with Item{Result}: ${recipe['Item{Result}']}. Error: ${error.message}`);
            }
        });
        console.log(`Finished processing recipes. Total processed: ${recipes.length}.`);
    })();
    db.close();
    console.log('Recipe database update complete.');
}

// Remove rows and process CraftType.csv
function processCraftTypeCSV() {
    const craftTypes = [];
    console.log('Processing CraftType.csv...');
    fs.createReadStream('CraftType.csv')
        .pipe(csv({ separator: ',', quote: '"', skipLines: 1 }))
        .on('data', (data) => {
            craftTypes.push(data);
        })
        .on('end', () => {
            console.log(`Read ${craftTypes.length} craft types from CraftType.csv`);
            // Remove the expected first and third rows (if any)
            if (craftTypes.length > 2) {
                craftTypes.splice(0, 1); // Remove first row
                craftTypes.splice(1, 1); // Remove third row (now at index 1)
                console.log('Removed first and third rows from the data');
            } else {
                console.warn('Not enough rows to remove. Proceeding with existing data.');
            }
            updateCraftTypeDatabase(craftTypes);
        });
}

// Update the SQLite database for craft types
function updateCraftTypeDatabase(craftTypes) {
    const db = new Database('../database/ffmarket.db'); 
    console.log('Updating craft_type database...');
    db.transaction(() => {
        console.log('Clearing existing data in craft_type table...');
        db.exec("DELETE FROM craft_type");
        const stmt = db.prepare("INSERT INTO craft_type (craftTypeID, Name) VALUES (?, ?)");

        craftTypes.forEach(craftType => {
            const craftTypeID = craftType['#']; // Extract craftTypeID from the first column
            const name = craftType['Name']; // Extract name
            stmt.run(craftTypeID, name);
            console.log(`Inserted craft type with craftTypeID: ${craftTypeID}`);
        });
        console.log(`Inserted ${craftTypes.length} craft types into craft_type table.`);
    })();
    db.close();
    console.log('Craft type database update complete.');
}

// Remove rows and process World.csv
function processWorldCSV() {
    const worlds = [];
    console.log('Processing World.csv...');
    fs.createReadStream('World.csv')
        .pipe(csv({ separator: ',', quote: '"', skipLines: 1 }))
        .on('data', (data) => {
            worlds.push(data);
        })
        .on('end', () => {
            console.log(`Read ${worlds.length} worlds from World.csv`);
            // Remove the expected first and third rows (if any)
            if (worlds.length > 2) {
                worlds.splice(0, 1); // Remove first row
                worlds.splice(1, 1); // Remove third row (now at index 1)
                console.log('Removed first and third rows from the data');
            } else {
                console.warn('Not enough rows to remove. Proceeding with existing data.');
            }
            updateWorldDatabase(worlds);
        });
}

// Update the SQLite database for worlds
function updateWorldDatabase(worlds) {
    const db = new Database('../database/ffmarket.db'); 
    console.log('Updating worlds database...');
    db.transaction(() => {
        console.log('Clearing existing data in worlds table...');
        db.exec("DELETE FROM worlds");
        const stmt = db.prepare("INSERT INTO worlds (worldID, worldName) VALUES (?, ?)");

        worlds.forEach(world => {
            const worldID = world['#']; // Extract worldID from the first column
            const worldName = world['Name']; // Extract world name
            stmt.run(worldID, worldName);
            console.log(`Inserted world with worldID: ${worldID}`);
        });
        console.log(`Inserted ${worlds.length} worlds into worlds table.`);
    })();
    db.close();
    console.log('Worlds database update complete.');
}

// Start downloading files
urls.forEach((url, index) => downloadFile(url, localFiles[index]));