import { NextResponse } from 'next/server'

// GET /api/inventory
// Minimal test version
export async function GET() {
  // Return hardcoded test data
  return NextResponse.json([
    {
      id: 'test-1',
      sku: 'KFSS',
      name: 'Krak Focus Shot - Single',
      currentStock: 100,
      reserved: 0,
      available: 100,
      reorderPoint: 500,
      reorderQty: 1000,
      basePrice: 8.00,
      isBundle: false
    },
    {
      id: 'test-2',
      sku: 'KFSP',
      name: 'Krak Focus Shot - Pack',
      currentStock: 50,
      reserved: 0,
      available: 50,
      reorderPoint: 50,
      reorderQty: 100,
      basePrice: 84.00,
      isBundle: true
    }
  ])
}
