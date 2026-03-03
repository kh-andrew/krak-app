import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/inventory
// Returns inventory with product details
export async function GET() {
  await requireAuth()
  
  try {
    // Use raw SQL to join Inventory with Product
    const inventory = await prisma.$queryRaw`
      SELECT 
        i.id,
        i."currentStock",
        i.reserved,
        i.available,
        i."reorderPoint",
        i."reorderQty",
        p.sku,
        p.name,
        p."basePrice",
        p."isBundle"
      FROM "inventory" i
      JOIN "product" p ON i."productId" = p.id
      ORDER BY i.available ASC
      LIMIT 100
    `
    
    return NextResponse.json(inventory)
    
  } catch (error) {
    console.error('inventory fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to load inventory' },
      { status: 500 }
    )
  }
}
