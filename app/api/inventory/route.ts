import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inventory - Simple, reliable version
export async function GET() {
  try {
    const inventory = await prisma.$queryRaw`
      SELECT 
        i.id,
        COALESCE(i."currentStock", 0) as "currentStock",
        COALESCE(i.reserved, 0) as reserved,
        COALESCE(i.available, 0) as available,
        i."reorderPoint",
        i."reorderQty",
        COALESCE(p.sku, 'UNKNOWN') as sku,
        COALESCE(p.name, 'Unknown') as name,
        COALESCE(p."basePrice", 0) as "basePrice",
        COALESCE(p."isBundle", false) as "isBundle"
      FROM "Inventory" i
      LEFT JOIN "Product" p ON i."productId" = p.id
      ORDER BY COALESCE(i.available, 0) ASC
      LIMIT 100
    `
    
    return NextResponse.json(inventory || [])
    
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json([])
  }
}

// POST /api/inventory/receive - Working bundle expansion
export async function POST(req: Request) {
  try {
    const { sku, quantity, batchCode, notes } = await req.json()
    
    if (!sku || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    
    const skuUpper = sku.toUpperCase()
    const qty = parseInt(quantity)
    
    // Bundle definitions
    const bundles: Record<string, { child: string; qty: number }> = {
      'KFSB': { child: 'KFSP', qty: 20 },
      'KFSP': { child: 'KFSS', qty: 12 }
    }
    
    // Get location
    const locResult = await prisma.$queryRaw`SELECT id FROM "Location" LIMIT 1`
    const locationId = (locResult as any[])[0]?.id
    if (!locationId) return NextResponse.json({ error: 'No location' }, { status: 500 })
    
    // Helper to get or create product
    async function getProductId(sku: string): Promise<string> {
      const result = await prisma.$queryRaw`SELECT id FROM "Product" WHERE sku = ${sku}`
      if ((result as any[]).length > 0) return (result as any[])[0].id
      
      const insert = await prisma.$queryRaw`
        INSERT INTO "Product" (sku, name, "isBundle") 
        VALUES (${sku}, ${sku}, ${bundles[sku] ? true : false})
        RETURNING id
      `
      return (insert as any[])[0].id
    }
    
    // Helper to update inventory
    async function updateInventory(productId: string, qty: number) {
      const existing = await prisma.$queryRaw`
        SELECT id FROM "Inventory" WHERE "productId" = ${productId} AND "locationId" = ${locationId}
      `
      
      if ((existing as any[]).length > 0) {
        await prisma.$executeRaw`
          UPDATE "Inventory" 
          SET "currentStock" = "currentStock" + ${qty}, 
              "available" = "available" + ${qty}
          WHERE "productId" = ${productId} AND "locationId" = ${locationId}
        `
      } else {
        await prisma.$executeRaw`
          INSERT INTO "Inventory" ("productId", "locationId", "currentStock", "available", "reorderPoint", "reorderQty")
          VALUES (${productId}, ${locationId}, ${qty}, ${qty}, 
            ${skuUpper === 'KFSS' ? 500 : skuUpper === 'KFSP' ? 50 : 5},
            ${skuUpper === 'KFSS' ? 1000 : skuUpper === 'KFSP' ? 100 : 10})
        `
      }
    }
    
    // Update received SKU
    const productId = await getProductId(skuUpper)
    await updateInventory(productId, qty)
    
    // Expand bundles
    let totalBottles = qty
    let currentSku = skuUpper
    let currentQty = qty
    
    while (bundles[currentSku]) {
      const bundle = bundles[currentSku]
      const childQty = currentQty * bundle.qty
      
      const childId = await getProductId(bundle.child)
      await updateInventory(childId, childQty)
      
      totalBottles = childQty
      currentSku = bundle.child
      currentQty = childQty
    }
    
    // Create batch
    if (batchCode) {
      try {
        await prisma.$executeRaw`
          INSERT INTO "Batch" ("batchCode", "productId", "locationId", "initialQty", "remainingQty", status, "createdAt")
          VALUES (${batchCode.toUpperCase()}, ${productId}, ${locationId}, ${qty}, ${qty}, 'active', NOW())
        `
      } catch (e) { /* Batch exists */ }
    }
    
    return NextResponse.json({
      success: true,
      sku: skuUpper,
      quantity: qty,
      totalBottles,
      message: `Received ${qty} ${skuUpper} (${totalBottles} bottles)`
    })
    
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
