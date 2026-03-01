import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api'
import '@shopify/shopify-api/adapters/node'

// Shopify integration is optional - only initialize if credentials are provided
const hasShopifyConfig = process.env.SHOPIFY_API_KEY && 
  process.env.SHOPIFY_API_SECRET && 
  process.env.SHOPIFY_ACCESS_TOKEN &&
  process.env.SHOPIFY_SHOP_NAME

let shopify: any = null
let shopifyClient: any = null

if (hasShopifyConfig) {
  shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY!,
    apiSecretKey: process.env.SHOPIFY_API_SECRET!,
    apiVersion: LATEST_API_VERSION,
    scopes: ['read_orders', 'write_orders', 'read_customers'],
    hostName: process.env.NEXTAUTH_URL?.replace('https://', '').replace('http://', '') || 'localhost',
    isEmbeddedApp: false,
  })

  shopifyClient = new shopify.clients.Graphql({
    session: {
      shop: process.env.SHOPIFY_SHOP_NAME!,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
    } as any,
  })
} else {
  console.log('Shopify not configured - order sync will be manual')
}

export { shopify, shopifyClient }
