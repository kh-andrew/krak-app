-- Create inventory_movements table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "inventory_movements_inventoryId_idx" ON "inventory_movements"("inventoryId");
CREATE INDEX IF NOT EXISTS "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- Add foreign key
ALTER TABLE "inventory_movements" 
ADD CONSTRAINT "inventory_movements_inventoryId_fkey" 
FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;