import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shopify } from '@/lib/shopify'
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

  // Verify webhook
  if (!verifyWebhook(body, hmac)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const payload = JSON.parse(body)

  // Store webhook event for processing
  try {
    await prisma.webhookEvent.create({
      data: {
        shopifyId: shopifyWebhookId,
        topic,
        payload,
        processed: false,
      },
    })

    // Process immediately for orders/create
    if (topic === 'orders/create') {
      await processOrderCreate(payload)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function processOrderCreate(payload: any) {
  const { id, name, email, total_price, currency, line_items, customer, shipping_address } = payload

  // Upsert customer
  const customerData = await prisma.customer.upsert({
    where: { email: email || customer?.email || `order-${id}@placeholder.com` },
    update: {
      firstName: customer?.first_name,
      lastName: customer?.last_name,
      phone: customer?.phone,
      address: shipping_address?.address1 || customer?.default_address?.address1,
      city: shipping_address?.city || customer?.default_address?.city,
      postalCode: shipping_address?.zip || customer?.default_address?.zip,
      country: shipping_address?.country || customer?.default_address?.country,
    },
    create: {
      shopifyId: customer?.id,
      email: email || customer?.email || `order-${id}@placeholder.com`,
      firstName: customer?.first_name,
      lastName: customer?.last_name,
      phone: customer?.phone,
      address: shipping_address?.address1,
      city: shipping_address?.city,
      postalCode: shipping_address?.zip,
      country: shipping_address?.country,
    },
  })

  // Create order
  const order = await prisma.order.create({
    data: {
      shopifyId: id,
      shopifyOrderNumber: name,
      customerId: customerData.id,
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
    },
  })

  // Create delivery record
  await prisma.delivery.create({
    data: {
      orderId: order.id,
      deliveryAddress: [
        shipping_address?.address1,
        shipping_address?.address2,
        shipping_address?.city,
        shipping_address?.province,
        shipping_address?.zip,
        shipping_address?.country,
      ].filter(Boolean).join(', '),
    },
  })

  // Log activity
  await prisma.activityLog.create({
    data: {
      orderId: order.id,
      action: 'order_received',
      details: { source: 'shopify_webhook', shopifyOrderId: id },
    },
  })
}
