import { v2 as cloudinary, UploadApiOptions } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Compression and optimization settings for scalability
const UPLOAD_OPTIONS = {
  signature: {
    folder: 'signatures',
    resource_type: 'image' as const,
    // Compress signatures: max width 800px, quality 80%, auto format
    transformation: [
      { width: 800, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
    // Auto-tag for organization
    tags: ['signature', 'delivery'],
  } satisfies UploadApiOptions,
  photo: {
    folder: 'delivery-photos',
    resource_type: 'image' as const,
    // Compress photos: max width 1200px, quality 80%, auto format
    transformation: [
      { width: 1200, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' },
    ],
    tags: ['delivery-photo', 'proof'],
  } satisfies UploadApiOptions,
}

/**
 * Upload signature with compression
 * Typical reduction: 70-80% file size
 */
export async function uploadSignature(
  dataUrl: string,
  orderId: string
): Promise<{ url: string; publicId: string } | null> {
  try {
    // Remove data URL prefix
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')

    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Data}`,
      {
        ...UPLOAD_OPTIONS.signature,
        public_id: `sig-${orderId.slice(0, 8)}-${Date.now()}`,
      } as UploadApiOptions
    )

    return {
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error('Error uploading signature:', error)
    return null
  }
}

/**
 * Upload delivery photo with compression
 * Typical reduction: 60-75% file size
 */
export async function uploadDeliveryPhoto(
  fileBuffer: Buffer,
  orderId: string
): Promise<{ url: string; publicId: string } | null> {
  try {
    const base64Data = fileBuffer.toString('base64')

    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        ...UPLOAD_OPTIONS.photo,
        public_id: `photo-${orderId.slice(0, 8)}-${Date.now()}`,
      } as UploadApiOptions
    )

    return {
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error('Error uploading delivery photo:', error)
    return null
  }
}

/**
 * Delete image from Cloudinary (for cleanup/updates)
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId)
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedUrl(
  url: string,
  options: { width?: number; height?: number; quality?: number } = {}
): string {
  const { width = 800, quality = 80 } = options

  // Add transformation parameters to URL
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}w_${width},q_${quality},f_auto`
}

export { cloudinary }
