import { prisma } from '@/lib/prisma'
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
  
  // Parallel queries - load order and users simultaneously
  const [order, users] = await Promise.all([
    prisma.orders.findUnique({
      where: { id },
      include: {
        customers: true,
        deliveries: {
          include: {
            users: {
              select: { name: true, email: true },
            },
          },
        },
        activity_logs: {
          include: {
            users: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit activity logs to prevent huge payloads
        },
      },
    }),
    prisma.users.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    })
  ])
  
  if (!order) {
    notFound()
  }
  
  // Serialize order data - only include fields that match the interface
  const serializedOrder = {
    id: order.id,
    shopifyId: order.shopifyId,
    shopifyOrderNumber: order.shopifyOrderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    lineItems: order.lineItems as any[],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
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
    delivery: order.deliveries ? {
      id: order.deliveries.id,
      deliveryAddress: order.deliveries.deliveryAddress,
      deliveryNotes: order.deliveries.deliveryNotes,
      assignedTo: order.deliveries.users ? {
        name: order.deliveries.users.name,
        email: order.deliveries.users.email,
      } : null,
      signatureUrl: order.deliveries.signatureUrl,
      photoUrl: order.deliveries.photoUrl,
      deliveredAt: order.deliveries.deliveredAt?.toISOString() || null,
      latitude: order.deliveries.latitude,
      longitude: order.deliveries.longitude,
    } : null,
    activityLogs: order.activity_logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      fieldName: log.fieldName,
      oldValue: log.oldValue,
      newValue: log.newValue,
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
      actor: log.users ? {
        name: log.users.name,
        email: log.users.email,
      } : null,
    })),
  }
  
  return <OrderDetailClient order={serializedOrder as any} users={users as any} />
}
