import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import QuickReceiveStock from './components/QuickReceiveStock'

export default async function InventoryPage() {
  await requireAuth()
  
  let inventory: any[] = []
  let error = null

  try {
    // Fetch calculated inventory from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://krak-app.vercel.app'}/api/inventory`, {
      headers: {
        'Cookie': '', // Server-side fetch needs auth cookie
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    inventory = await response.json()
  } catch (e: any) {
    console.error('Inventory fetch error:', e)
    error = e.message
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Available = Physical Stock - Committed to non-delivered orders
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/dashboard/inventory/adjust"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Adjust Stock
          </Link>
          <Link
            href="/dashboard/inventory/receive"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Receive Stock
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error loading inventory: {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-900">
            {inventory.reduce((sum, item) => sum + (item.physicalBottles || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-blue-700">Physical Bottles</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-900">
            {inventory.reduce((sum, item) => sum + (item.committedBottles || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-yellow-700">Committed to Orders</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-900">
            {inventory.reduce((sum, item) => sum + (item.availableBottles || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-green-700">Available for Sale</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-900">
            {inventory.filter(item => item.needsReorder).length}
          </div>
          <div className="text-sm text-red-700">SKUs Need Reorder</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Physical</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Committed</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Available</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bottles</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map((item) => (
              <tr key={item.id} className={item.needsReorder ? 'bg-red-50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.physicalStock}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-yellow-600">{item.committedStock}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">{item.availableStock}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                  {item.availableBottles?.toLocaleString()}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {item.needsReorder ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">REORDER</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <QuickReceiveStock />
      </div>
    </div>
  )
}
