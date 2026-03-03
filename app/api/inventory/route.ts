import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/inventory
// Returns inventory with product details using Prisma relations
export async function GET() {
  await requireAuth()
  
  try {
    // Use Prisma's relation query to get inventory with product details
    const inventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            sku: true,
            name: true,
            basePrice: true,
            isBundle: true
          }
        }
      },
      orderBy: {
        available: 'asc'
      },
      take: 100
    })
    
    // Transform to match expected format
    const formatted = inventory.map(item => ({
      id: item.id,
      currentStock: item.currentStock,
      reserved: item.reserved,
      available: item.available,
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      sku: item.product?.sku || 'UNKNOWN',
      name: item.product?.name || 'Unknown Product',
      basePrice: item.product?.basePrice || 0,
      isBundle: item.product?.isBundle || false
    }))
    
    return NextResponse.json(formatted)
    
  } catch (error) {
    console.error('inventory fetch error:', error)
    // Return empty array on error
    return NextResponse.json([])
  }
}
