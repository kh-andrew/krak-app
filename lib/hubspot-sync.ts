import { hubspotClient } from '@/lib/hubspot'
import { prisma } from '@/lib/prisma'

interface CustomerData {
  email: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  country?: string | null
}

interface OrderData {
  id: string
  shopifyOrderNumber: string | null
  totalAmount: number
  currency: string
  deliveredAt: Date | null
  lineItems: any[]
}

// HubSpot integration disabled until credentials are provided
// To enable: add HUBSPOT_ACCESS_TOKEN to environment variables

export async function syncCustomerToHubSpot(customerData: CustomerData): Promise<string | null> {
  // Skip if HubSpot is not configured
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.log('HubSpot not configured, skipping customer sync')
    return null
  }

  try {
    const properties = {
      email: customerData.email,
      firstname: customerData.firstName || '',
      lastname: customerData.lastName || '',
      phone: customerData.phone || '',
      address: customerData.address || '',
      city: customerData.city || '',
      zip: customerData.postalCode || '',
      country: customerData.country || '',
      lifecyclestage: 'customer',
    }

    const response = await hubspotClient.crm.contacts.basicApi.create({
      properties,
    })

    return response.id
  } catch (error: any) {
    // If contact already exists, try to update
    if (error.body?.category === 'CONFLICT') {
      try {
        const existing = await hubspotClient.crm.contacts.basicApi.getById(
          customerData.email,
          undefined,
          undefined,
          ['email']
        )
        
        await hubspotClient.crm.contacts.basicApi.update(existing.id, {
          properties: {
            firstname: customerData.firstName || '',
            lastname: customerData.lastName || '',
            phone: customerData.phone || '',
            lifecyclestage: 'customer',
          },
        })
        
        return existing.id
      } catch (updateError) {
        console.error('Error updating HubSpot contact:', updateError)
        return null
      }
    }
    
    console.error('Error syncing to HubSpot:', error)
    return null
  }
}

export async function createOrderDeal(
  hubspotContactId: string,
  orderData: OrderData,
  orderStatus: string = 'New Order'
): Promise<string | null> {
  // Skip if HubSpot is not configured
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.log('HubSpot not configured, skipping deal creation')
    return null
  }

  try {
    // Format line items for the deal description
    const lineItemsText = orderData.lineItems.map((item: any) => 
      `- ${item.quantity}x ${item.title} (${item.sku || 'No SKU'}) @ $${item.price}`
    ).join('\n')

    const dealProperties = {
      dealname: `Order ${orderData.shopifyOrderNumber || orderData.id}`,
      amount: orderData.totalAmount.toString(),
      dealstage: 'appointmentscheduled', // Initial stage for new orders
      closedate: orderData.deliveredAt?.toISOString() || new Date().toISOString(),
      pipeline: 'default',
      description: `Order Status: ${orderStatus}\n\nLine Items:\n${lineItemsText}`,
    }

    const deal = await hubspotClient.crm.deals.basicApi.create({
      properties: dealProperties,
    })

    // Associate deal with contact
    await hubspotClient.crm.associations.v4.basicApi.create(
      'deals',
      deal.id,
      'contacts',
      hubspotContactId,
      [{ associationCategory: 'HUBSPOT_DEFINED' as any, associationTypeId: 3 }]
    )

    return deal.id
  } catch (error) {
    console.error('Error creating HubSpot deal:', error)
    return null
  }
}

export async function syncDeliveryToHubSpot(deliveryId: string): Promise<boolean> {
  // Skip if HubSpot is not configured
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.log('HubSpot not configured, skipping delivery sync')
    return false
  }

  const delivery = await prisma.delivery.findUnique({
    where: { id: deliveryId },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
    },
  })

  if (!delivery || !delivery.order.customer) {
    return false
  }

  const customer = delivery.order.customer
  const order = delivery.order

  // Sync customer
  const hubspotContactId = await syncCustomerToHubSpot({
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
  })

  if (!hubspotContactId) {
    return false
  }

  // Update customer record with HubSpot ID
  await prisma.customer.update({
    where: { id: customer.id },
    data: { hubspotId: hubspotContactId },
  })

  // Create deal for the delivery
  const hubspotDealId = await createDeliveryDeal(hubspotContactId, {
    id: order.id,
    shopifyOrderNumber: order.shopifyOrderNumber,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    deliveredAt: delivery.deliveredAt,
    lineItems: order.lineItems as any[],
  })

  if (hubspotDealId) {
    await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        hubspotSynced: true,
        hubspotSyncAt: new Date(),
      },
    })
    return true
  }

  return false
}

export async function syncOrderToHubSpot(orderId: string): Promise<boolean> {
  // Skip if HubSpot is not configured
  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    console.log('HubSpot not configured, skipping order sync')
    return false
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      delivery: true,
    },
  })

  if (!order || !order.customer) {
    return false
  }

  const customer = order.customer

  // Sync customer to HubSpot
  const hubspotContactId = await syncCustomerToHubSpot({
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    postalCode: customer.postalCode,
    country: customer.country,
  })

  if (!hubspotContactId) {
    return false
  }

  // Update customer record with HubSpot ID
  await prisma.customer.update({
    where: { id: customer.id },
    data: { hubspotId: hubspotContactId },
  })

  // Create deal for the order (with line items)
  const hubspotDealId = await createOrderDeal(hubspotContactId, {
    id: order.id,
    shopifyOrderNumber: order.shopifyOrderNumber,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    deliveredAt: order.delivery?.deliveredAt,
    lineItems: order.lineItems as any[],
  }, order.status)

  if (hubspotDealId) {
    // Update order with HubSpot sync info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        hubspotSynced: true,
        hubspotSyncAt: new Date(),
      },
    })
    return true
  }

  return false
}
