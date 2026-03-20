import { requireAuth } from '@/lib/auth-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import QuickReceiveStock from './components/QuickReceiveStock'

export default async function InventoryPage() {
  await requireAuth()
  const supabase = getSupabaseAdmin()
  
  let inventory: any[] = []
  let error = null

  try {
    // Supabase query with advanced inventory system
    const { data: rawInventory, error: queryError } = await supabase
      .from('Inventory')
      .select(`
        *,
        Product(id, sku, name, basePrice, isBundle),
        Location(id, code, name)
      `)
      .order('lastMovementAt', { ascending: false })
      .limit(100)
    
    if (queryError) throw queryError
    
    // Transform to match expected format
    inventory = (rawInventory || []).map((item: any) => ({
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
    console.error('Inventory fetch error:', e)
    error = e.message
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Point</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {inventory.map((item) => (
              <tr key={item.id} className={item.available <= (item.reorderPoint || 0) ? 'bg-red-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.location}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.currentStock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.available}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{item.reserved}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{item.reorderPoint || '-'}</td>
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
