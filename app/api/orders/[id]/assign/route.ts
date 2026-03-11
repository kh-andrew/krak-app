import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const orderId = params.id
    
    const formData = await req.formData()
    const driverId = formData.get('driverId') as string
    const driverEmail = formData.get('driverEmail') as string
    
    if (!driverId && !driverEmail) {
      return NextResponse.json({ error: 'Driver required' }, { status: 400 })
    }

    // Find delivery record
    const delivery = await prisma.deliveries.findFirst({
      where: { orderId },
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    // Determine user ID to assign
    let assignedUserId = driverId
    
    // If driverEmail provided, lookup user
    if (driverEmail && !driverId) {
      const user = await prisma.users.findUnique({
        where: { email: driverEmail }
      })
      if (user) {
        assignedUserId = user.id
      }
    }

    // Update delivery assignment
    const updated = await prisma.deliveries.update({
      where: { id: delivery.id },
      data: {
        userId: assignedUserId,
        assignedToId: assignedUserId,
        assignedAt: new Date(),
        status: 'ASSIGNED',
      },
    })

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        orderId: orderId,
        actorId: session.user?.id || assignedUserId,
        action: 'delivery_assigned',
        entityType: 'delivery',
        fieldName: 'assignedToId',
        newValue: assignedUserId,
        notes: `Delivery assigned to ${driverEmail || driverId}`,
      },
    })

    return NextResponse.json(updated)
    
  } catch (error) {
    console.error('Assign driver error:', error)
    return NextResponse.json({ error: 'Failed to assign driver' }, { status: 500 })
  }
}
