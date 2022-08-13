BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "item_sale_history" (
	"itemID"	INTEGER,
	"hq"	INTEGER,
	"pricePerUnit"	INTEGER,
	"quantity"	INTEGER,
	"buyerName"	TEXT,
	"onMannequin"	INTEGER,
	"timestamp"	INTEGER,
	"worldName"	TEXT,
	"worldID"	INTEGER
);
CREATE TABLE IF NOT EXISTS "worlds" (
	"worldID"	INTEGER,
	"worldName"	TEXT
);
CREATE TABLE IF NOT EXISTS "item_sale_median_data" (
	"itemID"	INTEGER,
	"medianPrice"	INTEGER,
	"worldName"	TEXT,
	"saleCount"	INTEGER
);
CREATE INDEX IF NOT EXISTS "item_world_sale" ON "item_sale_history" (
	"itemID"	ASC,
	"worldName"
);
CREATE INDEX IF NOT EXISTS "item_median_data_ID" ON "item_sale_median_data" (
	"itemID"	ASC
);
CREATE INDEX IF NOT EXISTS "item_median_data_ID_worldName" ON "item_sale_history" (
	"itemID"	ASC,
	"worldName"
);
COMMIT;
