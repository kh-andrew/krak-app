import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET() {
  await requireAuth()
  
  const inventory = await prisma.inventory.findMany({
    orderBy: { productId: 'asc' }

  })
  
  return NextResponse.json(inventory)
}

export async function POST(request: Request) {
  await requireAuth()
  
  const body = await request.json()
  const { sku, name, currentStock, reorderPoint, reorderQty } = body
  
  const inventory = await prisma.inventory.create({
    data: {
      sku,
      name,
      currentStock: currentStock || 0,
      reserved: 0,
      available: currentStock || 0,
      reorderPoint,
      reorderQty
    }
  })
  
  return NextResponse.json(inventory)
}
