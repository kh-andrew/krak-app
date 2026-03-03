import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/orders/pending-delivery
// Get orders ready for delivery (out for delivery or not yet assigned)
export async function GET() {
  await requireAuth()
  
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']
        },
        delivery: {
          isNot: null
        }
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        delivery: {
          select: {
            deliveryAddress: true,
            assignedTo: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })
    
    // Format for Telegram
    const formatted = orders.map(order => ({
      id: order.id,
      shopifyOrderNumber: order.shopifyOrderNumber || order.id.slice(0, 8),
      customerName: order.customer 
        ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim() || order.customer.email
        : 'Unknown',
      deliveryAddress: order.delivery?.deliveryAddress || 'No address',
      status: order.status,
      assignedTo: order.delivery?.assignedTo?.email || null
    }))
    
    return NextResponse.json(formatted)
    
  } catch (error) {
    console.error('Pending deliveries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending deliveries' },
      { status: 500 }
    )
  }
}
