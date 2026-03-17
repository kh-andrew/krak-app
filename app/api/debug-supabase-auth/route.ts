import { NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    console.log('[DEBUG_AUTH] Attempting login:', email)
    console.log('[DEBUG_AUTH] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
    console.log('[DEBUG_AUTH] Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set')
    
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.log('[DEBUG_AUTH] Error:', error.message)
      return NextResponse.json({ error: error.message, status: 'failed' }, { status: 400 })
    }
    
    console.log('[DEBUG_AUTH] Success:', data.user?.email)
    return NextResponse.json({ 
      status: 'success',
      user: data.user,
      session: data.session
    })
  } catch (error) {
    console.error('[DEBUG_AUTH] Exception:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}