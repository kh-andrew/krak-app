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
    
    // Upload signature if provided
    if (signatureDataUrl) {
      try {
        const signatureResult = await uploadSignature(signatureDataUrl, id)
        signatureUrl = signatureResult?.url || null
        if (!signatureUrl) {
          return NextResponse.json(
            { error: 'Signature upload failed - no URL returned' },
            { status: 500 }
          )
        }
      } catch (uploadError: any) {
        console.error('[SIGNATURE_UPLOAD_ERROR]', uploadError)
        return NextResponse.json(
          { error: `Signature upload failed: ${uploadError.message || 'Unknown error'}` },
          { status: 500 }
        )
      }
    }
    
    // Upload photo if provided (optional - signature is sufficient)
    const photoBase64 = formData.get('photoBase64') as string | null
    
    // Try photoBase64 first (from mobile camera)
    if (photoBase64 && photoBase64.length > 0) {
      try {
        // Remove data URL prefix if present
        const cleanBase64 = photoBase64.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(cleanBase64, 'base64')
        
        // Validate buffer is not empty
        if (buffer.length === 0) {
          console.warn('[PHOTO_UPLOAD] Empty buffer from base64, skipping photo')
        } else {
          const photoResult = await uploadDeliveryPhoto(buffer, id)
          photoUrl = photoResult?.url || null
          if (!photoUrl) {
            console.warn('[PHOTO_UPLOAD] No URL returned, continuing without photo')
          }
        }
      } catch (uploadError: any) {
        // Log error but don't fail - photo is optional
        console.error('[PHOTO_UPLOAD_ERROR]', uploadError.message)
        console.log('[PHOTO_UPLOAD] Continuing without photo upload')
      }
    } 
    // Try File object as fallback
    else if (photo && photo.size > 0) {
      try {
        // Check file size (max 10MB)
        if (photo.size > 10 * 1024 * 1024) {
          console.warn('[PHOTO_UPLOAD] File too large, skipping')
        } else {
          const bytes = await photo.arrayBuffer()
          const buffer = Buffer.from(bytes)
          const photoResult = await uploadDeliveryPhoto(buffer, id)
          photoUrl = photoResult?.url || null
          if (!photoUrl) {
            console.warn('[PHOTO_UPLOAD] No URL returned, continuing without photo')
          }
        }
      } catch (uploadError: any) {
        console.error('[PHOTO_UPLOAD_ERROR]', uploadError.message)
        console.log('[PHOTO_UPLOAD] Continuing without photo upload')
      }
    }
    
    // Validate: require either signature or photo
    if (!signatureUrl && !photoUrl) {
      return NextResponse.json(
        { error: 'Signature or photo is required to complete delivery. Upload may have failed.' },
        { status: 400 }
      )
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
