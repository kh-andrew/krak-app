import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/adjust
// Stock adjustment with full audit trail
export async function POST(req: Request) {
  const session = await requireAuth()
  
  try {
    const body = await req.json()
    const { sku, quantity, reason, notes, locationCode = 'WH-HK-01' } = body

    if (!sku || !quantity || !reason) {
      return NextResponse.json(
        { error: 'SKU, quantity, and reason required' },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      // Find product
      const product = await tx.product.findUnique({ where: { sku } })
      if (!product) {
        throw new Error(`Product ${sku} not found`)
      }

      // Find location
      const location = await tx.location.findUnique({ where: { code: locationCode } })
      if (!location) {
        throw new Error(`Location ${locationCode} not found`)
      }

      // Get inventory
      let inventory = await tx.inventory.findFirst({
        where: { productId: product.id, locationId: location.id }
      })

      if (!inventory) {
        // Create inventory record if doesn't exist
        inventory = await tx.inventory.create({
          data: {
            productId: product.id,
            locationId: location.id,
            currentStock: 0,
            available: 0,
            reorderPoint: sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5,
            reorderQty: sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10,
            lastMovementAt: new Date()
          }
        })
      }

      // Check if enough stock for negative adjustment
      if (quantity < 0 && (inventory.currentStock || 0) + quantity < 0) {
        throw new Error(`Not enough stock. Current: ${inventory.currentStock}, Adjusting: ${quantity}`)
      }

      // Perform adjustment
      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          currentStock: { increment: quantity },
          available: { increment: quantity },
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
          notes: `${reason}${notes ? ': ' + notes : ''}`,
          performedBy: session.user?.id || 'unknown'
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

  } catch (error: any) {
    console.error('[API_ADJUST_ERROR]', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
