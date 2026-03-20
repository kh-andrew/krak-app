import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check env vars first
    const envStatus = {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
    
    if (!envStatus.url || (!envStatus.serviceKey && !envStatus.anonKey)) {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        error: 'Missing environment variables',
        envStatus,
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
    
    const supabase = getSupabaseAdmin()
    
    // Test database connection
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('[HEALTH_CHECK_DB_ERROR]', error)
      throw error
    }
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      users: count || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[HEALTH_CHECK_ERROR]', error)
    const errorMessage = error?.message || error?.code || (typeof error === 'object' ? JSON.stringify(error) : String(error))
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
