import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // Use Supabase Auth API instead of database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }, { status: 500 })
    }
    
    // Try to sign in via Supabase Auth API
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    return NextResponse.json({
      status: response.status,
      supabaseAuth: data,
      message: response.status === 200 ? 'Login via Supabase Auth works!' : 'Supabase Auth failed'
    })
  } catch (error) {
    console.error('[SUPABASE_AUTH_ERROR]', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}