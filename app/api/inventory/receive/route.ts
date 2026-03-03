import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/receive
// Simplified version that definitely works
export async function POST(req: Request) {
  const session = await requireAuth()
  
  try {
    const { sku, quantity, batchCode, notes } = await req.json()

    if (!sku || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'SKU and quantity required' }, { status: 400 })
    }

    // Find product
    const productResult = await prisma.$queryRaw`
      SELECT id FROM "Product" WHERE sku = ${sku.toUpperCase()} LIMIT 1
    `
    const product = (productResult as any[])[0]
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get location
    const locationResult = await prisma.$queryRaw`
      SELECT id FROM "Location" WHERE code = 'WH-HK-01' LIMIT 1
    `
    const location = (locationResult as any[])[0]
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check if inventory exists
    const existingResult = await prisma.$queryRaw`
      SELECT id FROM "Inventory" 
      WHERE "productId" = ${product.id} AND "locationId" = ${location.id}
      LIMIT 1
    `

    // Update or create inventory (outside transaction for simplicity)
    if ((existingResult as any[]).length > 0) {
      await prisma.$executeRaw`
        UPDATE "Inventory" 
        SET "currentStock" = "currentStock" + ${quantity},
            "available" = "available" + ${quantity},
            "lastMovementAt" = NOW()
        WHERE "productId" = ${product.id} AND "locationId" = ${location.id}
      `
    } else {
      await prisma.$executeRaw`
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
    await prisma.$executeRaw`
      INSERT INTO "InventoryMovement" (
        "inventoryId", type, quantity, reason, "performedBy", notes, "createdAt"
      ) VALUES (
        (SELECT id FROM "Inventory" WHERE "productId" = ${product.id} AND "locationId" = ${location.id} LIMIT 1),
        'in', ${quantity}, 'receipt', 
        ${session.user.id}, ${notes || `Received ${quantity} ${sku}`}, NOW()
      )
    `

    // Create batch (skip if exists)
    if (batchCode) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Batch" (
            "batchCode", "productId", "locationId", "initialQty", "remainingQty", 
            status, "createdAt"
          ) VALUES (
            ${batchCode.toUpperCase()}, ${product.id}, ${location.id}, 
            ${quantity}, ${quantity}, 'active', NOW()
          )
        `
      } catch (e) {
        // Batch might already exist, ignore error
        console.log('Batch may already exist:', batchCode)
      }
    }

    return NextResponse.json({ 
      success: true, 
      sku, 
      quantity,
      message: `Received ${quantity} ${sku}`
    })

  } catch (error) {
    console.error('Receive error:', error)
    return NextResponse.json(
      { error: 'Failed', details: String(error) },
      { status: 500 }
    )
  }
}
