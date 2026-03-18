import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET() {
  await requireAuth()
  
  const supabase = getSupabaseAdmin()
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers(*),
      deliveries(*, users(id, name, email))
    `)
    .order('createdAt', { ascending: false })
  
  if (error) {
    console.error('[ORDERS_GET_ERROR]', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
  
  return NextResponse.json(orders)
}