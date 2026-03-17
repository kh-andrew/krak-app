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

// For compatibility
export const supabaseAdmin = {
  from(table: string) {
    return getSupabaseAdmin().from(table)
  }
}

// Type-safe database helpers
export async function dbQuery(table: string, query: any = {}) {
  const { data, error } = await getSupabaseAdmin()
    .from(table)
    .select(query.select || '*')
    
  if (error) {
    console.error(`[DB_ERROR] ${table}:`, error)
    throw error
  }
  
  return data
}

export async function dbInsert(table: string, data: any) {
  const { data: result, error } = await getSupabaseAdmin()
    .from(table)
    .insert(data)
    .select()
    .single()
    
  if (error) {
    console.error(`[DB_INSERT_ERROR] ${table}:`, error)
    throw error
  }
  
  return result
}

export async function dbUpdate(table: string, id: string, data: any) {
  const { data: result, error } = await getSupabaseAdmin()
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()
    
  if (error) {
    console.error(`[DB_UPDATE_ERROR] ${table}:`, error)
    throw error
  }
  
  return result
}

export async function dbDelete(table: string, id: string) {
  const { error } = await getSupabaseAdmin()
    .from(table)
    .delete()
    .eq('id', id)
    
  if (error) {
    console.error(`[DB_DELETE_ERROR] ${table}:`, error)
    throw error
  }
  
  return true
}