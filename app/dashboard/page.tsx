import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import { ORDER_STATUS_FLOW, OrderStatusKey } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  await requireAuth()
  
  const orders = await prisma.order.findMany({
    include: {
      customer: {
        select: { firstName: true, lastName: true, email: true },
      },
      delivery: {
        include: {
          assignedTo: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  
  const stats = {
    total: orders.length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-gray-400">Manage and track your Shopify orders</p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Received</p>
          <p className="text-2xl font-bold text-[#3B82F6]">{stats.received}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Preparing</p>
          <p className="text-2xl font-bold text-[#EAB308]">{stats.preparing}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Out for Delivery</p>
          <p className="text-2xl font-bold text-[#A855F7]">{stats.outForDelivery}</p>
        </div>
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Delivered</p>
          <p className="text-2xl font-bold text-[#22C55E]">{stats.delivered}</p>
        </div>
      </div>
      
      {/* Orders Table */}
      <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] overflow-hidden">
        <table className="min-w-full divide-y divide-[#2A2A2A]">
          <thead className="bg-[#1A1A1A]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-[#2A2A2A]">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_FLOW[order.status as OrderStatusKey]
              
              return (
                <tr key={order.id} className="hover:bg-[#1A1A1A] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      #{order.shopifyOrderNumber || order.id.slice(0, 8)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {order.customer?.email}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {formatCurrency(Number(order.totalAmount), order.currency)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig?.color || 'bg-gray-800 text-gray-300'}`}>
                      {statusConfig?.label || order.status}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {order.delivery?.assignedTo?.name || '—'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-400">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-[#FF6B4A] hover:text-[#FF8566] text-sm font-medium transition-colors"
                    >
                      View
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
