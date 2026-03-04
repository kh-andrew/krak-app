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
  
  const order = await prisma.orders.findUnique({
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
      },
    },
  })
  
  if (!order) {
    notFound()
  }
  
  const users = await prisma.users.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  })
  
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
    customer: order.customer ? {
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      email: order.customer.email,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      postalCode: order.customer.postalCode,
      country: order.customer.country,
    } : null,
    delivery: order.delivery ? {
      id: order.delivery.id,
      deliveryAddress: order.delivery.deliveryAddress,
      deliveryNotes: order.delivery.deliveryNotes,
      assignedTo: order.delivery.assignedTo ? {
        name: order.delivery.assignedTo.name,
        email: order.delivery.assignedTo.email,
      } : null,
      signatureUrl: order.delivery.signatureUrl,
      photoUrl: order.delivery.photoUrl,
      deliveredAt: order.delivery.deliveredAt?.toISOString() || null,
      latitude: order.delivery.latitude,
      longitude: order.delivery.longitude,
    } : null,
    activityLogs: order.activityLogs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      fieldName: log.fieldName,
      oldValue: log.oldValue,
      newValue: log.newValue,
      notes: log.notes,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor ? {
        name: log.actor.name,
        email: log.actor.email,
      } : null,
    })),
  }
  
  return <OrderDetailClient order={serializedOrder as any} users={users as any} />
}
