import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function POST(request: Request) {
  await requireAuth()
  
  const { items } = await request.json()
  
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 })
  }
  
  const results = []
  
  for (const item of items) {
    const { sku, name, currentStock, reorderPoint, reorderQty } = item
    
    if (!sku || !name) continue
    
    const inventory = await prisma.inventory.upsert({
      where: { sku },
      update: {
        name,
        currentStock: currentStock || 0,
        available: currentStock || 0,
        reorderPoint: reorderPoint || 0,
        reorderQty: reorderQty || 0,
      },
      create: {
        sku,
        name,
        currentStock: currentStock || 0,
        reserved: 0,
        available: currentStock || 0,
        reorderPoint: reorderPoint || 0,
        reorderQty: reorderQty || 0,
      },
    })
    
    results.push(inventory)
  }
  
  return NextResponse.json({ 
    success: true, 
    count: results.length,
    items: results 
  })
}