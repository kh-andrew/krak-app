import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inventory
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      take: 100,
      orderBy: { available: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            basePrice: true,
            isBundle: true
          }
        }
      }
    })
    
    // Transform to match expected format
    const formatted = inventory.map(item => ({
      id: item.id,
      currentStock: item.currentStock || 0,
      reserved: item.reserved || 0,
      available: item.available || 0,
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      sku: item.product?.sku || 'UNKNOWN',
      name: item.product?.name || 'Unknown',
      basePrice: item.product?.basePrice || 0,
      isBundle: item.product?.isBundle || false
    }))
    
    return NextResponse.json(formatted)
  } catch (error) {
    console.error('GET /api/inventory error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
