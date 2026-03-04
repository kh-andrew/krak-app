-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'DRIVER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "ShopifySyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "hubspotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "shopifyOrderNumber" TEXT,
    "customerId" TEXT NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "lineItems" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "shopifySyncStatus" "ShopifySyncStatus" NOT NULL DEFAULT 'PENDING',
    "shopifyUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hubspotSyncAt" TIMESTAMP(3),
    "hubspotSynced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "deliveryAddress" TEXT NOT NULL,
    "deliveryNotes" TEXT,
    "signatureUrl" TEXT,
    "photoUrl" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deliveryNotesInternal" TEXT,
    "failedReason" TEXT,
    "hubspotSynced" BOOLEAN NOT NULL DEFAULT false,
    "hubspotSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorEmail" TEXT,
    "entityType" TEXT NOT NULL DEFAULT 'order',
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "notes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER,
    "reorderQty" INTEGER,
    "lastAgentAction" TEXT,
    "agentConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
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

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleComponent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "parentSku" TEXT NOT NULL,
    "childSku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "version" TEXT DEFAULT 'v1',
    "effectiveFrom" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(6),
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BundleComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandForecast" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "productId" TEXT NOT NULL,
    "avgDailySales" DECIMAL(10,2),
    "daysUntilStockout" INTEGER,
    "suggestedReorderQty" INTEGER,
    "confidence" DECIMAL(3,2),
    "calculatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(6),

    CONSTRAINT "DemandForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
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

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
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

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'warehouse',
    "address" TEXT,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'beverage',
    "subcategory" TEXT,
    "brand" TEXT DEFAULT 'krak',
    "unitWeight" DECIMAL(10,2),
    "unitVolume" INTEGER,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "costPrice" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'USD',
    "isBundle" BOOLEAN DEFAULT false,
    "bundleComponents" JSONB DEFAULT '[]',
    "componentOf" JSONB DEFAULT '[]',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
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

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "poId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderedQty" INTEGER NOT NULL,
    "receivedQty" INTEGER DEFAULT 0,
    "unitCost" DECIMAL(10,2),

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playing_with_neon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL,

    CONSTRAINT "playing_with_neon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_shopifyId_key" ON "customers"("shopifyId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_hubspotId_key" ON "customers"("hubspotId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_shopifyId_key" ON "orders"("shopifyId");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_shopifyId_idx" ON "orders"("shopifyId");

-- CreateIndex
CREATE INDEX "orders_hubspotSynced_idx" ON "orders"("hubspotSynced");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_orderId_idx" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_assignedToId_idx" ON "deliveries"("assignedToId");

-- CreateIndex
CREATE INDEX "deliveries_deliveredAt_idx" ON "deliveries"("deliveredAt");

-- CreateIndex
CREATE INDEX "deliveries_hubspotSynced_idx" ON "deliveries"("hubspotSynced");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_createdAt_idx" ON "activity_logs"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_orderId_idx" ON "activity_logs"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_shopifyId_key" ON "webhook_events"("shopifyId");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_sku_key" ON "inventory"("sku");

-- CreateIndex
CREATE INDEX "inventory_available_idx" ON "inventory"("available");

-- CreateIndex
CREATE INDEX "inventory_sku_idx" ON "inventory"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchCode_key" ON "Batch"("batchCode");

-- CreateIndex
CREATE INDEX "idx_batch_product" ON "Batch"("productId");

-- CreateIndex
CREATE INDEX "idx_bundle_parent" ON "BundleComponent"("parentSku", "isActive");

-- CreateIndex
CREATE INDEX "idx_bundle_version" ON "BundleComponent"("parentSku", "version");

-- CreateIndex
CREATE UNIQUE INDEX "BundleComponent_parentSku_childSku_version_key" ON "BundleComponent"("parentSku", "childSku", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DemandForecast_productId_calculatedAt_key" ON "DemandForecast"("productId", "calculatedAt");

-- CreateIndex
CREATE INDEX "idx_inventory_location" ON "Inventory"("locationId");

-- CreateIndex
CREATE INDEX "idx_inventory_product" ON "Inventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_locationId_key" ON "Inventory"("productId", "locationId");

-- CreateIndex
CREATE INDEX "idx_movement_created" ON "InventoryMovement"("createdAt");

-- CreateIndex
CREATE INDEX "idx_movement_inventory" ON "InventoryMovement"("inventoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "idx_product_active" ON "Product"("isActive");

-- CreateIndex
CREATE INDEX "idx_product_sku" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "idx_po_status" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderItem_poId_productId_key" ON "PurchaseOrderItem"("poId", "productId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BundleComponent" ADD CONSTRAINT "BundleComponent_childSku_fkey" FOREIGN KEY ("childSku") REFERENCES "Product"("sku") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BundleComponent" ADD CONSTRAINT "BundleComponent_parentSku_fkey" FOREIGN KEY ("parentSku") REFERENCES "Product"("sku") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DemandForecast" ADD CONSTRAINT "DemandForecast_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

