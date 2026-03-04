// Shopify OAuth callback handler
// Updated for krakenergy.com domain

import { NextRequest, NextResponse } from 'next/server'

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const shop = searchParams.get('shop')
  const code = searchParams.get('code')
  const hmac = searchParams.get('hmac')
  
  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing shop or code' }, { status: 400 })
  }
  
  try {
    // Exchange the code for an access token
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code: code
      })
    })
    
    const data = await response.json()
    
    if (data.access_token) {
      // Display the token (in production, you'd save this to database)
      return NextResponse.json({
        success: true,
        access_token: data.access_token,
        scope: data.scope,
        message: 'Copy this access_token to your SHOPIFY_ACCESS_TOKEN environment variable'
      })
    } else {
      return NextResponse.json({ error: 'Failed to get access token', details: data }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}// Force rebuild Wed Mar  4 03:19:14 PM CST 2026
