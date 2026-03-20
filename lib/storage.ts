import { getSupabaseAdmin } from './supabase'
import { uploadSignature as uploadSignatureCloudinary, uploadDeliveryPhoto as uploadDeliveryPhotoCloudinary } from './cloudinary'

// Upload paths for organization
const PATHS = {
  signature: (orderId: string) => `signatures/sig-${orderId.slice(0, 8)}-${Date.now()}.png`,
  photo: (orderId: string) => `delivery-photos/photo-${orderId.slice(0, 8)}-${Date.now()}.jpg`,
}

/**
 * Upload signature with fallback to Cloudinary
 * Tries Supabase first, falls back to Cloudinary if bucket doesn't exist
 */
export async function uploadSignature(
  dataUrl: string,
  orderId: string
): Promise<{ url: string; path?: string; source: 'supabase' | 'cloudinary' } | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    // Remove data URL prefix and convert to buffer
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    const path = PATHS.signature(orderId)
    
    const { error: uploadError } = await supabase
      .storage
      .from('deliveries')
      .upload(path, buffer, {
        contentType: 'image/png',
        upsert: false,
      })
    
    if (uploadError) {
      // Bucket doesn't exist or other error — fall back to Cloudinary
      console.warn('[SUPABASE_STORAGE_FALLBACK] Bucket may not exist, using Cloudinary:', uploadError.message)
      try {
        const cloudinaryResult = await uploadSignatureCloudinary(dataUrl, orderId)
        if (cloudinaryResult) {
          return { url: cloudinaryResult.url, source: 'cloudinary' }
        }
      } catch (cloudinaryError: any) {
        throw new Error(`Supabase: ${uploadError.message}, Cloudinary: ${cloudinaryError.message}`)
      }
      throw new Error(`Supabase: ${uploadError.message}, Cloudinary: No result`)
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('deliveries')
      .getPublicUrl(path)
    
    return {
      url: publicUrl,
      path,
      source: 'supabase',
    }
  } catch (error: any) {
    console.error('Error uploading signature:', error)
    throw error
  }
}

/**
 * Upload delivery photo with fallback to Cloudinary
 * Tries Supabase first, falls back to Cloudinary if bucket doesn't exist
 */
export async function uploadDeliveryPhoto(
  fileBuffer: Buffer,
  orderId: string
): Promise<{ url: string; path?: string; source: 'supabase' | 'cloudinary' } | null> {
  try {
    const supabase = getSupabaseAdmin()
    
    const path = PATHS.photo(orderId)
    
    const { error: uploadError } = await supabase
      .storage
      .from('deliveries')
      .upload(path, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })
    
    if (uploadError) {
      // Bucket doesn't exist or other error — fall back to Cloudinary
      console.warn('[SUPABASE_STORAGE_FALLBACK] Bucket may not exist, using Cloudinary:', uploadError.message)
      try {
        const cloudinaryResult = await uploadDeliveryPhotoCloudinary(fileBuffer, orderId)
        if (cloudinaryResult) {
          return { url: cloudinaryResult.url, source: 'cloudinary' }
        }
      } catch (cloudinaryError: any) {
        throw new Error(`Supabase: ${uploadError.message}, Cloudinary: ${cloudinaryError.message}`)
      }
      throw new Error(`Supabase: ${uploadError.message}, Cloudinary: No result`)
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('deliveries')
      .getPublicUrl(path)
    
    return {
      url: publicUrl,
      path,
      source: 'supabase',
    }
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin()
    
    const { error } = await supabase
      .storage
      .from('deliveries')
      .remove([path])
    
    if (error) {
      console.error('[SUPABASE_DELETE_ERROR]', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting file from Supabase:', error)
    return false
  }
}


