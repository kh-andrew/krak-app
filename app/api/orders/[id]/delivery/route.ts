import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'
import { uploadSignature, uploadDeliveryPhoto } from '@/lib/storage'
import { updateShopifyOrderStatus, createFulfillment } from '@/lib/shopify-orders'
import { syncDeliveryToHubSpot } from '@/lib/hubspot-sync'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth()
  const { id } = await params
  const supabase = getSupabaseAdmin()
  
  const formData = await req.formData()
  const action = formData.get('action') as string
  
  // Get delivery with order info
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .select('*, orders(*)')
    .eq('orderId', id)
    .single()
  
  if (deliveryError || !delivery) {
    console.error('[DELIVERY_GET_ERROR]', deliveryError)
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }
  
  // Handle assignment
  if (action === 'assign') {
    const userId = formData.get('userId') as string
    const driverEmail = formData.get('driverEmail') as string
    
    const assignToId = userId || driverEmail
    
    if (!assignToId) {
      return NextResponse.json({ error: 'User ID or driver email required' }, { status: 400 })
    }
    
    // Find user by email if needed
    let assignedUserId = assignToId
    if (driverEmail && !userId) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', driverEmail)
        .single()
      
      if (user) {
        assignedUserId = user.id
      }
    }
    
    // Update delivery assignment
    const { data: updated, error: updateError } = await supabase
      .from('deliveries')
      .update({
        assignedToId: assignedUserId,
        assignedAt: new Date().toISOString(),
      })
      .eq('id', delivery.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('[DELIVERY_ASSIGN_ERROR]', updateError)
      return NextResponse.json({ error: 'Failed to assign delivery' }, { status: 500 })
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      orderId: id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'delivery_assigned',
      entityType: 'delivery',
      fieldName: 'assignedToId',
      newValue: assignedUserId,
      notes: `Delivery assigned to user ${assignedUserId}`,
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
    
    // Upload signature if provided (don't fail if upload fails)
    if (signatureDataUrl) {
      try {
        const signatureResult = await uploadSignature(signatureDataUrl, id)
        signatureUrl = signatureResult?.url || null
      } catch (uploadError) {
        console.error('[SIGNATURE_UPLOAD_ERROR]', uploadError)
        // Continue without signature - don't fail the delivery
      }
    }
    
    // Upload photo if provided (don't fail if upload fails)
    const photoBase64 = formData.get('photoBase64') as string | null
    if (photoBase64) {
      try {
        const buffer = Buffer.from(photoBase64, 'base64')
        const photoResult = await uploadDeliveryPhoto(buffer, id)
        photoUrl = photoResult?.url || null
      } catch (uploadError) {
        console.error('[PHOTO_UPLOAD_ERROR]', uploadError)
        // Continue without photo - don't fail the delivery
      }
    } else if (photo && photo.size > 0) {
      try {
        const bytes = await photo.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const photoResult = await uploadDeliveryPhoto(buffer, id)
        photoUrl = photoResult?.url || null
      } catch (uploadError) {
        console.error('[PHOTO_UPLOAD_ERROR]', uploadError)
        // Continue without photo - don't fail the delivery
      }
    }
    
    const oldStatus = delivery.orders.status
    
    // Update delivery
    const { data: updatedDelivery, error: deliveryError } = await supabase
      .from('deliveries')
      .update({
        signatureUrl,
        photoUrl,
        deliveredAt: new Date().toISOString(),
        latitude,
        longitude,
        deliveryNotesInternal: notes,
      })
      .eq('id', delivery.id)
      .select()
      .single()
    
    if (deliveryError) {
      console.error('[DELIVERY_UPDATE_ERROR]', deliveryError)
      return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 })
    }
    
    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'DELIVERED' })
      .eq('id', id)
    
    // Sync to Shopify
    let shopifySynced = false
    if (delivery.orders.shopifyId) {
      try {
        const statusUpdated = await updateShopifyOrderStatus(delivery.orders.shopifyId, 'DELIVERED')
        const fulfillmentCreated = await createFulfillment(
          delivery.orders.shopifyId,
          { 
            company: 'Local Delivery',
            number: `LOCAL-${Date.now()}`
          }
        )
        shopifySynced = statusUpdated && fulfillmentCreated
      } catch (error) {
        console.error('[SHOPIFY_SYNC_ERROR]', error)
      }
    }
    
    // Update Shopify sync status
    await supabase
      .from('orders')
      .update({
        shopifySyncStatus: shopifySynced ? 'SYNCED' : 'FAILED',
        shopifyUpdatedAt: shopifySynced ? new Date().toISOString() : null,
      })
      .eq('id', id)
    
    // Log activity
    await supabase.from('activity_logs').insert({
      orderId: id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: 'delivery_completed',
      entityType: 'delivery',
      fieldName: 'status',
      oldValue: oldStatus,
      newValue: 'DELIVERED',
      notes: `Delivery completed. Signature: ${signatureUrl ? 'Yes' : 'No'}, Photo: ${photoUrl ? 'Yes' : 'No'}`,
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
