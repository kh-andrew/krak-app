import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import QuickReceiveStock from './components/QuickReceiveStock'

export default async function InventoryPage() {
  await requireAuth()
  
  let inventory: any[] = []
  let error = null

  try {
    // Direct Prisma query with advanced inventory system
    const rawInventory = await prisma.inventory.findMany({
      take: 100,
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
      },
      orderBy: { lastMovementAt: 'desc' }
    })
    
    // Transform to match expected format
    inventory = rawInventory.map((item: any) => ({
      id: item.id,
      sku: item.Product?.sku || 'Unknown',
      name: item.Product?.name || 'Unknown Product',
      currentStock: item.currentStock || 0,
      available: item.available || 0,
      reserved: item.reserved || 0,
      reorderPoint: item.reorderPoint,
      reorderQty: item.reorderQty,
      location: item.Location?.name || item.Location?.code || 'Unknown',
      isBundle: item.Product?.isBundle || false
    }))
  } catch (e: any) {
    error = 'Failed to load inventory'
    console.error('[INVENTORY_PAGE_ERROR]', e.message, e.stack)
  }

  const lowStockCount = inventory.filter((i: any) => 
    i.reorderPoint && i.available <= i.reorderPoint
  ).length
  
  // Get quantities by SKU type
  const kfss = inventory.find((i: any) => i.sku === 'KFSS')
  const kfsp = inventory.find((i: any) => i.sku === 'KFSP')
  const kfsb = inventory.find((i: any) => i.sku === 'KFSB')
  
  const bottles = kfss?.available || 0
  const packs = kfsp?.available || 0
  const boxes = kfsb?.available || 0
  
  const totalUnits = inventory.reduce((sum: number, i: any) => sum + (i.currentStock || 0), 0)
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-4 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory</h1>
            <p className="text-gray-400 text-sm">Track stock levels</p>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            <span className="font-semibold">{lowStockCount}</span> items below reorder point
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A] text-center">
            <p className="text-xs text-gray-400">Total SKUs</p>
            <p className="text-2xl font-bold text-white">{inventory.length}</p>
          </div>
          <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A] text-center">
            <p className="text-xs text-gray-400">Low Stock</p>
            <p className="text-2xl font-bold text-[#EF4444]">{lowStockCount}</p>
          </div>
          <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
            <p className="text-xs text-gray-400 text-center mb-2">Total Units</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bottles</span>
                <span className="font-semibold text-white">{bottles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Packs</span>
                <span className="font-semibold text-white">{packs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Boxes</span>
                <span className="font-semibold text-white">{boxes.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
            <p className="text-xs text-gray-400 text-center mb-2">Available</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Bottles</span>
                <span className="font-semibold text-white">{bottles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Packs</span>
                <span className="font-semibold text-white">{packs.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Boxes</span>
                <span className="font-semibold text-white">{boxes.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Receive Stock Form */}
        <QuickReceiveStock />
        
        {/* Inventory List */}
        <div className="space-y-3">
          {inventory.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-[#141414] rounded-xl border border-[#2A2A2A]">
              No inventory items found
            </div>
          ) : (
            inventory.map((item: any) => {
              const isLowStock = item.reorderPoint && item.available <= item.reorderPoint
              
              return (
                <div 
                  key={item.id} 
                  className={`bg-[#141414] rounded-xl border p-4 ${
                    isLowStock ? 'border-red-700/50 bg-red-900/10' : 'border-[#2A2A2A]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-mono text-gray-400">{item.sku}</p>
                      <p className="text-white font-medium">{item.name}</p>
                      {item.isBundle && (
                        <span className="text-xs text-blue-400">Bundle</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isLowStock 
                        ? 'bg-red-900 text-red-200' 
                        : item.available > 0 
                          ? 'bg-green-900 text-green-200'
                          : 'bg-gray-800 text-gray-300'
                    }`}>
                      {isLowStock ? 'Reorder' : item.available > 0 ? 'OK' : 'Out'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#2A2A2A]">
                    <div>
                      <p className="text-xs text-gray-500">Stock</p>
                      <p className="text-white">{item.currentStock?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className={`font-semibold ${item.available <= 0 ? 'text-red-400' : 'text-white'}`}>
                        {item.available?.toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reorder At</p>
                      <p className="text-[#FF6B4A]">{item.reorderPoint?.toLocaleString() || '—'}</p>
                    </div>
                  </div>
                  
                  {item.location && (
                    <div className="mt-2 text-xs text-gray-500">
                      Location: {item.location}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
