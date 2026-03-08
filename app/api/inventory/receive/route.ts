import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/inventory/receive
// Full bundle expansion: KFSB → KFSP → KFSS
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[API_RECEIVE]', body)
    
    const { sku, quantity, batchCode, notes } = body
    
    if (!sku || !quantity || parseInt(quantity) <= 0) {
      return NextResponse.json({ error: 'SKU and positive quantity required' }, { status: 400 })
    }
    
    const skuUpper = sku.toUpperCase()
    const qty = parseInt(quantity)
    
    // Get or create default location
    let location = await prisma.location.findFirst({ where: { code: 'WH-HK-01' } })
    if (!location) {
      location = await prisma.location.create({
        data: { code: 'WH-HK-01', name: 'Hong Kong Warehouse', type: 'warehouse' }
      })
    }
    
    // Start transaction for data consistency
    const result = await prisma.$transaction(async (tx: any) => {
      // Get or create product
      let product = await tx.product.findUnique({ where: { sku: skuUpper } })
      if (!product) {
        const isBundle = skuUpper === 'KFSB' || skuUpper === 'KFSP'
        product = await tx.product.create({
          data: { 
            sku: skuUpper, 
            name: skuUpper,
            isBundle,
            basePrice: 0,
            costPrice: 0
          }
        })
      }
      
      // Update or create inventory for received SKU
      let inventory = await tx.inventory.findFirst({
        where: { productId: product.id, locationId: location.id }
      })
      
      if (inventory) {
        inventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            currentStock: { increment: qty },
            available: { increment: qty },
            lastMovementAt: new Date()
          }
        })
      } else {
        inventory = await tx.inventory.create({
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
      
      // Log movement
      await tx.inventoryMovement.create({
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
        // 1 KFSB = 20 KFSP = 240 KFSS
        const kfspQty = qty * 20
        
        // Expand to KFSP
        let kfsp = await tx.product.findUnique({ where: { sku: 'KFSP' } })
        if (!kfsp) {
          kfsp = await tx.product.create({
            data: { sku: 'KFSP', name: 'KFSP', isBundle: true, basePrice: 0, costPrice: 0 }
          })
        }
        
        let kfspInv = await tx.inventory.findFirst({
          where: { productId: kfsp.id, locationId: location.id }
        })
        
        if (kfspInv) {
          await tx.inventory.update({
            where: { id: kfspInv.id },
            data: { 
              currentStock: { increment: kfspQty }, 
              available: { increment: kfspQty },
              lastMovementAt: new Date()
            }
          })
        } else {
          kfspInv = await tx.inventory.create({
            data: {
              productId: kfsp.id,
              locationId: location.id,
              currentStock: kfspQty,
              available: kfspQty,
              reorderPoint: 50,
              reorderQty: 100,
              lastMovementAt: new Date()
            }
          })
        }
        
        // Log KFSP movement
        await tx.inventoryMovement.create({
          data: {
            inventoryId: kfspInv.id,
            type: 'in',
            quantity: kfspQty,
            reason: 'bundle_expansion',
            notes: `Auto-generated from ${qty} KFSB`,
            performedBy: 'system'
          }
        })
        
        // Expand KFSP to KFSS (1 KFSP = 12 KFSS)
        const kfssQty = kfspQty * 12
        
        let kfss = await tx.product.findUnique({ where: { sku: 'KFSS' } })
        if (!kfss) {
          kfss = await tx.product.create({
            data: { sku: 'KFSS', name: 'KFSS', isBundle: false, basePrice: 0, costPrice: 0 }
          })
        }
        
        let kfssInv = await tx.inventory.findFirst({
          where: { productId: kfss.id, locationId: location.id }
        })
        
        if (kfssInv) {
          await tx.inventory.update({
            where: { id: kfssInv.id },
            data: { 
              currentStock: { increment: kfssQty }, 
              available: { increment: kfssQty },
              lastMovementAt: new Date()
            }
          })
        } else {
          kfssInv = await tx.inventory.create({
            data: {
              productId: kfss.id,
              locationId: location.id,
              currentStock: kfssQty,
              available: kfssQty,
              reorderPoint: 500,
              reorderQty: 1000,
              lastMovementAt: new Date()
            }
          })
        }
        
        // Log KFSS movement
        await tx.inventoryMovement.create({
          data: {
            inventoryId: kfssInv.id,
            type: 'in',
            quantity: kfssQty,
            reason: 'bundle_expansion',
            notes: `Auto-generated from ${kfspQty} KFSP (from ${qty} KFSB)`,
            performedBy: 'system'
          }
        })
        
        totalBottles = kfssQty
      } else if (skuUpper === 'KFSP') {
        // 1 KFSP = 12 KFSS
        const kfssQty = qty * 12
        
        let kfss = await tx.product.findUnique({ where: { sku: 'KFSS' } })
        if (!kfss) {
          kfss = await tx.product.create({
            data: { sku: 'KFSS', name: 'KFSS', isBundle: false, basePrice: 0, costPrice: 0 }
          })
        }
        
        let kfssInv = await tx.inventory.findFirst({
          where: { productId: kfss.id, locationId: location.id }
        })
        
        if (kfssInv) {
          await tx.inventory.update({
            where: { id: kfssInv.id },
            data: { 
              currentStock: { increment: kfssQty }, 
              available: { increment: kfssQty },
              lastMovementAt: new Date()
            }
          })
        } else {
          kfssInv = await tx.inventory.create({
            data: {
              productId: kfss.id,
              locationId: location.id,
              currentStock: kfssQty,
              available: kfssQty,
              reorderPoint: 500,
              reorderQty: 1000,
              lastMovementAt: new Date()
            }
          })
        }
        
        // Log KFSS movement
        await tx.inventoryMovement.create({
          data: {
            inventoryId: kfssInv.id,
            type: 'in',
            quantity: kfssQty,
            reason: 'bundle_expansion',
            notes: `Auto-generated from ${qty} KFSP`,
            performedBy: 'system'
          }
        })
        
        totalBottles = kfssQty
      }
      
      // Create batch if provided
      if (batchCode) {
        try {
          await tx.batch.create({
            data: {
              batchCode: batchCode.toUpperCase(),
              productId: product.id,
              locationId: location.id,
              initialQty: qty,
              remainingQty: qty,
              status: 'active'
            }
          })
        } catch (e: any) {
          // Batch may already exist, log but don't fail
          console.log('[BATCH_EXISTS]', batchCode)
        }
      }
      
      return {
        success: true,
        sku: skuUpper,
        quantity: qty,
        totalBottles,
        message: `Received ${qty} ${skuUpper} (${totalBottles} bottles total)`
      }
    })
    
    return NextResponse.json(result)
    
  } catch (error: any) {
    console.error('[API_RECEIVE_ERROR]', error.message, error.stack)
    return NextResponse.json({ 
      error: 'Failed to receive stock', 
      details: error.message 
    }, { status: 500 })
  }
}
