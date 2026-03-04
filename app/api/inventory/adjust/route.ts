import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/adjust
// Quick stock adjustment for samples, giveaways, damages
export async function POST(req: Request) {
  const session = await requireAuth()
  
  try {
    const body = await req.json()
    const { 
      sku, 
      quantity, 
      reason, // 'sample', 'giveaway', 'damage', 'expired', 'correction'
      notes,
      locationCode = 'WH-HK-01'
    } = body

    if (!sku || !quantity || !reason) {
      return NextResponse.json(
        { error: 'SKU, quantity, and reason required' },
        { status: 400 }
      )
    }

    // Find product
    const product = await prisma.product.findUnique({
      where: { sku }
    })

    if (!product) {
      return NextResponse.json(
        { error: `Product ${sku} not found` },
        { status: 404 }
      )
    }

    // Find location
    const location = await prisma.location.findUnique({
      where: { code: locationCode }
    })

    if (!location) {
      return NextResponse.json(
        { error: `Location ${locationCode} not found` },
        { status: 404 }
      )
    }

    // Get or create inventory
    let inventory = await prisma.inventory.findUnique({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: location.id
        }
      }
    })

    if (!inventory) {
      // Create inventory record if doesn't exist
      inventory = await prisma.inventory.create({
        data: {
          productId: product.id,
          locationId: location.id,
          currentStock: 0,
          reorderPoint: sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5,
          reorderQty: sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10
        }
      })
    }

    // Check if enough stock for negative adjustment
    if (quantity < 0 && inventory.currentStock + quantity < 0) {
      return NextResponse.json(
        { error: `Not enough stock. Current: ${inventory.currentStock}, Adjusting: ${quantity}` },
        { status: 400 }
      )
    }

    // Perform adjustment
    const result = await prisma.$transaction(async (tx) => {
      // Update inventory
      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: { increment: quantity },
          lastMovementAt: new Date()
        }
      })

      // Log movement
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: quantity > 0 ? 'in' : 'out',
          quantity: Math.abs(quantity),
          reason: 'adjustment',
          performedBy: session.user.id,
          notes: `${reason}${notes ? ': ' + notes : ''}`
        }
      })

      return {
        success: true,
        sku,
        quantity,
        newStock: updatedInventory.currentStock,
        reason
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Stock adjustment error:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
