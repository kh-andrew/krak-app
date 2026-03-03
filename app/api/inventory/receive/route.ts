import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// POST /api/inventory/receive
// Receive stock with batch tracking - uses raw SQL for compatibility
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

    // Find product using raw SQL with correct table name
    const productResult = await prisma.$queryRaw`
      SELECT id, sku, name FROM product WHERE sku = ${sku.toUpperCase()} LIMIT 1
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
      SELECT id FROM location WHERE code = 'WH-HK-01' LIMIT 1
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
      SELECT child_sku, quantity 
      FROM bundle_component 
      WHERE parent_sku = ${sku.toUpperCase()} AND is_active = true
    `
    const bundleComponents = componentsResult as any[]

    // Execute transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update or create inventory for received SKU
      const existingInv = await tx.$queryRaw`
        SELECT id FROM inventory 
        WHERE product_id = ${product.id} AND location_id = ${location.id}
        LIMIT 1
      `

      if ((existingInv as any[]).length > 0) {
        await tx.$executeRaw`
          UPDATE inventory 
          SET current_stock = current_stock + ${quantity},
              available = available + ${quantity},
              last_movement_at = NOW()
          WHERE product_id = ${product.id} AND location_id = ${location.id}
        `
      } else {
        await tx.$executeRaw`
          INSERT INTO inventory (
            product_id, location_id, current_stock, available, 
            reorder_point, reorder_qty
          ) VALUES (
            ${product.id}, ${location.id}, ${quantity}, ${quantity},
            ${sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5},
            ${sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10}
          )
        `
      }

      // Log movement
      await tx.$executeRaw`
        INSERT INTO inventory_movement (
          inventory_id, type, quantity, reason, performed_by, notes, created_at
        ) VALUES (
          (SELECT id FROM inventory WHERE product_id = ${product.id} AND location_id = ${location.id} LIMIT 1),
          'in', ${quantity}, 'receipt', 
          ${session.user.id}, ${notes || `Received ${quantity} ${sku}`}, NOW()
        )
      `

      // If bundle, expand to components
      if (bundleComponents.length > 0) {
        for (const component of bundleComponents) {
          const componentProduct = await tx.$queryRaw`
            SELECT id FROM product WHERE sku = ${component.child_sku} LIMIT 1
          `
          
          if (!(componentProduct as any[])[0]) continue
          
          const componentId = (componentProduct as any[])[0].id
          const componentQty = quantity * component.quantity

          // Update component inventory
          const existingComponent = await tx.$queryRaw`
            SELECT id FROM inventory 
            WHERE product_id = ${componentId} AND location_id = ${location.id}
            LIMIT 1
          `

          if ((existingComponent as any[]).length > 0) {
            await tx.$executeRaw`
              UPDATE inventory 
              SET current_stock = current_stock + ${componentQty},
                  available = available + ${componentQty},
                  last_movement_at = NOW()
              WHERE product_id = ${componentId} AND location_id = ${location.id}
            `
          } else {
            await tx.$executeRaw`
              INSERT INTO inventory (
                product_id, location_id, current_stock, available,
                reorder_point, reorder_qty
              ) VALUES (
                ${componentId}, ${location.id}, ${componentQty}, ${componentQty},
                ${component.child_sku === 'KFSS' ? 500 : 50},
                ${component.child_sku === 'KFSS' ? 1000 : 100}
              )
            `
          }

          // Log component movement
          await tx.$executeRaw`
            INSERT INTO inventory_movement (
              inventory_id, type, quantity, reason, source_sku, target_sku, 
              conversion_ratio, performed_by, notes, created_at
            ) VALUES (
              (SELECT id FROM inventory WHERE product_id = ${componentId} AND location_id = ${location.id} LIMIT 1),
              'conversion', ${componentQty}, 'bundle_break',
              ${sku}, ${component.child_sku}, ${component.quantity},
              ${session.user.id}, ${`Converted from ${quantity} ${sku}`}, NOW()
            )
          `
        }
      }

      // Create batch if provided
      if (batchCode) {
        await tx.$executeRaw`
          INSERT INTO batch (
            batch_code, product_id, location_id, initial_qty, remaining_qty, 
            status, created_at
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
