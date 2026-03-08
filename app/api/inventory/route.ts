import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inventory
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      take: 100,
      orderBy: { available: 'asc' },
      include: {
        Product: {
          select: {
            id: true,
            sku: true,
            name: true,
            basePrice: true,
            isBundle: true
          }
        },
        Location: {
          select: {
            id: true,
            code: true,
            name: true
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
      sku: item.Product?.sku || 'UNKNOWN',
      name: item.Product?.name || 'Unknown',
      basePrice: item.Product?.basePrice || 0,
      isBundle: item.Product?.isBundle || false,
      location: item.Location?.name || item.Location?.code
    }))
    
    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('[API_INVENTORY_GET]', error.message)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
