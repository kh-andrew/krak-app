interface MiniDashboardProps {
  todayOrders: number
  weekOrders: number
  totalOrders: number
  pendingOrders: number
  fulfillmentRate: number
}

export function MiniDashboard({ 
  todayOrders, 
  weekOrders, 
  totalOrders, 
  pendingOrders,
  fulfillmentRate 
}: MiniDashboardProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
        <p className="text-sm text-gray-400 mb-1">Today's Orders</p>
        <p className="text-3xl font-bold text-white">{todayOrders}</p>
        <p className="text-xs text-gray-500 mt-1">New today</p>
      </div>

      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
        <p className="text-sm text-gray-400 mb-1">This Week</p>
        <p className="text-3xl font-bold text-white">{weekOrders}</p>
        <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
      </div>

      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
        <p className="text-sm text-gray-400 mb-1">Pending</p>
        <p className="text-3xl font-bold text-[#EAB308]">{pendingOrders}</p>
        <p className="text-xs text-gray-500 mt-1">Awaiting fulfillment</p>
      </div>

      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
        <p className="text-sm text-gray-400 mb-1">Fulfillment Rate</p>
        <p className="text-3xl font-bold text-[#22C55E]">{fulfillmentRate}%</p>
        <p className="text-xs text-gray-500 mt-1">All time</p>
      </div>

      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
        <p className="text-sm text-gray-400 mb-1">Total Orders</p>
        <p className="text-3xl font-bold text-white">{totalOrders}</p>
        <p className="text-xs text-gray-500 mt-1">All time</p>
      </div>
    </div>
  )
}