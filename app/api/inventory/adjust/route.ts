import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/adjust
// Quick stock adjustment - simplified version
export async function POST(req: Request) {
  const session = await requireAuth()
  
  try {
    const body = await req.json()
    const { sku, quantity, reason, notes } = body

    if (!sku || !quantity || !reason) {
      return NextResponse.json(
        { error: 'SKU, quantity, and reason required' },
        { status: 400 }
      )
    }

    // Find product
    const product = await prisma.products.findUnique({
      where: { sku }
    })

    if (!product) {
      return NextResponse.json(
        { error: `Product ${sku} not found` },
        { status: 404 }
      )
    }

    // Get inventory for this product
    const inventoryItems = await prisma.inventory.findMany({
      where: { productId: product.id }
    })

    if (inventoryItems.length === 0) {
      return NextResponse.json(
        { error: `No inventory found for ${sku}` },
        { status: 404 }
      )
    }

    const inventory = inventoryItems[0]

    // Check if enough stock for negative adjustment
    if (quantity < 0 && (inventory.currentStock || 0) + quantity < 0) {
      return NextResponse.json(
        { error: `Not enough stock. Current: ${inventory.currentStock}, Adjusting: ${quantity}` },
        { status: 400 }
      )
    }

    // Perform adjustment
    const updatedInventory = await prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        currentStock: { increment: quantity },
        available: { increment: quantity },
        lastMovementAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      sku,
      quantity,
      newStock: updatedInventory.currentStock,
      reason
    })

  } catch (error) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
