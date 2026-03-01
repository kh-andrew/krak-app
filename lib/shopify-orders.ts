import { shopifyClient } from '@/lib/shopify'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'

interface ShopifyOrder {
  id: string
  name: string
  email: string
  totalPriceSet: {
    shopMoney: {
      amount: string
      currencyCode: string
    }
  }
  lineItems: {
    edges: Array<{
      node: {
        title: string
        quantity: number
        originalUnitPriceSet: {
          shopMoney: {
            amount: string
          }
        }
        sku: string | null
      }
    }>
  }
  customer?: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    phone: string | null
    defaultAddress?: {
      address1: string | null
      city: string | null
      zip: string | null
      country: string | null
    }
  }
  shippingAddress?: {
    address1: string
    city: string
    zip: string
    country: string
  }
}

export async function fetchShopifyOrder(shopifyOrderId: string): Promise<ShopifyOrder | null> {
  const query = `
    query getOrder($id: ID!) {
      order(id: $id) {
        id
        name
        email
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        lineItems(first: 50) {
          edges {
            node {
              title
              quantity
              originalUnitPriceSet {
                shopMoney {
                  amount
                }
              }
              sku
            }
          }
        }
        customer {
          id
          email
          firstName
          lastName
          phone
          defaultAddress {
            address1
            city
            zip
            country
          }
        }
        shippingAddress {
          address1
          city
          zip
          country
        }
      }
    }
  `

  try {
    const response = await shopifyClient.request(query, {
      variables: { id: shopifyOrderId },
    }) as any

    return response.data?.order ?? null
  } catch (error) {
    console.error('Error fetching Shopify order:', error)
    return null
  }
}

export async function updateShopifyOrderStatus(
  shopifyOrderId: string, 
  status: OrderStatus
): Promise<boolean> {
  const statusMap: Record<OrderStatus, string> = {
    RECEIVED: 'PENDING',
    PREPARING: 'PROCESSING',
    OUT_FOR_DELIVERY: 'SHIPPED',
    DELIVERED: 'FULFILLED',
    FAILED: 'UNFULFILLED',
  }

  const mutation = `
    mutation orderUpdate($input: OrderInput!) {
      orderUpdate(input: $input) {
        order {
          id
          displayFulfillmentStatus
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const response = await shopifyClient.request(mutation, {
      variables: {
        input: {
          id: shopifyOrderId,
          tags: [`delivery:${status.toLowerCase()}`],
        },
      },
    }) as any

    const errors = response.data?.orderUpdate?.userErrors
    if (errors?.length > 0) {
      console.error('Shopify update errors:', errors)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating Shopify order:', error)
    return false
  }
}

export async function createFulfillment(
  shopifyOrderId: string,
  trackingInfo?: { company: string; number: string }
): Promise<boolean> {
  const mutation = `
    mutation fulfillmentCreate($input: FulfillmentInput!) {
      fulfillmentCreate(input: $input) {
        fulfillment {
          id
          status
        }
        userErrors {
          field
          message
        }
      }
    }
  `

  try {
    const response = await shopifyClient.request(mutation, {
      variables: {
        input: {
          orderId: shopifyOrderId,
          trackingInfo: trackingInfo ? [trackingInfo] : [],
          notifyCustomer: true,
        },
      },
    }) as any

    const errors = response.data?.fulfillmentCreate?.userErrors
    if (errors?.length > 0) {
      console.error('Fulfillment creation errors:', errors)
      return false
    }

    return true
  } catch (error) {
    console.error('Error creating fulfillment:', error)
    return false
  }
}
