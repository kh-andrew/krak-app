-- Migrate old inventory table to new schema
-- Step 1: Create new inventory table with proper structure
CREATE TABLE IF NOT EXISTS "inventory_new" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "productId" TEXT NOT NULL,
    "locationId" TEXT,
    "currentStock" INTEGER DEFAULT 0,
    "reserved" INTEGER DEFAULT 0,
    "available" INTEGER DEFAULT 0,
    "reorderPoint" INTEGER,
    "reorderQty" INTEGER,
    "reorderLeadTime" INTEGER DEFAULT 7,
    "lastCountedAt" TIMESTAMP(6),
    "lastMovementAt" TIMESTAMP(6),
    CONSTRAINT "inventory_new_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_new_productId_locationId_key" UNIQUE ("productId", "locationId")
);

-- Step 2: Migrate data from old inventory table
-- Get the default location
DO $$
DECLARE
    default_location_id TEXT;
    product_record RECORD;
    inventory_record RECORD;
BEGIN
    -- Get or create default location
    SELECT id INTO default_location_id FROM locations WHERE code = 'WH-HK-01' LIMIT 1;
    
    IF default_location_id IS NULL THEN
        INSERT INTO locations (code, name, type) VALUES ('WH-HK-01', 'Hong Kong Warehouse', 'warehouse') RETURNING id INTO default_location_id;
    END IF;
    
    -- Migrate each inventory record
    FOR inventory_record IN SELECT * FROM inventory LOOP
        -- Find or create product
        SELECT id INTO product_record FROM products WHERE sku = inventory_record.sku LIMIT 1;
        
        IF product_record IS NULL THEN
            INSERT INTO products (sku, name, "basePrice", "isBundle") 
            VALUES (inventory_record.sku, inventory_record.name, 0, false)
            RETURNING id INTO product_record;
        END IF;
        
        -- Insert into new inventory table
        INSERT INTO inventory_new ("productId", "locationId", "currentStock", "available", "reorderPoint", "reorderQty")
        VALUES (product_record.id, default_location_id, inventory_record."currentStock", inventory_record.available, inventory_record."reorderPoint", inventory_record."reorderQty")
        ON CONFLICT ("productId", "locationId") DO UPDATE SET
            "currentStock" = EXCLUDED."currentStock",
            "available" = EXCLUDED."available";
    END LOOP;
END $$;

-- Step 3: Drop old table and rename new one
DROP TABLE IF EXISTS inventory;
ALTER TABLE inventory_new RENAME TO inventory;

-- Step 4: Add foreign keys
ALTER TABLE inventory ADD CONSTRAINT inventory_productId_fkey FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE inventory ADD CONSTRAINT inventory_locationId_fkey FOREIGN KEY ("locationId") REFERENCES locations(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS inventory_productId_idx ON inventory("productId");
CREATE INDEX IF NOT EXISTS inventory_locationId_idx ON inventory("locationId");