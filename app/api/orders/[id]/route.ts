import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { updateShopifyOrderStatus } from '@/lib/shopify-orders'
import { syncDeliveryToHubSpot } from '@/lib/hubspot-sync'
import { z } from 'zod'

const statusUpdateSchema = z.object({
  status: z.enum(['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']),
  notes: z.string().optional(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth()
  const { id } = await params
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: true,
      delivery: {
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
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
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  
  return NextResponse.json(order)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  const { id } = await params
  
  const body = await req.json()
  const parsed = statusUpdateSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  
  const { status, notes } = parsed.data
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: { delivery: true },
  })
  
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }
  
  // Update order status
  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
  })
  
  // Sync to Shopify
  const shopifySynced = await updateShopifyOrderStatus(order.shopifyId, status)
  
  await prisma.order.update({
    where: { id },
    data: {
      shopifySyncStatus: shopifySynced ? 'SYNCED' : 'FAILED',
      shopifyUpdatedAt: shopifySynced ? new Date() : null,
    },
  })
  
  // Log activity (lean schema)
  await prisma.activityLog.create({
    data: {
      orderId: id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'status_changed',
      entityType: 'order',
      fieldName: 'status',
      oldValue: order.status,
      newValue: status,
      notes: notes || `Status changed from ${order.status} to ${status}`,
    },
  })
  
  // If delivered, sync to HubSpot
  if (status === 'DELIVERED' && order.delivery) {
    await prisma.delivery.update({
      where: { id: order.delivery.id },
      data: { deliveredAt: new Date() },
    })
    
    // Async HubSpot sync (don't block response)
    syncDeliveryToHubSpot(order.delivery.id).catch(console.error)
  }
  
  return NextResponse.json(updatedOrder)
}
