import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    
    // Test database connection
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      users: count || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[HEALTH_CHECK_ERROR]', error)
    const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
