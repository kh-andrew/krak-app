import { shopifyRequest } from '@/lib/shopify-auth'
import { OrderStatus } from '@prisma/client'

const debug = (msg: string, data?: any) => console.log(`[Shopify] ${msg}`, data || '')

export async function updateShopifyOrderStatus(shopifyOrderId: string, status: OrderStatus): Promise<boolean> {
  const orderId = shopifyOrderId.split('/').pop()
  if (!orderId) return false
  
  const result = await shopifyRequest(`orders/${orderId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ order: { tags: `delivery:${status.toLowerCase()}` } })
  })
  
  return !!result?.order
}

export async function createFulfillment(shopifyOrderId: string, tracking?: { company: string; number: string }): Promise<boolean> {
  const orderId = shopifyOrderId.split('/').pop()
  if (!orderId) return false

  debug(`Creating fulfillment for order ${orderId}`)

  const foRes = await shopifyRequest(`orders/${orderId}/fulfillment_orders.json`)
  const orders = foRes?.fulfillment_orders || []
  
  if (!orders.length) {
    debug('No fulfillment orders found')
    return false
  }

  const fo = orders[0]
  if (!fo.assigned_location_id) {
    debug('No location ID')
    return false
  }

  const result = await shopifyRequest('fulfillments.json', {
    method: 'POST',
    body: JSON.stringify({
      fulfillment: {
        location_id: fo.assigned_location_id,
        notify_customer: true,
        tracking_number: tracking?.number,
        tracking_company: tracking?.company,
        line_items_by_fulfillment_order: [{
          fulfillment_order_id: fo.id,
          fulfillment_order_line_items: fo.line_items
            .filter((i: any) => i.fulfillable_quantity > 0)
            .map((i: any) => ({ id: i.id, quantity: i.fulfillable_quantity }))
        }]
      }
    })
  })

  if (result?.fulfillment) {
    debug('Fulfillment created:', result.fulfillment.id)
    return true
  }
  
  debug('Failed to create fulfillment')
  return false
}
