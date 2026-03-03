import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
 
// POST /api/inventory/receive
// Receive stock with automatic component expansion
export async function POST(req: Request) {
  const session = await requireAuth()
  
  try {
    const body = await req.json()
    const { 
      sku, 
      quantity, 
      batchCode, 
      locationCode = 'WH-HK-01',
      unitCost,
      notes,
      manufacturedDate,
      expiryDate
    } = body

    if (!sku || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'SKU and positive quantity required' },
        { status: 400 }
      )
    }

    // Find product with active bundle components
    const product = await prisma.product.findUnique({
      where: { sku },
      include: {
        bundleComponents: {
          where: {
            isActive: true,
            effectiveFrom: { lte: new Date() },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date() } }
            ]
          }
        }
      }
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

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update received SKU inventory
      const inventory = await tx.inventory.upsert({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: location.id
          }
        },
        update: {
          currentStock: { increment: quantity },
          lastMovementAt: new Date()
        },
        create: {
          productId: product.id,
          locationId: location.id,
          currentStock: quantity,
          reorderPoint: sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5,
          reorderQty: sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10
        }
      })

      // 2. Log movement for received SKU
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: 'in',
          quantity: quantity,
          reason: 'receipt',
          performedBy: session.user.id,
          notes: notes || `Received ${quantity} ${sku}`
        }
      })

      // 3. If this is a bundle (KFSP or KFSB), expand to components
      if (product.bundleComponents && product.bundleComponents.length > 0) {
        for (const component of product.bundleComponents as any[]) {
          const componentProduct = await tx.product.findUnique({
            where: { sku: component.sku }
          })

          if (!componentProduct) continue

          const componentQty = quantity * component.qty

          // Update component inventory with version tracking
          const componentInventory = await tx.inventory.upsert({
            where: {
              productId_locationId: {
                productId: componentProduct.id,
                locationId: location.id
              }
            },
            update: {
              currentStock: { increment: componentQty },
              lastMovementAt: new Date()
            },
            create: {
              productId: componentProduct.id,
              locationId: location.id,
              currentStock: componentQty,
              reorderPoint: component.childSku === 'KFSS' ? 500 : 50,
              reorderQty: component.childSku === 'KFSS' ? 1000 : 100
            }
          })

          // Log component movement with version info
          await tx.inventoryMovement.create({
            data: {
              inventoryId: componentInventory.id,
              type: 'conversion',
              quantity: componentQty,
              reason: 'bundle_break',
              sourceSku: sku,
              targetSku: component.childSku,
              conversionRatio: component.quantity,
              performedBy: session.user.id,
              notes: `Converted from ${quantity} ${sku} (v${component.version || '1'})`
            }
          })
        }
      }

      // 4. Create batch if batchCode provided
      if (batchCode) {
        await tx.batch.create({
          data: {
            batchCode,
            productId: product.id,
            locationId: location.id,
            initialQty: quantity,
            remainingQty: quantity,
            manufacturedAt: manufacturedDate ? new Date(manufacturedDate) : new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            status: 'active'
          }
        })
      }

      return { 
        success: true, 
        sku, 
        quantity,
        expanded: product.bundleComponents?.length > 0 
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Receive stock error:', error)
    return NextResponse.json(
      { error: 'Failed to receive stock' },
      { status: 500 }
    )
  }
}
