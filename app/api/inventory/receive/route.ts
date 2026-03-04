import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/inventory/receive
// Using Prisma methods instead of raw SQL
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Receive request:', body)
    
    const { sku, quantity, batchCode, notes } = body
    
    if (!sku || !quantity || parseInt(quantity) <= 0) {
      return NextResponse.json({ error: 'SKU and positive quantity required' }, { status: 400 })
    }
    
    const skuUpper = sku.toUpperCase()
    const qty = parseInt(quantity)
    
    // Get or create location
    let location = await prisma.Location.findFirst({ where: { code: 'WH-HK-01' } })
    if (!location) {
      location = await prisma.Location.create({
        data: { code: 'WH-HK-01', name: 'Hong Kong Warehouse', type: 'warehouse' }
      })
    }
    
    // Get or create product
    let product = await prisma.Product.findUnique({ where: { sku: skuUpper } })
    if (!product) {
      const isBundle = skuUpper === 'KFSB' || skuUpper === 'KFSP'
      product = await prisma.Product.create({
        data: { 
          sku: skuUpper, 
          name: skuUpper,
          isBundle,
          basePrice: 0,
          costPrice: 0
        }
      })
    }
    
    // Update or create inventory
    let inventory = await prisma.Inventory.findFirst({
      where: { productId: product.id, locationId: location.id }
    })
    
    if (inventory) {
      inventory = await prisma.Inventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: { increment: qty },
          available: { increment: qty }
        }
      })
    } else {
      inventory = await prisma.Inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          currentStock: qty,
          available: qty,
          reorderPoint: skuUpper === 'KFSS' ? 500 : skuUpper === 'KFSP' ? 50 : 5,
          reorderQty: skuUpper === 'KFSS' ? 1000 : skuUpper === 'KFSP' ? 100 : 10
        }
      })
    }
    
    // Log movement
    await prisma.InventoryMovement.create({
      data: {
        inventoryId: inventory.id,
        type: 'in',
        quantity: qty,
        reason: 'receipt',
        notes: notes || `Received ${qty} ${skuUpper}`,
        performedBy: 'system'
      }
    })
    
    // Bundle expansion: KFSB → KFSP → KFSS
    let totalBottles = qty
    
    if (skuUpper === 'KFSB') {
      // Expand to KFSP
      const kfspQty = qty * 20
      let kfsp = await prisma.Product.findUnique({ where: { sku: 'KFSP' } })
      if (!kfsp) {
        kfsp = await prisma.Product.create({
          data: { sku: 'KFSP', name: 'KFSP', isBundle: true, basePrice: 0, costPrice: 0 }
        })
      }
      
      let kfspInv = await prisma.Inventory.findFirst({
        where: { productId: kfsp.id, locationId: location.id }
      })
      
      if (kfspInv) {
        await prisma.Inventory.update({
          where: { id: kfspInv.id },
          data: { currentStock: { increment: kfspQty }, available: { increment: kfspQty } }
        })
      } else {
        kfspInv = await prisma.Inventory.create({
          data: {
            productId: kfsp.id,
            locationId: location.id,
            currentStock: kfspQty,
            available: kfspQty,
            reorderPoint: 50,
            reorderQty: 100
          }
        })
      }
      
      // Expand KFSP to KFSS
      const kfssQty = kfspQty * 12
      let kfss = await prisma.Product.findUnique({ where: { sku: 'KFSS' } })
      if (!kfss) {
        kfss = await prisma.Product.create({
          data: { sku: 'KFSS', name: 'KFSS', isBundle: false, basePrice: 0, costPrice: 0 }
        })
      }
      
      let kfssInv = await prisma.Inventory.findFirst({
        where: { productId: kfss.id, locationId: location.id }
      })
      
      if (kfssInv) {
        await prisma.Inventory.update({
          where: { id: kfssInv.id },
          data: { currentStock: { increment: kfssQty }, available: { increment: kfssQty } }
        })
      } else {
        await prisma.Inventory.create({
          data: {
            productId: kfss.id,
            locationId: location.id,
            currentStock: kfssQty,
            available: kfssQty,
            reorderPoint: 500,
            reorderQty: 1000
          }
        })
      }
      
      totalBottles = kfssQty
    }
    
    // Create batch if provided
    if (batchCode) {
      try {
        await prisma.Batch.create({
          data: {
            batchCode: batchCode.toUpperCase(),
            productId: product.id,
            locationId: location.id,
            initialQty: qty,
            remainingQty: qty,
            status: 'active'
          }
        })
      } catch (e) {
        console.log('Batch exists:', batchCode)
      }
    }
    
    return NextResponse.json({
      success: true,
      sku: skuUpper,
      quantity: qty,
      totalBottles,
      message: `Received ${qty} ${skuUpper} (${totalBottles} bottles total)`
    })
    
  } catch (error) {
    console.error('Receive error:', error)
    return NextResponse.json({ 
      error: 'Failed to receive stock', 
      details: String(error) 
    }, { status: 500 })
  }
}
// Trigger rebuild Wed Mar  4 12:00:00 PM CST 2026
