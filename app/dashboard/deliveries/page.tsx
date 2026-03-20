import { getSupabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function DeliveriesPage() {
  await requireAuth()
  const supabase = getSupabaseAdmin()
  
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select(`
      *,
      orders(*, customers(firstName, lastName, email, phone)),
      users(name, email)
    `)
    .order('createdAt', { ascending: false })
  
  const deliveryList = deliveries || []
  
  const stats = {
    total: deliveryList.length,
    pending: deliveryList.filter((d: any) => !d.assignedToId && !d.deliveredAt).length,
    assigned: deliveryList.filter((d: any) => d.assignedToId && !d.deliveredAt).length,
    delivered: deliveryList.filter((d: any) => d.deliveredAt).length,
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deliveries</h1>
        <p className="text-gray-400">Track and manage all deliveries</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total</div>
        </div>
        <div className="bg-yellow-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </div>
        <div className="bg-blue-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{stats.assigned}</div>
          <div className="text-sm text-gray-400">Assigned</div>
        </div>
        <div className="bg-green-900/30 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{stats.delivered}</div>
          <div className="text-sm text-gray-400">Delivered</div>
        </div>
      </div>
      
      {/* Deliveries List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Order</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Address</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Driver</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {deliveryList.map((delivery: any) => {
              const order = delivery.orders
              const customer = order?.customers
              
              return (
                <tr key={delivery.id} className="hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/orders/${order?.id}`} className="text-blue-400 hover:underline">
                      {order?.shopifyOrderNumber || order?.id?.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    {delivery.deliveryAddress?.substring(0, 50)}...
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {delivery.users?.name || 'Unassigned'}
                  </td>
                  <td className="px-4 py-3">
                    {delivery.deliveredAt ? (
                      <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-sm">Delivered</span>
                    ) : delivery.assignedToId ? (
                      <span className="px-2 py-1 bg-blue-900/50 text-blue-400 rounded text-sm">Assigned</span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded text-sm">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {formatDate(delivery.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
