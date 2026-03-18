import { createClient } from '@supabase/supabase-js'

// Client for browser (anon key) - lazy initialization
let clientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    clientInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return clientInstance
}

// For compatibility with existing code
export const supabaseClient = {
  get auth() {
    return getSupabaseClient().auth
  }
}

// Admin client for server-side operations - lazy initialization
let adminInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!adminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    }
    
    adminInstance = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return adminInstance
}

// For compatibility - direct access to admin client
export const supabaseAdmin = {
  from(table: string) {
    return getSupabaseAdmin().from(table)
  }
}