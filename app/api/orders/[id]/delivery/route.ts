import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import { uploadSignature, uploadDeliveryPhoto } from '@/lib/cloudinary'
import { updateShopifyOrderStatus, createFulfillment } from '@/lib/shopify-orders'
import { syncDeliveryToHubSpot } from '@/lib/hubspot-sync'

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
    const photo = formData.get('photo') as File | null
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
    
    // Upload photo if provided (base64 or file)
    const photoBase64 = formData.get('photoBase64') as string | null
    if (photoBase64) {
      // Convert base64 to buffer
      const buffer = Buffer.from(photoBase64, 'base64')
      const photoResult = await uploadDeliveryPhoto(buffer, id)
      photoUrl = photoResult?.url || null
    } else if (photo && photo.size > 0) {
      // Handle file upload (fallback)
      const bytes = await photo.arrayBuffer()
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
    
    // Sync to Shopify - Update status AND create fulfillment
    let shopifySynced = false
    try {
      // First update the order status (adds tag)
      const statusUpdated = await updateShopifyOrderStatus(delivery.order.shopifyId, 'DELIVERED')
      
      // Then create fulfillment (actually marks as fulfilled)
      const fulfillmentCreated = await createFulfillment(delivery.order.shopifyId)
      
      shopifySynced = statusUpdated && fulfillmentCreated
    } catch (error) {
      console.error('Shopify sync error:', error)
    }
    
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
    
    return NextResponse.json({ 
      success: true, 
      delivery: updatedDelivery,
      shopifySynced 
    })
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
