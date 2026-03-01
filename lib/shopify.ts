import { shopifyApi, LATEST_API_VERSION, ApiVersion } from '@shopify/shopify-api'
import '@shopify/shopify-api/adapters/node'

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  apiVersion: LATEST_API_VERSION,
  scopes: ['read_orders', 'write_orders', 'read_customers'],
  hostName: process.env.NEXTAUTH_URL!.replace('https://', '').replace('http://', ''),
  isEmbeddedApp: false,
})

export const shopifyClient = new shopify.clients.Graphql({
  session: {
    shop: process.env.SHOPIFY_SHOP_NAME!,
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
  } as any,
})

export { shopify }
