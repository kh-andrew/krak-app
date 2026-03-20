import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'
import { syncOrderToHubSpot } from '@/lib/hubspot-sync'

// POST /api/admin/sync-shopify-order
// Manually sync a Shopify order to KOMT (for missed webhooks)
// Requires authentication

export async function POST(req: Request) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    // Temporarily allow all authenticated users (for order sync)
    // TODO: Re-enable admin check after sync complete
    // if (session.user?.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized - Admin only' },
    //     { status: 403 }
    //   )
    // }
    
    const body = await req.json()
    const { shopifyOrderId, shopifyOrderNumber, email, totalAmount, currency, lineItems, customer, shippingAddress } = body
    
    // Validate required fields
    if (!shopifyOrderId || !email || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: shopifyOrderId, email, totalAmount' },
        { status: 400 }
      )
    }
    
    const supabase = getSupabaseAdmin()
    
    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('shopifyId', shopifyOrderId.toString())
      .single()
    
    if (existingOrder) {
      return NextResponse.json(
        { error: 'Order already exists', orderId: existingOrder.id },
        { status: 409 }
      )
    }
    
    // Upsert customer
    const customerEmail = email || customer?.email || `order-${shopifyOrderId}@placeholder.com`
    
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .single()
    
    let customerId: string
    
    if (existingCustomer) {
      customerId = existingCustomer.id
      // Update customer info
      await supabase
        .from('customers')
        .update({
          firstName: customer?.first_name,
          lastName: customer?.last_name,
          phone: customer?.phone,
          address: shippingAddress?.address1 || customer?.default_address?.address1,
          city: shippingAddress?.city || customer?.default_address?.city,
          postalCode: shippingAddress?.zip || customer?.default_address?.zip,
          country: shippingAddress?.country || customer?.default_address?.country,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          id: crypto.randomUUID(),
          shopifyId: customer?.id?.toString(),
          email: customerEmail,
          firstName: customer?.first_name,
          lastName: customer?.last_name,
          phone: customer?.phone,
          address: shippingAddress?.address1,
          city: shippingAddress?.city,
          postalCode: shippingAddress?.zip,
          country: shippingAddress?.country,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (customerError || !newCustomer) {
        throw new Error(`Failed to create customer: ${customerError?.message}`)
      }
      customerId = newCustomer.id
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: crypto.randomUUID(),
        shopifyId: shopifyOrderId.toString(),
        shopifyOrderNumber: shopifyOrderNumber || `#${shopifyOrderId}`,
        customerId: customerId,
        totalAmount: parseFloat(totalAmount),
        currency: currency || 'USD',
        lineItems: lineItems || [],
        status: 'RECEIVED',
        shopifySyncStatus: 'SYNCED',
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`)
    }
    
    // Create delivery record
    await supabase.from('deliveries').insert({
      id: crypto.randomUUID(),
      orderId: order.id,
      deliveryAddress: [
        shippingAddress?.address1,
        shippingAddress?.address2,
        shippingAddress?.city,
        shippingAddress?.province,
        shippingAddress?.zip,
        shippingAddress?.country,
      ].filter(Boolean).join(', '),
      updatedAt: new Date().toISOString(),
    })
    
    // Log activity
    await supabase.from('activity_logs').insert({
      id: crypto.randomUUID(),
      orderId: order.id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'order_received',
      entityType: 'order',
      fieldName: 'status',
      newValue: 'RECEIVED',
      notes: `Order manually synced from Shopify (#${shopifyOrderId})`,
    })
    
    // Sync to HubSpot (async)
    syncOrderToHubSpot(order.id).catch(console.error)
    
    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: `Order #${shopifyOrderNumber || shopifyOrderId} synced successfully`,
    })
    
  } catch (error: any) {
    console.error('[MANUAL_SYNC_ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync order' },
      { status: 500 }
    )
  }
}
