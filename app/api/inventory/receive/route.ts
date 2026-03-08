import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/inventory/receive
// Simplified version - receives stock without bundle expansion
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('Receive request:', body)
    
    const { sku, quantity, notes } = body
    
    if (!sku || !quantity || parseInt(quantity) <= 0) {
      return NextResponse.json({ error: 'SKU and positive quantity required' }, { status: 400 })
    }
    
    const skuUpper = sku.toUpperCase()
    const qty = parseInt(quantity)
    
    // Get or create location
    let location = await prisma.locations.findFirst({ where: { code: 'WH-HK-01' } })
    if (!location) {
      location = await prisma.locations.create({
        data: { code: 'WH-HK-01', name: 'Hong Kong Warehouse', type: 'warehouse' }
      })
    }
    
    // Get or create product
    let product = await prisma.products.findUnique({ where: { sku: skuUpper } })
    if (!product) {
      product = await prisma.products.create({
        data: { 
          sku: skuUpper, 
          name: skuUpper,
          basePrice: 0
        }
      })
    }
    
    // Update or create inventory
    let inventory = await prisma.inventory.findFirst({
      where: { productId: product.id, locationId: location.id }
    })
    
    if (inventory) {
      inventory = await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: { increment: qty },
          available: { increment: qty },
          lastMovementAt: new Date()
        }
      })
    } else {
      inventory = await prisma.inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          currentStock: qty,
          available: qty,
          reorderPoint: skuUpper === 'KFSS' ? 500 : skuUpper === 'KFSP' ? 50 : 5,
          reorderQty: skuUpper === 'KFSS' ? 1000 : skuUpper === 'KFSP' ? 100 : 10,
          lastMovementAt: new Date()
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      sku: skuUpper,
      quantity: qty,
      newStock: inventory.currentStock,
      message: `Received ${qty} ${skuUpper}`
    })
    
  } catch (error) {
    console.error('Receive error:', error)
    return NextResponse.json({ 
      error: 'Failed to receive stock', 
      details: String(error) 
    }, { status: 500 })
  }
}
