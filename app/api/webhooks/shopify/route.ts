import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { syncOrderToHubSpot } from '@/lib/hubspot-sync'
import crypto from 'crypto'

// Verify Shopify webhook signature
function verifyWebhook(body: string, hmac: string): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64')
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hmac)
  )
}

export async function POST(req: Request) {
  const body = await req.text()
  const hmac = req.headers.get('x-shopify-hmac-sha256') || ''
  const topic = req.headers.get('x-shopify-topic') || ''
  const shopifyWebhookId = req.headers.get('x-shopify-webhook-id') || ''
  const supabase = getSupabaseAdmin()

  // Verify webhook
  if (!verifyWebhook(body, hmac)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // Store webhook event for processing
  try {
    await supabase.from('webhook_events').insert({
      shopifyId: shopifyWebhookId,
      topic,
      payload,
      processed: false,
    })

    // Process immediately for orders/create
    if (topic === 'orders/create') {
      await processOrderCreate(payload, supabase)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function processOrderCreate(payload: any, supabase: any) {
  const { id, name, email, total_price, currency, line_items, customer, shipping_address } = payload

  const customerEmail = email || customer?.email || `order-${id}@placeholder.com`

  // Check if customer exists
  const { data: existingCustomer, error: customerCheckError } = await supabase
    .from('customers')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle()

  let customerId: string

  if (existingCustomer) {
    // Update existing customer
    customerId = existingCustomer.id
    await supabase
      .from('customers')
      .update({
        firstName: customer?.first_name,
        lastName: customer?.last_name,
        phone: customer?.phone,
        address: shipping_address?.address1 || customer?.default_address?.address1,
        city: shipping_address?.city || customer?.default_address?.city,
        postalCode: shipping_address?.zip || customer?.default_address?.zip,
        country: shipping_address?.country || customer?.default_address?.country,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', customerId)
  } else {
    // Create new customer
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        shopifyId: customer?.id?.toString(),
        email: customerEmail,
        firstName: customer?.first_name,
        lastName: customer?.last_name,
        phone: customer?.phone,
        address: shipping_address?.address1,
        city: shipping_address?.city,
        postalCode: shipping_address?.zip,
        country: shipping_address?.country,
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
      shopifyId: id?.toString(),
      shopifyOrderNumber: name,
      customerId: customerId,
      totalAmount: parseFloat(total_price),
      currency: currency || 'USD',
      lineItems: line_items.map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku,
      })),
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
    orderId: order.id,
    deliveryAddress: [
      shipping_address?.address1,
      shipping_address?.address2,
      shipping_address?.city,
      shipping_address?.province,
      shipping_address?.zip,
      shipping_address?.country,
    ].filter(Boolean).join(', '),
    updatedAt: new Date().toISOString(),
  })

  // Log activity
  await supabase.from('activity_logs').insert({
    orderId: order.id,
    action: 'order_received',
    entityType: 'order',
    fieldName: 'status',
    newValue: 'RECEIVED',
    notes: 'Order received from Shopify webhook',
  })

  // Sync to HubSpot
  syncOrderToHubSpot(order.id).catch(console.error)
}
