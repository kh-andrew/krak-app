import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

// GET /api/inventory
// Query database with proper error handling
export async function GET() {
  try {
    await requireAuth()
    
    // Check if tables exist first
    const tablesExist = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Inventory'
      ) as exists
    `
    
    if (!(tablesExist as any[])[0]?.exists) {
      console.log('Inventory table does not exist')
      return NextResponse.json([])
    }
    
    // Query inventory with product details
    // Use LEFT JOIN in case product doesn't exist
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
    
    console.log('Inventory query result:', inventory)
    return NextResponse.json(inventory || [])
    
  } catch (error) {
    console.error('Inventory GET error:', error)
    // Return empty array instead of crashing
    return NextResponse.json([])
  }
}
