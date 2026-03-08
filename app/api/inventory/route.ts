import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inventory
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      take: 100,
      orderBy: { available: 'asc' },
      include: {
        products: {
          select: {
            id: true,
            sku: true,
            name: true,
            basePrice: true
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
      sku: item.products?.sku || 'UNKNOWN',
      name: item.products?.name || 'Unknown',
      basePrice: item.products?.basePrice || 0
    }))
    
    return NextResponse.json(formatted)
  } catch (error) {
    console.error('GET /api/inventory error:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
