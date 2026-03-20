import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET /api/inventory
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    
    const { data: inventory, error } = await supabase
      .from('Inventory')
      .select(`
        *,
        Product(id, sku, name, basePrice, isBundle),
        Location(id, code, name)
      `)
      .order('available', { ascending: true })
      .limit(100)
    
    if (error) {
      console.error('[INVENTORY_GET_ERROR]', error)
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
    
    // Transform to match expected format
    const formatted = inventory.map((item: any) => ({
      id: item.id,
      currentStock: item.currentStock || 0,
      reserved: item.reserved || 0,
      available: item.available || 0,
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      sku: item.Product?.sku || 'UNKNOWN',
      name: item.Product?.name || 'Unknown',
      basePrice: item.Product?.basePrice || 0,
      isBundle: item.Product?.isBundle || false,
      location: item.Location?.name || item.Location?.code
    }))
    
    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('[API_INVENTORY_GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
