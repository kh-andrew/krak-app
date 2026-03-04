import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET() {
  await requireAuth()
  
  const orders = await prisma.orders.findMany({
    include: {
      customer: true,
      delivery: {
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  return NextResponse.json(orders)
}
