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
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      delivery: {
        include: {
          assignedTo: {
            select: { name: true, email: true },
          },
        },
      },
      activityLogs: {
        include: {
          actor: {
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
  
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true },
  })
  
  // Serialize order data to handle Decimal and Date types
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
    customer: order.customer,
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
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      actor: log.actor,
    })),
  }
  
  return <OrderDetailClient order={serializedOrder as any} users={users} />
}
