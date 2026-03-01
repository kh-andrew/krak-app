import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadSignature(dataUrl: string, orderId: string): Promise<string | null> {
  try {
    // Remove data URL prefix
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Data}`,
      {
        folder: 'signatures',
        public_id: `signature-${orderId}-${Date.now()}`,
        resource_type: 'image',
      }
    )
    
    return result.secure_url
  } catch (error) {
    console.error('Error uploading signature:', error)
    return null
  }
}

export async function uploadDeliveryPhoto(
  fileBuffer: Buffer,
  orderId: string
): Promise<string | null> {
  try {
    // Convert buffer to base64
    const base64Data = fileBuffer.toString('base64')
    
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        folder: 'delivery-photos',
        public_id: `delivery-${orderId}-${Date.now()}`,
        resource_type: 'image',
      }
    )
    
    return result.secure_url
  } catch (error) {
    console.error('Error uploading delivery photo:', error)
    return null
  }
}

export { cloudinary }
