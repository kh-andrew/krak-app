import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { uploadSignature, uploadDeliveryPhoto } from '@/lib/cloudinary'
import { updateShopifyOrderStatus } from '@/lib/shopify-orders'
import { syncDeliveryToHubSpot } from '@/lib/hubspot-sync'
import { z } from 'zod'

const assignSchema = z.object({
  userId: z.string(),
})

const deliverSchema = z.object({
  signatureDataUrl: z.string().optional(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  const { id } = await params
  
  const formData = await req.formData()
  const action = formData.get('action') as string
  
  const delivery = await prisma.delivery.findUnique({
    where: { orderId: id },
    include: { order: true },
  })
  
  if (!delivery) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }
  
  // Handle assignment
  if (action === 'assign') {
    const userId = formData.get('userId') as string
    
    const updated = await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        assignedToId: userId,
        assignedAt: new Date(),
      },
    })
    
    await prisma.activityLog.create({
      data: {
        orderId: id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: 'delivery_assigned',
        entityType: 'delivery',
        fieldName: 'assignedToId',
        newValue: userId,
        notes: `Delivery assigned to user ${userId}`,
      },
    })
    
    return NextResponse.json(updated)
  }
  
  // Handle delivery completion
  if (action === 'complete') {
    const signatureDataUrl = formData.get('signatureDataUrl') as string | null
    const photoFile = formData.get('photo') as File | null
    const notes = formData.get('notes') as string | null
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null
    
    let signatureUrl: string | null = null
    let photoUrl: string | null = null
    
    // Upload signature if provided
    if (signatureDataUrl) {
      const signatureResult = await uploadSignature(signatureDataUrl, id)
      signatureUrl = signatureResult?.url || null
    }
    
    // Upload photo if provided
    if (photoFile) {
      const bytes = await photoFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const photoResult = await uploadDeliveryPhoto(buffer, id)
      photoUrl = photoResult?.url || null
    }
    
    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        signatureUrl: signatureUrl || undefined,
        photoUrl: photoUrl || undefined,
        deliveredAt: new Date(),
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        deliveryNotesInternal: notes || undefined,
      },
    })
    
    // Update order status
    await prisma.order.update({
      where: { id },
      data: { status: 'DELIVERED' },
    })
    
    // Sync to Shopify
    const shopifySynced = await updateShopifyOrderStatus(delivery.order.shopifyId, 'DELIVERED')
    
    await prisma.order.update({
      where: { id },
      data: {
        shopifySyncStatus: shopifySynced ? 'SYNCED' : 'FAILED',
        shopifyUpdatedAt: shopifySynced ? new Date() : null,
      },
    })
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        orderId: id,
        actorId: session.user.id,
        actorEmail: session.user.email,
        action: 'delivery_completed',
        entityType: 'delivery',
        fieldName: 'status',
        oldValue: delivery.order.status,
        newValue: 'DELIVERED',
        notes: `Delivery completed. Signature: ${signatureUrl ? 'Yes' : 'No'}, Photo: ${photoUrl ? 'Yes' : 'No'}`,
      },
    })
    
    // Sync to HubSpot (async)
    syncDeliveryToHubSpot(delivery.id).catch(console.error)
    
    return NextResponse.json(updatedDelivery)
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
