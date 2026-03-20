import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'
import { notFound } from 'next/navigation'
import OrderDetailClient from './OrderDetailClient'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  
  // Get order with related data
  const { data: order, error: orderError } = await (supabase as any)
    .from('orders')
    .select(`
      *,
      customers(*),
      deliveries(*, users(name, email)),
      activity_logs(*, users(name, email))
    `)
    .eq('id', id)
    .single()
  
  if (orderError || !order) {
    notFound()
  }
  
  // Get active users
  const { data: users } = await (supabase as any)
    .from('users')
    .select('id, name, email')
    .eq('isActive', true)
  
  // Serialize order data
  const delivery = Array.isArray(order.deliveries) ? order.deliveries[0] : order.deliveries
  const activityLogs = Array.isArray(order.activity_logs) ? order.activity_logs : []
  
  const serializedOrder = {
    id: order.id,
    shopifyId: order.shopifyId,
    shopifyOrderNumber: order.shopifyOrderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    lineItems: order.lineItems as any[],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.customers ? {
      firstName: order.customers.firstName,
      lastName: order.customers.lastName,
      email: order.customers.email,
      phone: order.customers.phone,
      address: order.customers.address,
      city: order.customers.city,
      postalCode: order.customers.postalCode,
      country: order.customers.country,
    } : null,
    delivery: delivery ? {
      id: delivery.id,
      deliveryAddress: delivery.deliveryAddress,
      deliveryNotes: delivery.deliveryNotesInternal,
      assignedTo: delivery.users ? {
        name: delivery.users.name,
        email: delivery.users.email,
      } : null,
      signatureUrl: delivery.signatureUrl,
      photoUrl: delivery.photoUrl,
      deliveredAt: delivery.deliveredAt,
      latitude: delivery.latitude,
      longitude: delivery.longitude,
    } : null,
    activityLogs: activityLogs.map((log: any) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      fieldName: log.fieldName,
      oldValue: log.oldValue,
      newValue: log.newValue,
      notes: log.notes,
      createdAt: log.createdAt,
      actor: log.users ? {
        name: log.users.name,
        email: log.users.email,
      } : null,
    })),
  }
  
  return <OrderDetailClient order={serializedOrder as any} users={users as any} />
}
