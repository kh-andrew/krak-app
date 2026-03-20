import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST /api/inventory/receive
// Full bundle expansion: KFSB → KFSP → KFSS
export async function POST(req: Request) {
  const supabase = getSupabaseAdmin()
  
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
    let { data: location } = await supabase
      .from('Location')
      .select('*')
      .eq('code', 'WH-HK-01')
      .single()
    
    if (!location) {
      const { data: newLocation } = await supabase
        .from('Location')
        .insert({ code: 'WH-HK-01', name: 'Hong Kong Warehouse', type: 'warehouse' })
        .select()
        .single()
      location = newLocation
    }
    
    // Get or create product
    let { data: product } = await supabase
      .from('Product')
      .select('*')
      .eq('sku', skuUpper)
      .single()
    
    if (!product) {
      const isBundle = skuUpper === 'KFSB' || skuUpper === 'KFSP'
      const { data: newProduct } = await supabase
        .from('Product')
        .insert({
          sku: skuUpper,
          name: skuUpper,
          isBundle,
          basePrice: 0,
          costPrice: 0
        })
        .select()
        .single()
      product = newProduct
    }
    
    // Update or create inventory for received SKU
    let { data: inventory } = await supabase
      .from('Inventory')
      .select('*')
      .eq('productId', product.id)
      .eq('locationId', location.id)
      .single()
    
    if (inventory) {
      const { data: updated } = await supabase
        .from('Inventory')
        .update({
          currentStock: (inventory.currentStock || 0) + qty,
          available: (inventory.available || 0) + qty,
          lastMovementAt: new Date().toISOString()
        })
        .eq('id', inventory.id)
        .select()
        .single()
      inventory = updated
    } else {
      const { data: newInventory } = await supabase
        .from('Inventory')
        .insert({
          productId: product.id,
          locationId: location.id,
          currentStock: qty,
          available: qty,
          reorderPoint: skuUpper === 'KFSS' ? 500 : skuUpper === 'KFSP' ? 50 : 5,
          reorderQty: skuUpper === 'KFSS' ? 1000 : skuUpper === 'KFSP' ? 100 : 10,
          lastMovementAt: new Date().toISOString()
        })
        .select()
        .single()
      inventory = newInventory
    }
    
    // Log movement
    await supabase.from('InventoryMovement').insert({
      inventoryId: inventory.id,
      type: 'in',
      quantity: qty,
      reason: 'receipt',
      notes: notes || `Received ${qty} ${skuUpper}`,
      performedBy: 'system'
    })
    
    // Bundle expansion: KFSB → KFSP → KFSS
    let totalBottles = qty
    
    if (skuUpper === 'KFSB') {
      // 1 KFSB = 20 KFSP = 240 KFSS
      const kfspQty = qty * 20
      
      // Expand to KFSP
      let { data: kfsp } = await supabase.from('Product').select('*').eq('sku', 'KFSP').single()
      if (!kfsp) {
        const { data: newKfsp } = await supabase
          .from('Product')
          .insert({ sku: 'KFSP', name: 'KFSP', isBundle: true, basePrice: 0, costPrice: 0 })
          .select()
          .single()
        kfsp = newKfsp
      }
      
      let { data: kfspInv } = await supabase
        .from('Inventory')
        .select('*')
        .eq('productId', kfsp.id)
        .eq('locationId', location.id)
        .single()
      
      if (kfspInv) {
        await supabase
          .from('Inventory')
          .update({
            currentStock: (kfspInv.currentStock || 0) + kfspQty,
            available: (kfspInv.available || 0) + kfspQty,
            lastMovementAt: new Date().toISOString()
          })
          .eq('id', kfspInv.id)
      } else {
        const { data: newKfspInv } = await supabase
          .from('Inventory')
          .insert({
            productId: kfsp.id,
            locationId: location.id,
            currentStock: kfspQty,
            available: kfspQty,
            reorderPoint: 50,
            reorderQty: 100,
            lastMovementAt: new Date().toISOString()
          })
          .select()
          .single()
        kfspInv = newKfspInv
      }
      
      // Log KFSP movement
      await supabase.from('InventoryMovement').insert({
        inventoryId: kfspInv?.id,
        type: 'in',
        quantity: kfspQty,
        reason: 'bundle_expansion',
        notes: `Auto-generated from ${qty} KFSB`,
        performedBy: 'system'
      })
      
      // Expand KFSP to KFSS (1 KFSP = 12 KFSS)
      const kfssQty = kfspQty * 12
      
      let { data: kfss } = await supabase.from('Product').select('*').eq('sku', 'KFSS').single()
      if (!kfss) {
        const { data: newKfss } = await supabase
          .from('Product')
          .insert({ sku: 'KFSS', name: 'KFSS', isBundle: false, basePrice: 0, costPrice: 0 })
          .select()
          .single()
        kfss = newKfss
      }
      
      let { data: kfssInv } = await supabase
        .from('Inventory')
        .select('*')
        .eq('productId', kfss.id)
        .eq('locationId', location.id)
        .single()
      
      if (kfssInv) {
        await supabase
          .from('Inventory')
          .update({
            currentStock: (kfssInv.currentStock || 0) + kfssQty,
            available: (kfssInv.available || 0) + kfssQty,
            lastMovementAt: new Date().toISOString()
          })
          .eq('id', kfssInv.id)
      } else {
        const { data: newKfssInv } = await supabase
          .from('Inventory')
          .insert({
            productId: kfss.id,
            locationId: location.id,
            currentStock: kfssQty,
            available: kfssQty,
            reorderPoint: 500,
            reorderQty: 1000,
            lastMovementAt: new Date().toISOString()
          })
          .select()
          .single()
        kfssInv = newKfssInv
      }
      
      // Log KFSS movement
      await supabase.from('InventoryMovement').insert({
        inventoryId: kfssInv?.id,
        type: 'in',
        quantity: kfssQty,
        reason: 'bundle_expansion',
        notes: `Auto-generated from ${kfspQty} KFSP (from ${qty} KFSB)`,
        performedBy: 'system'
      })
      
      totalBottles = kfssQty
    } else if (skuUpper === 'KFSP') {
      // 1 KFSP = 12 KFSS
      const kfssQty = qty * 12
      
      let { data: kfss } = await supabase.from('Product').select('*').eq('sku', 'KFSS').single()
      if (!kfss) {
        const { data: newKfss } = await supabase
          .from('Product')
          .insert({ sku: 'KFSS', name: 'KFSS', isBundle: false, basePrice: 0, costPrice: 0 })
          .select()
          .single()
        kfss = newKfss
      }
      
      let { data: kfssInv } = await supabase
        .from('Inventory')
        .select('*')
        .eq('productId', kfss.id)
        .eq('locationId', location.id)
        .single()
      
      if (kfssInv) {
        await supabase
          .from('Inventory')
          .update({
            currentStock: (kfssInv.currentStock || 0) + kfssQty,
            available: (kfssInv.available || 0) + kfssQty,
            lastMovementAt: new Date().toISOString()
          })
          .eq('id', kfssInv.id)
      } else {
        const { data: newKfssInv } = await supabase
          .from('Inventory')
          .insert({
            productId: kfss.id,
            locationId: location.id,
            currentStock: kfssQty,
            available: kfssQty,
            reorderPoint: 500,
            reorderQty: 1000,
            lastMovementAt: new Date().toISOString()
          })
          .select()
          .single()
        kfssInv = newKfssInv
      }
      
      // Log KFSS movement
      await supabase.from('InventoryMovement').insert({
        inventoryId: kfssInv?.id,
        type: 'in',
        quantity: kfssQty,
        reason: 'bundle_expansion',
        notes: `Auto-generated from ${qty} KFSP`,
        performedBy: 'system'
      })
      
      totalBottles = kfssQty
    }
    
    // Create batch if provided
    if (batchCode) {
      try {
        await supabase.from('Batch').insert({
          batchCode: batchCode.toUpperCase(),
          productId: product.id,
          locationId: location.id,
          initialQty: qty,
          remainingQty: qty,
          status: 'active'
        })
      } catch (e: any) {
        console.log('[BATCH_EXISTS]', batchCode)
      }
    }
    
    return NextResponse.json({
      success: true,
      sku: skuUpper,
      quantity: qty,
      totalBottles,
      message: `Received ${qty} ${skuUpper} (${totalBottles} bottles total)`
    })
    
  } catch (error: any) {
    console.error('[API_RECEIVE_ERROR]', error.message, error.stack)
    return NextResponse.json({ 
      error: 'Failed to receive stock', 
      details: error.message 
    }, { status: 500 })
  }
}
