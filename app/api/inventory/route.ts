import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/inventory/receive
// Receive stock with FULL bundle expansion (KFSB → KFSP → KFSS)
export async function POST(req: Request) {
  try {
    const { sku, quantity, batchCode, notes } = await req.json()

    if (!sku || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'SKU and quantity required' }, { status: 400 })
    }

    const skuUpper = sku.toUpperCase()
    
    // Define bundle mappings
    const bundleMap: Record<string, { childSku: string; qty: number }[]> = {
      'KFSB': [{ childSku: 'KFSP', qty: 20 }],  // 1 box = 20 packs
      'KFSP': [{ childSku: 'KFSS', qty: 12 }]   // 1 pack = 12 singles
    }

    // Get location
    const locationResult = await prisma.$queryRaw`
      SELECT id FROM "Location" WHERE code = 'WH-HK-01' LIMIT 1
    `
    const location = (locationResult as any[])[0]
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Find or create product
    const productResult = await prisma.$queryRaw`
      SELECT id FROM "Product" WHERE sku = ${skuUpper} LIMIT 1
    `
    let productId = (productResult as any[])[0]?.id
    
    if (!productId) {
      // Create product if doesn't exist
      const newProduct = await prisma.$queryRaw`
        INSERT INTO "Product" (sku, name, "isBundle", "basePrice", "costPrice")
        VALUES (${skuUpper}, ${skuUpper}, ${bundleMap[skuUpper] ? true : false}, 0, 0)
        RETURNING id
      `
      productId = (newProduct as any[])[0].id
    }

    // Update inventory for received SKU
    await updateOrCreateInventory(productId, location.id, quantity, skuUpper)

    // Log movement for received SKU
    await logMovement(productId, location.id, quantity, 'receipt', skuUpper, notes || `Received ${quantity} ${skuUpper}`)

    // FULL BUNDLE EXPANSION
    const components = bundleMap[skuUpper]
    if (components) {
      for (const component of components) {
        const componentQty = quantity * component.qty
        
        // Find or create component product
        const compProductResult = await prisma.$queryRaw`
          SELECT id FROM "Product" WHERE sku = ${component.childSku} LIMIT 1
        `
        let compProductId = (compProductResult as any[])[0]?.id
        
        if (!compProductId) {
          const newComp = await prisma.$queryRaw`
            INSERT INTO "Product" (sku, name, "isBundle", "basePrice", "costPrice")
            VALUES (${component.childSku}, ${component.childSku}, 
              ${bundleMap[component.childSku] ? true : false}, 0, 0)
            RETURNING id
          `
          compProductId = (newComp as any[])[0].id
        }
        
        // Update component inventory
        await updateOrCreateInventory(compProductId, location.id, componentQty, component.childSku)
        
        // Log component movement
        await logMovement(compProductId, location.id, componentQty, 'bundle_break', 
          skuUpper, `Converted from ${quantity} ${skuUpper} to ${componentQty} ${component.childSku}`)
        
        // RECURSIVE: Expand component if it also has bundles (KFSP → KFSS)
        const subComponents = bundleMap[component.childSku]
        if (subComponents) {
          for (const subComp of subComponents) {
            const subCompQty = componentQty * subComp.qty
            
            // Find or create sub-component product
            const subProductResult = await prisma.$queryRaw`
              SELECT id FROM "Product" WHERE sku = ${subComp.childSku} LIMIT 1
            `
            let subProductId = (subProductResult as any[])[0]?.id
            
            if (!subProductId) {
              const newSub = await prisma.$queryRaw`
                INSERT INTO "Product" (sku, name, "isBundle", "basePrice", "costPrice")
                VALUES (${subComp.childSku}, ${subComp.childSku}, false, 0, 0)
                RETURNING id
              `
              subProductId = (newSub as any[])[0].id
            }
            
            // Update sub-component inventory
            await updateOrCreateInventory(subProductId, location.id, subCompQty, subComp.childSku)
            
            // Log sub-component movement
            await logMovement(subProductId, location.id, subCompQty, 'bundle_break',
              component.childSku, `Converted from ${componentQty} ${component.childSku} to ${subCompQty} ${subComp.childSku}`)
          }
        }
      }
    }

    // Create batch
    if (batchCode) {
      try {
        await prisma.$queryRaw`
          INSERT INTO "Batch" ("batchCode", "productId", "locationId", "initialQty", "remainingQty", status, "createdAt")
          VALUES (${batchCode.toUpperCase()}, ${productId}, ${location.id}, ${quantity}, ${quantity}, 'active', NOW())
        `
      } catch (e) {
        console.log('Batch exists:', batchCode)
      }
    }

    // Calculate total bottles
    let totalBottles = quantity
    if (skuUpper === 'KFSP') totalBottles = quantity * 12
    if (skuUpper === 'KFSB') totalBottles = quantity * 240

    return NextResponse.json({ 
      success: true, 
      sku: skuUpper, 
      quantity,
      totalBottles,
      message: `Received ${quantity} ${skuUpper} (${totalBottles} bottles total)`
    })

  } catch (error) {
    console.error('Receive error:', error)
    return NextResponse.json({ error: 'Failed', details: String(error) }, { status: 500 })
  }
}

// Helper: Update or create inventory
async function updateOrCreateInventory(productId: string, locationId: string, quantity: number, sku: string) {
  const existing = await prisma.$queryRaw`
    SELECT id FROM "Inventory" 
    WHERE "productId" = ${productId} AND "locationId" = ${locationId}
    LIMIT 1
  `
  
  if ((existing as any[]).length > 0) {
    await prisma.$executeRaw`
      UPDATE "Inventory" 
      SET "currentStock" = "currentStock" + ${quantity},
          "available" = "available" + ${quantity},
          "lastMovementAt" = NOW()
      WHERE "productId" = ${productId} AND "locationId" = ${locationId}
    `
  } else {
    await prisma.$executeRaw`
      INSERT INTO "Inventory" ("productId", "locationId", "currentStock", "available", "reorderPoint", "reorderQty")
      VALUES (${productId}, ${locationId}, ${quantity}, ${quantity},
        ${sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5},
        ${sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10})
    `
  }
}

// Helper: Log movement
async function logMovement(productId: string, locationId: string, quantity: number, 
  type: string, sourceSku: string, notes: string) {
  await prisma.$executeRaw`
    INSERT INTO "InventoryMovement" ("inventoryId", type, quantity, reason, "sourceSku", "performedBy", notes, "createdAt")
    VALUES (
      (SELECT id FROM "Inventory" WHERE "productId" = ${productId} AND "locationId" = ${locationId} LIMIT 1),
      ${type}, ${quantity}, 'receipt', ${sourceSku}, 'system', ${notes}, NOW()
    )
  `
}
