import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-helpers'
import Link from 'next/link'
import { ORDER_STATUS_FLOW, OrderStatusKey } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderSearch } from './components/OrderSearch'
import { OrderFilters } from './components/OrderFilters'
import { MiniDashboard } from './components/MiniDashboard'

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
  
  // Build where clause for filtering
  const where: any = {}
  
  if (status && status !== 'ALL') {
    where.status = status
  }
  
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }
  
  if (search) {
    where.OR = [
      { shopifyOrderNumber: { contains: search, mode: 'insensitive' } },
      { 
        customer: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        }
      },
      { lineItems: { path: ['$'], string_contains: search } },
    ]
  }
  
  if (country && country !== 'ALL') {
    where.customer = { country }
  }
  
  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: {
        select: { firstName: true, lastName: true, email: true, phone: true, country: true },
      },
      delivery: {
        include: {
          assignedTo: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: { activityLogs: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  
  // Get dashboard stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  const [
    totalOrders,
    todayOrders,
    weekOrders,
    deliveredOrders,
    pendingOrders,
    fulfillmentRate
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: { in: ['RECEIVED', 'PREPARING', 'OUT_FOR_DELIVERY'] } } }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ])
  
  const deliveredCount = fulfillmentRate.find(r => r.status === 'DELIVERED')?._count.status || 0
  const totalWithStatus = fulfillmentRate.reduce((sum, r) => sum + r._count.status, 0)
  const fulfillmentPercentage = totalWithStatus > 0 ? Math.round((deliveredCount / totalWithStatus) * 100) : 0
  
  const stats = {
    total: orders.length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    outForDelivery: orders.filter(o => o.status === 'OUT_FOR_DELIVERY').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    failed: orders.filter(o => o.status === 'FAILED').length,
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-gray-400">Manage and track your Shopify orders</p>
        </div>
        <Link
          href="/dashboard/inventory"
          className="bg-[#FF6B4A] hover:bg-[#FF8566] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View Inventory
        </Link>
      </div>
      
      {/* Mini Dashboard */}
      <MiniDashboard 
        todayOrders={todayOrders}
        weekOrders={weekOrders}
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        fulfillmentRate={fulfillmentPercentage}
      />
      
      {/* Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Showing</p>
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
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-[#EF4444]">{stats.failed}</p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A] space-y-4">
        <OrderSearch defaultValue={search} />
        <OrderFilters 
          status={status} 
          dateFrom={dateFrom} 
          dateTo={dateTo}
          country={country}
        />
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
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Activity
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
                    {order.customer?.country && (
                      <div className="text-xs text-gray-500">
                        {order.customer.country}
                      </div>
                    )}
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
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {order._count.activityLogs > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-200">
                        {order._count.activityLogs}
                      </span>
                    )}
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
        
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No orders found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}