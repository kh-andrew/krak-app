import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/orders/pending-delivery
// Get orders ready for delivery (out for delivery or not yet assigned)
export async function GET() {
  await requireAuth()
  
  try {
    const orders = await prisma.orders.findMany({
      where: {
        status: {
          in: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY']
        },
        deliveries: {
          isNot: null
        }
      },
      include: {
        customers: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        deliveries: {
          select: {
            deliveryAddress: true,
            users: {
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
      customerName: order.customers 
        ? `${order.customers.firstName || ''} ${order.customers.lastName || ''}`.trim() || order.customers.email
        : 'Unknown',
      deliveryAddress: order.deliveries?.deliveryAddress || 'No address',
      status: order.status,
      assignedTo: order.deliveries?.users?.email || null
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
