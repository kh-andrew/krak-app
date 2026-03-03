import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/receive
// Receive stock with batch tracking - uses correct table names
export async function POST(req: Request) {
  const session = await requireAuth()
  
  try {
    const body = await req.json()
    const { sku, quantity, batchCode, notes } = body

    if (!sku || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'SKU and positive quantity required' },
        { status: 400 }
      )
    }

    // Find product using correct table name
    const productResult = await prisma.$queryRaw`
      SELECT id, sku, name FROM "Product" WHERE sku = ${sku.toUpperCase()} LIMIT 1
    `
    const product = (productResult as any[])[0]

    if (!product) {
      return NextResponse.json(
        { error: `Product ${sku} not found` },
        { status: 404 }
      )
    }

    // Get default location
    const locationResult = await prisma.$queryRaw`
      SELECT id FROM "Location" WHERE code = 'WH-HK-01' LIMIT 1
    `
    const location = (locationResult as any[])[0]

    if (!location) {
      return NextResponse.json(
        { error: 'Default location not found' },
        { status: 404 }
      )
    }

    // Find bundle components
    const componentsResult = await prisma.$queryRaw`
      SELECT "childSku", quantity 
      FROM "BundleComponent" 
      WHERE "parentSku" = ${sku.toUpperCase()} AND "isActive" = true
    `
    const bundleComponents = componentsResult as any[]

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update or create inventory for received SKU
      const existingInv = await tx.$queryRaw`
        SELECT id FROM "Inventory" 
        WHERE "productId" = ${product.id} AND "locationId" = ${location.id}
        LIMIT 1
      `

      if ((existingInv as any[]).length > 0) {
        await tx.$executeRaw`
          UPDATE "Inventory" 
          SET "currentStock" = "currentStock" + ${quantity},
              "available" = "available" + ${quantity},
              "lastMovementAt" = NOW()
          WHERE "productId" = ${product.id} AND "locationId" = ${location.id}
        `
      } else {
        await tx.$executeRaw`
          INSERT INTO "Inventory" (
            "productId", "locationId", "currentStock", "available", 
            "reorderPoint", "reorderQty"
          ) VALUES (
            ${product.id}, ${location.id}, ${quantity}, ${quantity},
            ${sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5},
            ${sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10}
          )
        `
      }

      // Log movement
      await tx.$executeRaw`
        INSERT INTO "InventoryMovement" (
          "inventoryId", type, quantity, reason, "performedBy", notes, "createdAt"
        ) VALUES (
          (SELECT id FROM "Inventory" WHERE "productId" = ${product.id} AND "locationId" = ${location.id} LIMIT 1),
          'in', ${quantity}, 'receipt', 
          ${session.user.id}, ${notes || `Received ${quantity} ${sku}`}, NOW()
        )
      `

      // If bundle, expand to components
      if (bundleComponents.length > 0) {
        for (const component of bundleComponents) {
          const componentProduct = await tx.$queryRaw`
            SELECT id FROM "Product" WHERE sku = ${component.childSku} LIMIT 1
          `
          
          if (!(componentProduct as any[])[0]) continue
          
          const componentId = (componentProduct as any[])[0].id
          const componentQty = quantity * component.quantity

          // Update component inventory
          const existingComponent = await tx.$queryRaw`
            SELECT id FROM "Inventory" 
            WHERE "productId" = ${componentId} AND "locationId" = ${location.id}
            LIMIT 1
          `

          if ((existingComponent as any[]).length > 0) {
            await tx.$executeRaw`
              UPDATE "Inventory" 
              SET "currentStock" = "currentStock" + ${componentQty},
                  "available" = "available" + ${componentQty},
                  "lastMovementAt" = NOW()
              WHERE "productId" = ${componentId} AND "locationId" = ${location.id}
            `
          } else {
            await tx.$executeRaw`
              INSERT INTO "Inventory" (
                "productId", "locationId", "currentStock", "available",
                "reorderPoint", "reorderQty"
              ) VALUES (
                ${componentId}, ${location.id}, ${componentQty}, ${componentQty},
                ${component.childSku === 'KFSS' ? 500 : 50},
                ${component.childSku === 'KFSS' ? 1000 : 100}
              )
            `
          }

          // Log component movement
          await tx.$executeRaw`
            INSERT INTO "InventoryMovement" (
              "inventoryId", type, quantity, reason, "sourceSku", "targetSku", 
              "conversionRatio", "performedBy", notes, "createdAt"
            ) VALUES (
              (SELECT id FROM "Inventory" WHERE "productId" = ${componentId} AND "locationId" = ${location.id} LIMIT 1),
              'conversion', ${componentQty}, 'bundle_break',
              ${sku}, ${component.childSku}, ${component.quantity},
              ${session.user.id}, ${`Converted from ${quantity} ${sku}`}, NOW()
            )
          `
        }
      }

      // Create batch if provided
      if (batchCode) {
        await tx.$executeRaw`
          INSERT INTO "Batch" (
            "batchCode", "productId", "locationId", "initialQty", "remainingQty", 
            status, "createdAt"
          ) VALUES (
            ${batchCode.toUpperCase()}, ${product.id}, ${location.id}, 
            ${quantity}, ${quantity}, 'active', NOW()
          )
        `
      }

      return { 
        success: true, 
        sku, 
        quantity,
        expanded: bundleComponents.length > 0 
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Receive stock error:', error)
    return NextResponse.json(
      { error: 'Failed to receive stock', details: String(error) },
      { status: 500 }
    )
  }
}
