// Shopify Private App Authentication - Basic Auth

const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP_NAME
const API_KEY = process.env.SHOPIFY_API_KEY
const API_SECRET = process.env.SHOPIFY_API_SECRET
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01'

export async function shopifyRequest(endpoint: string, options: RequestInit = {}): Promise<any | null> {
  if (!SHOPIFY_SHOP || !API_KEY || !API_SECRET) {
    console.error('[Shopify] Missing env vars')
    return null
  }

  const url = `https://${SHOPIFY_SHOP}.myshopify.com/admin/api/${API_VERSION}/${endpoint}`
  console.log(`[Shopify] Request: ${endpoint}`)

  try {
    const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64')
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(`[Shopify] Error ${response.status}:`, err)
      return null
    }

    return await response.json()
  } catch (e) {
    console.error('[Shopify] Fetch error:', e)
    return null
  }
}
