import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api'
import '@shopify/shopify-api/adapters/node'

// Shopify integration using Client Credentials Grant (Dev Dashboard apps)
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET
const SHOPIFY_SHOP_NAME = process.env.SHOPIFY_SHOP_NAME

let shopify: any = null
let shopifyClient: any = null
let accessToken: string | null = null
let tokenExpiry: number = 0

// Get access token using Client Credentials Grant
async function getAccessToken(): Promise<string | null> {
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET || !SHOPIFY_SHOP_NAME) {
    return null
  }
  
  // Return cached token if still valid (with 5 min buffer)
  if (accessToken && Date.now() < tokenExpiry - 300000) {
    return accessToken
  }
  
  try {
    const response = await fetch(`https://${SHOPIFY_SHOP_NAME}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        grant_type: 'client_credentials'
      })
    })
    
    const data = await response.json()
    
    if (data.access_token) {
      accessToken = data.access_token
      // Token expires in 24 hours (86399 seconds)
      tokenExpiry = Date.now() + (data.expires_in * 1000)
      return accessToken
    }
  } catch (error) {
    console.error('Failed to get Shopify access token:', error)
  }
  
  return null
}

// Initialize Shopify client with fresh token
export async function getShopifyClient() {
  const token = await getAccessToken()
  
  if (!token || !SHOPIFY_SHOP_NAME) {
    console.log('Shopify not configured - order sync will be manual')
    return null
  }
  
  if (!shopify) {
    shopify = shopifyApi({
      apiKey: SHOPIFY_API_KEY!,
      apiSecretKey: SHOPIFY_API_SECRET!,
      apiVersion: LATEST_API_VERSION,
      scopes: ['read_orders', 'write_orders', 'read_customers'],
      hostName: process.env.NEXTAUTH_URL?.replace('https://', '').replace('http://', '') || 'localhost',
      isEmbeddedApp: false,
    })
  }
  
  shopifyClient = new shopify.clients.Graphql({
    session: {
      shop: SHOPIFY_SHOP_NAME,
      accessToken: token,
    } as any,
  })
  
  return shopifyClient
}

// Backward compatibility - synchronous export (will be null until first async call)
export { shopify, shopifyClient }