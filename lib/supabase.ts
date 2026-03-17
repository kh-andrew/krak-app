import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

// Client for browser (anon key)
export const supabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey || ''
)

// Admin client for server-side operations (service role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Type-safe database helper
export async function dbQuery(table: string, query: any = {}) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(query.select || '*')
    
  if (error) {
    console.error(`[DB_ERROR] ${table}:`, error)
    throw error
  }
  
  return data
}

export async function dbInsert(table: string, data: any) {
  const { data: result, error } = await supabaseAdmin
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
  const { data: result, error } = await supabaseAdmin
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
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id)
    
  if (error) {
    console.error(`[DB_DELETE_ERROR] ${table}:`, error)
    throw error
  }
  
  return true
}