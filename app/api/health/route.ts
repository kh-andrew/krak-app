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
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
