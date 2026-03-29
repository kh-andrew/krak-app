import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

/**
 * Cron job: Cleanup old delivery photos
 * Runs daily at 2 AM
 * Deletes photos older than 90 days, keeps signatures
 */

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  try {
    // Find deliveries with photos older than 90 days
    const { data: oldDeliveries, error: fetchError } = await supabase
      .from('deliveries')
      .select('id, photoUrl, deliveredAt')
      .not('photoUrl', 'is', null)
      .lt('deliveredAt', cutoffDate.toISOString())

    if (fetchError) {
      throw new Error(`Failed to fetch old deliveries: ${fetchError.message}`)
    }

    let deletedCount = 0

    for (const delivery of oldDeliveries || []) {
      try {
        // Delete from Supabase Storage if it's a Supabase URL
        if (delivery.photoUrl?.includes('supabase')) {
          const path = delivery.photoUrl.split('/deliveries/').pop()
          if (path) {
            await supabase.storage.from('deliveries').remove([path])
          }
        }

        // Clear photo URL from database
        const { error: updateError } = await supabase
          .from('deliveries')
          .update({
            photoUrl: null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        if (updateError) {
          console.error(`Failed to update delivery ${delivery.id}:`, updateError)
          continue
        }

        deletedCount++
      } catch (error) {
        console.error(`Error processing delivery ${delivery.id}:`, error)
        continue
      }
    }

    // Log cleanup activity
    await supabase.from('activity_logs').insert({
      orderId: null,
      action: 'cleanup_photos',
      entityType: 'system',
      notes: `Deleted ${deletedCount} photos older than 90 days`,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} photos older than 90 days`,
    })
  } catch (error: any) {
    console.error('[CRON_CLEANUP_ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Cleanup failed' },
      { status: 500 }
    )
  }
}
