import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import { InventoryForm } from './components/InventoryForm'
import { CSVUpload } from './components/CSVUpload'

export default async function InventoryPage() {
  await requireAuth()
  
  const inventory = await prisma.inventory.findMany({
    orderBy: [
      { available: 'asc' },
      { sku: 'asc' }
    ],
    take: 100,
  })
  
  const lowStockCount = inventory.filter(i => 
    i.reorderPoint && i.available <= i.reorderPoint
  ).length
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-gray-400">Track stock levels and reorder points</p>
        </div>
        <div className="flex gap-3">
          {lowStockCount > 0 && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-2 rounded-lg">
              <span className="font-semibold">{lowStockCount}</span> items below reorder point
            </div>
          )}
          <Link
            href="/dashboard"
            className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Orders
          </Link>
        </div>
      </div>
      
      {/* Add New Item Form */}
      <div className="bg-[#141414] p-6 rounded-xl border border-[#2A2A2A]">
        <h2 className="text-lg font-semibold text-white mb-4">Add New Item</h2>
        <InventoryForm />
      </div>

      {/* CSV Upload */}
      <CSVUpload />
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Total SKUs</p>
          <p className="text-2xl font-bold text-white">{inventory.length}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Low Stock</p>
          <p className="text-2xl font-bold text-[#EF4444]">{lowStockCount}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Total Units</p>
          <p className="text-2xl font-bold text-white">
            {inventory.reduce((sum, i) => sum + i.currentStock, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Available</p>
          <p className="text-2xl font-bold text-[#22C55E]">
            {inventory.reduce((sum, i) => sum + i.available, 0).toLocaleString()}
          </p>
        </div>
      </div>
            </div>
          )}
         
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Total SKUs</p>
          <p className="text-2xl font-bold text-white">{inventory.length}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Low Stock</p>
          <p className="text-2xl font-bold text-[#EF4444]">{lowStockCount}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Total Units</p>
          <p className="text-2xl font-bold text-white">
            {inventory.reduce((sum, i) => sum + i.currentStock, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Available</p>
          <p className="text-2xl font-bold text-[#22C55E]">
            {inventory.reduce((sum, i) => sum + i.available, 0).toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Inventory Table */}
      <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <table className="min-w-full divide-y divide-[#2A2A2A]">
          <thead className="bg-[#1A1A1A]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Current Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Reserved
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Reorder Point
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Suggested Qty
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-[#2A2A2A]">
            {inventory.map((item) => {
              const isLowStock = item.reorderPoint && item.available <= item.reorderPoint
              
              return (
                <tr key={item.id} className={`hover:bg-[#1A1A1A] transition-colors ${isLowStock ? 'bg-red-900/10' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-white">{item.sku}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{item.name}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-white">{item.currentStock.toLocaleString()}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-400">{item.reserved.toLocaleString()}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-semibold ${item.available <= 0 ? 'text-red-400' : 'text-white'}`}>
                      {item.available.toLocaleString()}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-400">
                      {item.reorderPoint?.toLocaleString() || '—'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-[#FF6B4A] font-semibold">
                      {item.reorderQty?.toLocaleString() || '—'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {isLowStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900 text-red-200">
                        Reorder
                      </span>
                    ) : item.available > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-200">
                        OK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                        Out
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {inventory.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No inventory items found
          </div>
        )}
      </div>
    </div>
  )
}
