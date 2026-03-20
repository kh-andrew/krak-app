import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    },
    envVars: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...',
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    }
  }
  
  try {
    // Try to import and initialize Supabase
    const { getSupabaseAdmin } = await import('@/lib/supabase')
    diagnostics.importSuccess = true
    
    try {
      const supabase = getSupabaseAdmin()
      diagnostics.initSuccess = true
      
      // Try a simple query
      const { data, error } = await supabase.from('users').select('count').limit(1)
      
      if (error) {
        diagnostics.queryError = {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }
      } else {
        diagnostics.querySuccess = true
        diagnostics.data = data
      }
    } catch (initError: any) {
      diagnostics.initError = {
        message: initError?.message,
        stack: initError?.stack?.substring(0, 200),
      }
    }
  } catch (importError: any) {
    diagnostics.importError = {
      message: importError?.message,
      stack: importError?.stack?.substring(0, 200),
    }
  }
  
  return NextResponse.json(diagnostics)
}