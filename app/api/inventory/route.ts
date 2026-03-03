import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/inventory
// Public endpoint - no auth required for now
export async function GET() {
  try {
    // Query inventory with product details
    const inventory = await prisma.$queryRaw`
      SELECT 
        i.id,
        COALESCE(i."currentStock", 0) as "currentStock",
        COALESCE(i.reserved, 0) as reserved,
        COALESCE(i.available, 0) as available,
        i."reorderPoint",
        i."reorderQty",
        COALESCE(p.sku, 'UNKNOWN') as sku,
        COALESCE(p.name, 'Unknown') as name,
        COALESCE(p."basePrice", 0) as "basePrice",
        COALESCE(p."isBundle", false) as "isBundle"
      FROM "Inventory" i
      LEFT JOIN "Product" p ON i."productId" = p.id
      ORDER BY COALESCE(i.available, 0) ASC
      LIMIT 100
    `
    
    return NextResponse.json(inventory || [])
    
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json([])
  }
}
