import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Client for browser (anon key) - lazy initialization
let clientInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseClient() {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey)
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
let adminInstance: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseAdmin() {
  if (!adminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[SUPABASE_INIT] URL exists:', !!supabaseUrl)
    console.log('[SUPABASE_INIT] Service key exists:', !!supabaseServiceKey)
    console.log('[SUPABASE_INIT] Anon key exists:', !!supabaseAnonKey)
    
    if (!supabaseUrl) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
    }
    
    const key = supabaseServiceKey || supabaseAnonKey
    if (!key) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    
    adminInstance = createClient<Database>(
      supabaseUrl,
      key,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js/2.x'
          }
        }
      }
    )
  }
  return adminInstance
}

// For compatibility - direct access to admin client
export const supabaseAdmin = {
  from<T extends keyof Database['public']['Tables']>(table: T) {
    return getSupabaseAdmin().from(table)
  }
}
