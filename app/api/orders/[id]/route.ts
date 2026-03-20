import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'
import { updateShopifyOrderStatus } from '@/lib/shopify-orders'
import { syncDeliveryToHubSpot } from '@/lib/hubspot-sync'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']),
  notes: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth()
  const { id } = await params
  
  const supabase = getSupabaseAdmin()
  
  // Fetch order with related data
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      deliveries(*, users(id, name, email)),
      activity_logs(*, users(name, email))
    `)
    .eq('id', id)
    .single()
  
  if (orderError || !order) {
    console.error('[ORDER_GET_ERROR]', orderError)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  
  // Sort activity logs by createdAt desc
  if (order.activity_logs) {
    order.activity_logs.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
  
  return NextResponse.json(order)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  
  const body = await req.json()
  const parsed = statusUpdateSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  
  const { status, notes } = parsed.data
  
  // Get order with delivery info
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, deliveries(*)')
    .eq('id', id)
    .single()
  
  if (orderError || !order) {
    console.error('[ORDER_PATCH_ERROR]', orderError)
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  
  const oldStatus = order.status
  
  // Update order status
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  
  if (updateError) {
    console.error('[ORDER_UPDATE_ERROR]', updateError)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
  
  // Sync to Shopify (if shopifyId exists)
  let shopifySynced = false
  if (order.shopifyId) {
    try {
      shopifySynced = await updateShopifyOrderStatus(order.shopifyId, status)
    } catch (error) {
      console.error('[SHOPIFY_SYNC_ERROR]', error)
    }
  }
  
  // Update Shopify sync status
  await supabase
    .from('orders')
    .update({
      shopifySyncStatus: shopifySynced ? 'SYNCED' : 'FAILED',
      shopifyUpdatedAt: shopifySynced ? new Date().toISOString() : null,
    })
    .eq('id', id)
  
  // Log activity (let Supabase generate UUID)
  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({
      orderId: id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'status_changed',
      entityType: 'order',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: status,
      notes: notes || `Status changed from ${oldStatus} to ${status}`,
    })
  
  if (logError) {
    console.error('[ACTIVITY_LOG_ERROR]', logError)
  }
  
  // If delivered, update delivery and sync to HubSpot
  if (status === 'DELIVERED' && order.deliveries) {
    await supabase
      .from('deliveries')
      .update({ deliveredAt: new Date().toISOString() })
      .eq('id', order.deliveries.id)
    
    // Async HubSpot sync (don't block response)
    syncDeliveryToHubSpot(order.deliveries.id).catch(console.error)
  }
  
  return NextResponse.json(updatedOrder)
}
