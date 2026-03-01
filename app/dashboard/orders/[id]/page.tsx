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
    ...order,
    totalAmount: Number(order.totalAmount),
    lineItems: order.lineItems as any[],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    delivery: order.delivery ? {
      ...order.delivery,
      assignedAt: order.delivery.assignedAt?.toISOString() || null,
      deliveredAt: order.delivery.deliveredAt?.toISOString() || null,
      hubspotSyncAt: order.delivery.hubspotSyncAt?.toISOString() || null,
      createdAt: order.delivery.createdAt.toISOString(),
      updatedAt: order.delivery.updatedAt.toISOString(),
    } : null,
    activityLogs: order.activityLogs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  }
  
  return <OrderDetailClient order={serializedOrder} users={users} />
}
