import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/inventory
// Returns inventory with product details (handles empty tables)
export async function GET() {
  await requireAuth()
  
  try {
    // Check if tables exist first
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inventory'
      ) as exists
    `
    
    if (!(tableExists as any[])[0]?.exists) {
      return NextResponse.json([])
    }
    
    // Try to get inventory with product details
    // Use LEFT JOIN to handle cases where product might not exist
    const inventory = await prisma.$queryRaw`
      SELECT 
        i.id,
        i."currentStock",
        i.reserved,
        i.available,
        i."reorderPoint",
        i."reorderQty",
        COALESCE(p.sku, 'UNKNOWN') as sku,
        COALESCE(p.name, 'Unknown Product') as name,
        COALESCE(p."basePrice", 0) as "basePrice",
        COALESCE(p."isBundle", false) as "isBundle"
      FROM inventory i
      LEFT JOIN product p ON i."productId" = p.id
      ORDER BY i.available ASC
      LIMIT 100
    `
    
    return NextResponse.json(inventory || [])
    
  } catch (error) {
    console.error('inventory fetch error:', error)
    // Return empty array instead of error
    return NextResponse.json([])
  }
}
