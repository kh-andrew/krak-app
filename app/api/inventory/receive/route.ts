import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/receive
// Receive stock with batch tracking - with detailed logging
export async function POST(req: Request) {
  const session = await requireAuth()
  
  console.log('=== RECEIVE STOCK API CALLED ===')
  
  try {
    const body = await req.json()
    console.log('Request body:', body)
    
    const { sku, quantity, batchCode, notes } = body

    if (!sku || !quantity || quantity <= 0) {
      console.log('Validation failed:', { sku, quantity })
      return NextResponse.json(
        { error: 'SKU and positive quantity required' },
        { status: 400 }
      )
    }

    // Find product
    console.log('Looking for product:', sku.toUpperCase())
    const productResult = await prisma.$queryRaw`
      SELECT id, sku, name FROM "Product" WHERE sku = ${sku.toUpperCase()} LIMIT 1
    `
    console.log('Product result:', productResult)
    
    const product = (productResult as any[])[0]

    if (!product) {
      console.log('Product not found:', sku)
      return NextResponse.json(
        { error: `Product ${sku} not found` },
        { status: 404 }
      )
    }

    // Get default location
    const locationResult = await prisma.$queryRaw`
      SELECT id FROM "Location" WHERE code = 'WH-HK-01' LIMIT 1
    `
    console.log('Location result:', locationResult)
    
    const location = (locationResult as any[])[0]

    if (!location) {
      console.log('Location not found')
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
    console.log('Bundle components:', componentsResult)
    const bundleComponents = componentsResult as any[]

    // Execute transaction
    console.log('Starting transaction...')
    const result = await prisma.$transaction(async (tx) => {
      console.log('Inside transaction, updating inventory...')
      
      // Check if inventory exists
      const existingInv = await tx.$queryRaw`
        SELECT id FROM "Inventory" 
        WHERE "productId" = ${product.id} AND "locationId" = ${location.id}
        LIMIT 1
      `
      console.log('Existing inventory:', existingInv)

      if ((existingInv as any[]).length > 0) {
        console.log('Updating existing inventory')
        await tx.$executeRaw`
          UPDATE "Inventory" 
          SET "currentStock" = "currentStock" + ${quantity},
              "available" = "available" + ${quantity},
              "lastMovementAt" = NOW()
          WHERE "productId" = ${product.id} AND "locationId" = ${location.id}
        `
      } else {
        console.log('Creating new inventory')
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
      console.log('Logging movement...')
      await tx.$executeRaw`
        INSERT INTO "InventoryMovement" (
          "inventoryId", type, quantity, reason, "performedBy", notes, "createdAt"
        ) VALUES (
          (SELECT id FROM "Inventory" WHERE "productId" = ${product.id} AND "locationId" = ${location.id} LIMIT 1),
          'in', ${quantity}, 'receipt', 
          ${session.user.id}, ${notes || `Received ${quantity} ${sku}`}, NOW()
        )
      `

      // Create batch if provided
      if (batchCode) {
        console.log('Creating batch:', batchCode)
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

      console.log('Transaction complete')
      return { 
        success: true, 
        sku, 
        quantity,
        expanded: bundleComponents.length > 0 
      }
    })

    console.log('=== SUCCESS ===', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('=== ERROR ===', error)
    return NextResponse.json(
      { error: 'Failed to receive stock', details: String(error) },
      { status: 500 }
    )
  }
}
