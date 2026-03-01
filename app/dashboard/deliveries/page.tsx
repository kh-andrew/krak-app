import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

export default async function DeliveriesPage() {
  await requireAuth()
  
  const deliveries = await prisma.delivery.findMany({
    include: {
      order: {
        include: {
          customer: {
            select: { firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
      assignedTo: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  
  const stats = {
    total: deliveries.length,
    pending: deliveries.filter(d => !d.assignedToId && !d.deliveredAt).length,
    assigned: deliveries.filter(d => d.assignedToId && !d.deliveredAt).length,
    delivered: deliveries.filter(d => d.deliveredAt).length,
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Deliveries</h1>
        <p className="text-gray-400">Track and manage all deliveries</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Pending Assignment</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Out for Delivery</p>
          <p className="text-2xl font-bold text-purple-500">{stats.assigned}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Delivered</p>
          <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
        </div>
      </div>
      
      {/* Deliveries Table */}
      <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <table className="min-w-full divide-y divide-[#2A2A2A]">
          <thead className="bg-[#1A1A1A]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned To</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-[#2A2A2A]">
            {deliveries.map((delivery) => {
              const status = delivery.deliveredAt 
                ? 'Delivered' 
                : delivery.assignedToId 
                  ? 'Out for Delivery' 
                  : 'Pending'
              
              const statusColor = {
                'Delivered': 'text-green-400',
                'Out for Delivery': 'text-purple-400',
                'Pending': 'text-yellow-400',
              }[status]
              
              return (
                <tr key={delivery.id} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      #{delivery.order.shopifyOrderNumber || delivery.order.id.slice(0, 8)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {delivery.order.customer?.firstName} {delivery.order.customer?.lastName}
                    </div>
                    <div className="text-sm text-gray-400">{delivery.order.customer?.email}</div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300 max-w-xs truncate">
                      {delivery.deliveryAddress}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${statusColor}`}>
                      {status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {delivery.assignedTo?.name || '—'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/dashboard/orders/${delivery.order.id}`}
                      className="text-[#FF6B4A] hover:text-[#FF8566] text-sm font-medium"
                    >
                      View Order
                    </Link>
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
// Trigger rebuild Sun Mar  1 09:08:46 PM CST 2026
