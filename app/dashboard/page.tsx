import { requireAuth } from '@/lib/auth-helpers'
import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { ORDER_STATUS_FLOW, OrderStatusKey } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { OrderSearch } from './components/OrderSearch'

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
  const { search, status } = params
  
  // Fetch orders from Supabase
  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      deliveries (*, users(name))
    `)
    .order('createdAt', { ascending: false })
    .limit(100)
  
  if (status && status !== 'ALL') {
    query = query.eq('status', status)
  }
  
  const { data: orders, error } = await query
  
  if (error) {
    console.error('[DASHBOARD_ERROR]', error)
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl text-white mb-2">Error loading orders</h1>
          <p className="text-gray-400">{error.message}</p>
        </div>
      </div>
    )
  }
  
  // Calculate stats
  const stats = {
    total: orders?.length || 0,
    received: orders?.filter((o: any) => o.status === 'RECEIVED').length || 0,
    preparing: orders?.filter((o: any) => o.status === 'PREPARING').length || 0,
    outForDelivery: orders?.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length || 0,
    delivered: orders?.filter((o: any) => o.status === 'DELIVERED').length || 0,
    failed: orders?.filter((o: any) => o.status === 'FAILED').length || 0,
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
        {/* Stats */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          <div className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A] text-center md:text-left">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl md:text-2xl font-bold text-white">{stats.total}</p>
          </div>
          
          <div className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A] text-center md:text-left">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl md:text-2xl font-bold text-[#F59E0B]">{stats.received + stats.preparing + stats.outForDelivery}</p>
          </div>
          
          <div className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A] text-center md:text-left">
            <p className="text-xs text-gray-400">Delivered</p>
            <p className="text-xl md:text-2xl font-bold text-[#22C55E]">{stats.delivered}</p>
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
            <p className="text-sm text-gray-400">Failed</p>
            <p className="text-2xl font-bold text-[#EF4444]">{stats.failed}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-[#141414] p-3 md:p-4 rounded-xl border border-[#2A2A2A]">
          <OrderSearch defaultValue={search} />
        </div>

        {/* Orders */}
        <div className="md:hidden space-y-3">
          {orders?.map((order: any) => {
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
                      {order.customers?.firstName} {order.customers?.lastName}
                    </p>
                    <p className="text-gray-500 text-xs truncate">{order.customers?.email}</p>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatCurrency(Number(order.totalAmount), order.currency)}</span>
                      <span>•</span>
                      <span>{formatDate(order.createdAt)}</span>
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

        {/* Desktop Table */}
        <div className="hidden md:block bg-[#141414] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1A1A1A]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {orders?.map((order: any) => {
                const statusConfig = ORDER_STATUS_FLOW[order.status as OrderStatusKey]
                
                return (
                  <tr key={order.id} className="hover:bg-[#1A1A1A]">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">#{order.shopifyOrderNumber || order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{order.customers?.firstName} {order.customers?.lastName}</div>
                      <div className="text-gray-400 text-sm">{order.customers?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-white">{formatCurrency(Number(order.totalAmount), order.currency)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusConfig?.color || 'bg-gray-800 text-gray-300'}`}>
                        {statusConfig?.label || order.status}
                      </span>
                    </td>
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

        {(!orders || orders.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">No orders found</p>
            <p className="text-sm">Orders will appear here when they come in from Shopify</p>
          </div>
        )}
      </div>
    </div>
  )
}