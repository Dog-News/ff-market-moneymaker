-- Create table for item sale history
CREATE TABLE item_sale_history (
    itemID INTEGER,
    hq INTEGER,
    pricePerUnit INTEGER,
    quantity INTEGER,
    buyerName TEXT,
    onMannequin INTEGER,
    timestamp INTEGER,
    worldName TEXT,
    worldID INTEGER,
    dataCenterName TEXT
);

-- Indexes for item_sale_history
CREATE INDEX idx_item_sale_history_itemID ON item_sale_history (itemID);
CREATE INDEX idx_item_sale_history_dataCenterName ON item_sale_history (dataCenterName);
CREATE INDEX idx_item_sale_history_worldID ON item_sale_history (worldID);

-- Create table for NQ item sale median data
CREATE TABLE item_sale_median_data_nq (
    itemID INTEGER,
    dataCenterName TEXT,
    medianPrice INTEGER,
    saleCount INTEGER
);

-- Indexes for item_sale_median_data_nq
CREATE INDEX idx_item_sale_median_data_nq_itemID ON item_sale_median_data_nq (itemID);
CREATE INDEX idx_item_sale_median_data_nq_dataCenterName ON item_sale_median_data_nq (dataCenterName);

-- Create table for HQ item sale median data
CREATE TABLE item_sale_median_data_hq (
    itemID INTEGER,
    dataCenterName TEXT,
    medianPrice INTEGER,
    saleCount INTEGER
);

-- Indexes for item_sale_median_data_hq
CREATE INDEX idx_item_sale_median_data_hq_itemID ON item_sale_median_data_hq (itemID);
CREATE INDEX idx_item_sale_median_data_hq_dataCenterName ON item_sale_median_data_hq (dataCenterName);

-- Create table for worlds
CREATE TABLE worlds (
    worldID TEXT,
    worldName TEXT
);

-- Index for worlds
CREATE INDEX idx_worlds_worldID ON worlds (worldID);

-- Create table for item recipes
CREATE TABLE item_recipes (
    "Item{Result}" INTEGER,
    "Item{Ingredient}[0]" INTEGER,
    "Item{Ingredient}[1]" INTEGER,
    "Item{Ingredient}[2]" INTEGER,
    "Item{Ingredient}[3]" INTEGER,
    "Item{Ingredient}[4]" INTEGER,
    "Item{Ingredient}[5]" INTEGER,
    "Item{Ingredient}[6]" INTEGER,
    "Item{Ingredient}[7]" INTEGER,
    "Item{Ingredient}[8]" INTEGER,
    "Item{Ingredient}[9]" INTEGER,
    "Amount{Ingredient}[0]" INTEGER,
    "Amount{Ingredient}[1]" INTEGER,
    "Amount{Ingredient}[2]" INTEGER,
    "Amount{Ingredient}[3]" INTEGER,
    "Amount{Ingredient}[4]" INTEGER,
    "Amount{Ingredient}[5]" INTEGER,
    "Amount{Ingredient}[6]" INTEGER,
    "Amount{Ingredient}[7]" INTEGER,
    "Amount{Ingredient}[8]" INTEGER,
    "Amount{Ingredient}[9]" INTEGER,
    CraftType INTEGER
);

-- Index for item_recipes
CREATE INDEX idx_item_recipes_itemResult ON item_recipes ("Item{Result}");

-- Create table for item info
CREATE TABLE item_info (
    itemID INTEGER,
    Name TEXT
);

-- Index for item_info
CREATE INDEX idx_item_info_itemID ON item_info (itemID);

-- Create table for craft types
CREATE TABLE craft_type (
    craftTypeID INTEGER,
    Name TEXT
);

-- Index for craft_type
CREATE INDEX idx_craft_type_craftTypeID ON craft_type (craftTypeID);