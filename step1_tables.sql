-- Step 1: Create tables without foreign keys
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT DEFAULT 'beverage',
    "subcategory" TEXT,
    "brand" TEXT DEFAULT 'krak',
    "unitWeight" DECIMAL(10,2),
    "unitVolume" INTEGER,
    "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "isBundle" BOOLEAN DEFAULT false,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_sku_key" UNIQUE ("sku")
);

CREATE TABLE IF NOT EXISTS "locations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'warehouse',
    "address" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    CONSTRAINT "locations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "locations_code_key" UNIQUE ("code")
);

CREATE TABLE IF NOT EXISTS "inventory" (
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
    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inventory_productId_locationId_key" UNIQUE ("productId", "locationId")
);

CREATE TABLE IF NOT EXISTS "inventory_movements" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "inventoryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "orderId" TEXT,
    "batchId" TEXT,
    "sourceSku" TEXT,
    "targetSku" TEXT,
    "conversionRatio" INTEGER,
    "performedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "batches" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "batchCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT,
    "manufacturedAt" TIMESTAMP(6),
    "expiryDate" TIMESTAMP(6),
    "initialQty" INTEGER NOT NULL,
    "remainingQty" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "batches_batchCode_key" UNIQUE ("batchCode")
);

CREATE TABLE IF NOT EXISTS "bundle_components" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "parentSku" TEXT NOT NULL,
    "childSku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "version" TEXT DEFAULT 'v1',
    "effectiveFrom" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(6),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bundle_components_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bundle_components_parentSku_childSku_version_key" UNIQUE ("parentSku", "childSku", "version")
);

CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "poNumber" TEXT NOT NULL,
    "supplier" TEXT,
    "status" TEXT DEFAULT 'draft',
    "totalItems" INTEGER DEFAULT 0,
    "totalQty" INTEGER DEFAULT 0,
    "totalValue" DECIMAL(12,2),
    "expectedDelivery" TIMESTAMP(6),
    "receivedAt" TIMESTAMP(6),
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_orders_poNumber_key" UNIQUE ("poNumber")
);

CREATE TABLE IF NOT EXISTS "purchase_order_items" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "poId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER DEFAULT 0,
    "unitCost" DECIMAL(10,2),
    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "purchase_order_items_poId_productId_key" UNIQUE ("poId", "productId")
);

CREATE TABLE IF NOT EXISTS "demand_forecasts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "productId" TEXT NOT NULL,
    "avgDailySales" DECIMAL(10,2),
    "daysUntilStockout" INTEGER,
    "suggestedReorderQty" INTEGER,
    "confidence" DECIMAL(3,2),
    "calculatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(6),
    CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demand_forecasts_productId_calculatedAt_key" UNIQUE ("productId", "calculatedAt")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "inventory_productId_idx" ON "inventory"("productId");
CREATE INDEX IF NOT EXISTS "inventory_locationId_idx" ON "inventory"("locationId");
CREATE INDEX IF NOT EXISTS "inventory_movements_inventoryId_idx" ON "inventory_movements"("inventoryId");
CREATE INDEX IF NOT EXISTS "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");
CREATE INDEX IF NOT EXISTS "batches_productId_idx" ON "batches"("productId");
CREATE INDEX IF NOT EXISTS "batches_batchCode_idx" ON "batches"("batchCode");
CREATE INDEX IF NOT EXISTS "products_sku_idx" ON "products"("sku");
CREATE INDEX IF NOT EXISTS "products_isActive_idx" ON "products"("isActive");
CREATE INDEX IF NOT EXISTS "bundle_components_parentSku_idx" ON "bundle_components"("parentSku");
CREATE INDEX IF NOT EXISTS "bundle_components_parentSku_version_idx" ON "bundle_components"("parentSku", "version");
CREATE INDEX IF NOT EXISTS "bundle_components_parentSku_isActive_idx" ON "bundle_components"("parentSku", "isActive");
CREATE INDEX IF NOT EXISTS "purchase_orders_status_idx" ON "purchase_orders"("status");