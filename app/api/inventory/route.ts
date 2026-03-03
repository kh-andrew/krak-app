import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/inventory
// Load inventory with product details
export async function GET() {
  await requireAuth()
  
  try {
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
      FROM "Inventory" i
      JOIN "Product" p ON i."productId" = p.id
      ORDER BY i.available ASC
      LIMIT 100
    `
     
    return NextResponse.json(inventory || [])
    
  } catch (error) {
    console.error('Inventory load error:', error)
    return NextResponse.json([])
  }
}
