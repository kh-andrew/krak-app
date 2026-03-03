import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import QuickReceiveStock from './components/QuickReceiveStock'

export default async function InventoryPage() {
  await requireAuth()
  
  let inventory: any[] = []
  let error = null

  try {
    const response = await fetch('https://krak-app.vercel.app/api/inventory', {
      cache: 'no-store'
    })
    if (!response.ok) throw new Error('Failed to fetch')
    inventory = await response.json()
  } catch (e) {
    error = 'Failed to load inventory'
    console.error('Inventory load error:', e)
  }

  const lowStockCount = inventory.filter((i: any) => 
    i.reorderPoint && i.available <= i.reorderPoint
  ).length
  
  const totalUnits = inventory.reduce((sum: number, i: any) => sum + (i.currentStock || 0), 0)
  const totalAvailable = inventory.reduce((sum: number, i: any) => sum + (i.available || 0), 0)
  
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
          <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A] text-center">
            <p className="text-xs text-gray-400">Total Units</p>
            <p className="text-2xl font-bold text-white">{totalUnits.toLocaleString()}</p>
          </div>
          <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A] text-center">
            <p className="text-xs text-gray-400">Available</p>
            <p className="text-2xl font-bold text-[#22C55E]">{totalAvailable.toLocaleString()}</p>
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
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
