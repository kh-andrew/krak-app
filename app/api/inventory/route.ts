import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// SKU quantities mapping
const SKU_QUANTITIES: Record<string, number> = {
  'KFSS': 1,    // Single bottle
  'KFSP': 12,   // Pack of 12
  'KFSB': 240,  // Box of 240 (20 packs × 12)
}

// GET /api/inventory
// Returns inventory with calculated committed and available stock
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    
    // Get physical inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('Inventory')
      .select(`
        *,
        Product(id, sku, name, basePrice, isBundle),
        Location(id, code, name)
      `)
      .order('available', { ascending: true })
      .limit(100)
    
    if (inventoryError) {
      console.error('[INVENTORY_GET_ERROR]', inventoryError)
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
    
    // Get all non-delivered orders to calculate committed stock
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('lineItems')
      .not('status', 'eq', 'DELIVERED')
    
    if (ordersError) {
      console.error('[ORDERS_GET_ERROR]', ordersError)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
    
    // Calculate committed stock by SKU
    const committedBySku: Record<string, number> = {}
    
    console.log(`[INVENTORY] Processing ${orders?.length || 0} non-delivered orders`)
    
    for (const order of orders || []) {
      const lineItems = (order.lineItems || []) as any[]
      console.log(`[INVENTORY] Order line items:`, JSON.stringify(lineItems))
      
      for (const item of lineItems) {
        const sku = item.sku || item.title
        const quantity = item.quantity || 0
        
        console.log(`[INVENTORY] Item: sku=${sku}, qty=${quantity}`)
        
        // Convert to bottle equivalent
        const bottleQty = SKU_QUANTITIES[sku] || 1
        const totalBottles = quantity * bottleQty
        
        console.log(`[INVENTORY] ${sku}: ${quantity} units × ${bottleQty} bottles = ${totalBottles} bottles`)
        
        committedBySku[sku] = (committedBySku[sku] || 0) + totalBottles
      }
    }
    
    console.log(`[INVENTORY] Committed by SKU:`, committedBySku)
    
    // Transform inventory with calculated fields
    const formatted = inventory.map((item: any) => {
      const sku = item.Product?.sku || 'UNKNOWN'
      const physicalStock = item.currentStock || 0
      
      // Calculate committed stock (bottles committed to non-delivered orders)
      const bottlePerUnit = SKU_QUANTITIES[sku] || 1
      const committedBottles = committedBySku[sku] || 0
      const committedUnits = Math.ceil(committedBottles / bottlePerUnit)
      
      // Available = Physical - Committed
      const availableUnits = Math.max(0, physicalStock - committedUnits)
      
      return {
        id: item.id,
        sku,
        name: item.Product?.name || 'Unknown',
        basePrice: item.Product?.basePrice || 0,
        isBundle: item.Product?.isBundle || false,
        location: item.Location?.name || item.Location?.code,
        
        // Stock levels
        physicalStock,
        committedStock: committedUnits,
        availableStock: availableUnits,
        
        // Bottle equivalent (for reference)
        physicalBottles: physicalStock * bottlePerUnit,
        committedBottles,
        availableBottles: availableUnits * bottlePerUnit,
        
        // Reorder settings
        reorderPoint: item.reorderPoint,
        reorderQty: item.reorderQty,
        
        // Flag if below reorder point
        needsReorder: availableUnits <= (item.reorderPoint || 0),
      }
    })
    
    return NextResponse.json({
      inventory: formatted,
      debug: {
        totalOrders: orders?.length || 0,
        committedBySku,
      }
    })
  } catch (error: any) {
    console.error('[API_INVENTORY_GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
