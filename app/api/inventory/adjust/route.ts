import { NextResponse } from 'next/server'
import { getSupabaseUntyped } from '@/lib/supabase-untyped'
import { requireAuth } from '@/lib/auth-helpers'

interface InventoryRecord {
  id: string
  productId: string
  locationId: string
  currentStock: number
  available: number
  reorderPoint: number
  reorderQty: number
  lastMovementAt: string
}

// POST /api/inventory/adjust
// Stock adjustment with full audit trail
export async function POST(req: Request) {
  const session = await requireAuth()
  const supabase = getSupabaseUntyped()
  
  try {
    const body = await req.json()
    const { sku, quantity, reason, notes, locationCode = 'WH-HK-01' } = body

    if (!sku || !quantity || !reason) {
      return NextResponse.json(
        { error: 'SKU, quantity, and reason required' },
        { status: 400 }
      )
    }

    // Find product
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select('id')
      .eq('sku', sku)
      .single()
    
    if (productError || !product) {
      throw new Error(`Product ${sku} not found`)
    }

    // Find location
    const { data: location, error: locationError } = await supabase
      .from('Location')
      .select('id')
      .eq('code', locationCode)
      .single()
    
    if (locationError || !location) {
      throw new Error(`Location ${locationCode} not found`)
    }

    const productId = (product as any).id as string
    const locationId = (location as any).id as string
    
    // Get inventory
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('Inventory')
      .select('*')
      .eq('productId', productId)
      .eq('locationId', locationId)
      .maybeSingle()

    let inventory = inventoryData as InventoryRecord | null

    if (!inventory) {
      // Create inventory record if doesn't exist
      const { data: newInventory, error: createError } = await supabase
        .from('Inventory')
        .insert({
          productId: productId,
          locationId: locationId,
          currentStock: 0,
          available: 0,
          reorderPoint: sku === 'KFSS' ? 500 : sku === 'KFSP' ? 50 : 5,
          reorderQty: sku === 'KFSS' ? 1000 : sku === 'KFSP' ? 100 : 10,
          lastMovementAt: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) throw createError
      inventory = newInventory as InventoryRecord
    }

    if (!inventory) {
      throw new Error('Failed to get or create inventory record')
    }
    
    // Check if enough stock for negative adjustment
    if (quantity < 0 && (inventory.currentStock || 0) + quantity < 0) {
      throw new Error(`Not enough stock. Current: ${inventory.currentStock}, Adjusting: ${quantity}`)
    }

    // Perform adjustment
    const { data: updatedInventory, error: updateError } = await supabase
      .from('Inventory')
      .update({
        currentStock: (inventory.currentStock || 0) + quantity,
        available: (inventory.available || 0) + quantity,
        lastMovementAt: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .select()
      .single()
    
    if (updateError) throw updateError

    const resultInventory = updatedInventory as InventoryRecord

    // Log movement
    await supabase.from('InventoryMovement').insert({
      inventoryId: inventory.id,
      type: quantity > 0 ? 'in' : 'out',
      quantity: Math.abs(quantity),
      reason: 'adjustment',
      notes: `${reason}${notes ? ': ' + notes : ''}`,
      performedBy: session.user?.id || 'unknown'
    } as any)

    return NextResponse.json({
      success: true,
      sku,
      quantity,
      newStock: resultInventory.currentStock,
      reason
    })

  } catch (error: any) {
    console.error('[API_ADJUST_ERROR]', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
