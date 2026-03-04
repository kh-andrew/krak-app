import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import { ORDER_STATUS_FLOW, OrderStatusKey } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderSearch } from './components/OrderSearch'
import { OrderFilters } from './components/OrderFilters'

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    search?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    country?: string
  }> 
}) {
  await requireAuth()
  
  const params = await searchParams
  const { search, status, dateFrom, dateTo, country } = params
  
  const where: any = {}
  
  if (status && status !== 'ALL') where.status = status
  
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }
  
  if (search) {
    where.OR = [
      { shopifyOrderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]}}
    ]
  }
  
  if (country && country !== 'ALL') where.customer = { country }
  
  const orders = await prisma.orders.findMany({
    where,
    include: {
      customers: { select: { firstName: true, lastName: true, email: true, phone: true, country: true } },
      deliveries: { include: { users: { select: { name: true } } } },
      _count: { select: { activity_logs: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  
  const today = new Date(); today.setHours(0,0,0,0)
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7)
  
  const [totalOrders, todayOrders, weekOrders, pendingOrders] = await Promise.all([
    prisma.orders.count(),
    prisma.orders.count({ where: { createdAt: { gte: today } } }),
    prisma.orders.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.orders.count({ where: { status: { in: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'] } } }),
  ])
  
  const stats = {
    total: orders.length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    failed: orders.filter(o => o.status === 'FAILED').length,
  }
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Orders</h1>
            <p className="text-gray-400 text-sm md:text-base">Track Shopify orders</p>
          </div>
          <Link
            href="/dashboard/inventory"
            className="bg-[#FF6B4A] hover:bg-[#FF8566] text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium"
          >
            Inventory
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats - Mobile: 3 columns, Tablet+: 6 columns */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          <div className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A] text-center md:text-left">
            <p className="text-xs text-gray-400">Today</p>
            <p className="text-xl md:text-2xl font-bold text-white">{todayOrders}</p>
          </div>
          
          <div className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A] text-center md:text-left">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-[#F59E0B]">{pendingOrders}</p>
          </div>
          
          <div className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A] text-center md:text-left">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl md:text-2xl font-bold text-white">{totalOrders}</p>
          </div>
          
          <div className="hidden md:block bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Received</p>
            <p className="text-2xl font-bold text-[#3B82F6]">{stats.received}</p>
          </div>
          
          <div className="hidden md:block bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Preparing</p>
            <p className="text-2xl font-bold text-[#EAB308]">{stats.preparing}</p>
          </div>
          
          <div className="hidden md:block bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
            <p className="text-sm text-gray-400">Delivered</p>
            <p className="text-2xl font-bold text-[#22C55E]">{stats.delivered}</p>
          </div>
        </div>

        {/* Mobile Status Scroll */}
        <div className="flex md:hidden gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex-shrink-0 bg-[#141414] px-4 py-2 rounded-lg border border-[#2A2A2A]">
            <span className="text-xs text-gray-400">Recv: </span>
            <span className="text-sm font-bold text-[#3B82F6]">{stats.received}</span>
          </div>
          <div className="flex-shrink-0 bg-[#141414] px-4 py-2 rounded-lg border border-[#2A2A2A]">
            <span className="text-xs text-gray-400">Prep: </span>
            <span className="text-sm font-bold text-[#EAB308]">{stats.preparing}</span>
          </div>
          <div className="flex-shrink-0 bg-[#141414] px-4 py-2 rounded-lg border border-[#2A2A2A]">
            <span className="text-xs text-gray-400">Out: </span>
            <span className="text-sm font-bold text-[#A855F7]">{stats.outForDelivery}</span>
          </div>
          <div className="flex-shrink-0 bg-[#141414] px-4 py-2 rounded-lg border border-[#2A2A2A]">
            <span className="text-xs text-gray-400">Done: </span>
            <span className="text-sm font-bold text-[#22C55E]">{stats.delivered}</span>
          </div>
          <div className="flex-shrink-0 bg-[#141414] px-4 py-2 rounded-lg border border-[#2A2A2A]">
            <span className="text-xs text-gray-400">Fail: </span>
            <span className="text-sm font-bold text-[#EF4444]">{stats.failed}</span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#141414] p-3 md:p-4 rounded-xl border border-[#2A2A2A]">
          <OrderSearch defaultValue={search} />
        </div>

        {/* Orders - Mobile: Cards, Tablet+: Table */}
        
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {orders.map((order) => {
            const statusConfig = ORDER_STATUS_FLOW[order.status as OrderStatusKey]
            
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="block bg-[#141414] rounded-xl border border-[#2A2A2A] p-4 hover:border-[#3A3A3A] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">
                        #{order.shopifyOrderNumber || order.id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig?.color || 'bg-gray-800 text-gray-300'}`}>
                        {statusConfig?.label || order.status}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm truncate">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{order.customer?.email}</p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatCurrency(Number(order.totalAmount), order.currency)}</span>
                      <span>•</span>
                      <span>{formatDate(order.createdAt)}</span>
                      {order._count.activityLogs > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-blue-400">{order._count.activityLogs} updates</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <svg className="w-5 h-5 text-gray-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Tablet/Desktop Table View */}
        <div className="hidden md:block bg-[#141414] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1A1A1A]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {orders.map((order) => {
                const statusConfig = ORDER_STATUS_FLOW[order.status as OrderStatusKey]
                
                return (
                  <tr key={order.id} className="hover:bg-[#1A1A1A]">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">#{order.shopifyOrderNumber || order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{order.customer?.firstName} {order.customer?.lastName}</div>
                      <div className="text-gray-400 text-sm">{order.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-white">{formatCurrency(Number(order.totalAmount), order.currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusConfig?.color || 'bg-gray-800 text-gray-300'}`}>
                        {statusConfig?.label || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{order.delivery?.assignedTo?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-[#FF6B4A] hover:text-[#FF8566] text-sm font-medium"
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

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">No orders found</div>
        )}
      </div>
    </div>
  )
}
