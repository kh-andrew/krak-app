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
  
  return <OrderDetailClient order={order} users={users} />
}
