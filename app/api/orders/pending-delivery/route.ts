import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/orders/pending-delivery
// Get orders ready for delivery (out for delivery or not yet assigned)
export async function GET() {
  await requireAuth()
  const supabase = getSupabaseAdmin()
  
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(firstName, lastName, email),
        deliveries(deliveryAddress, users(email, name))
      `)
      .in('status', ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'])
      .not('deliveries', 'is', null)
      .order('createdAt', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('[PENDING_DELIVERIES_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending deliveries' },
        { status: 500 }
      )
    }
    
    // Format for Telegram
    const formatted = orders.map((order: any) => ({
      id: order.id,
      shopifyOrderNumber: order.shopifyOrderNumber || order.id.slice(0, 8),
      customerName: order.customers 
        ? `${order.customers.firstName || ''} ${order.customers.lastName || ''}`.trim() || order.customers.email
        : 'Unknown',
      deliveryAddress: order.deliveries?.deliveryAddress || 'No address',
      status: order.status,
      assignedTo: order.deliveries?.users?.email || null
    }))
    
    return NextResponse.json(formatted)
    
  } catch (error) {
    console.error('Pending deliveries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending deliveries' },
      { status: 500 }
    )
  }
}
