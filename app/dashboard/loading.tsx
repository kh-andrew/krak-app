export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20 md:pb-8">
      {/* Header Skeleton */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="h-7 md:h-8 w-24 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-4 w-32 bg-[#2A2A2A] rounded mt-1 animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-[#2A2A2A] rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#141414] p-3 md:p-4 rounded-lg md:rounded-xl border border-[#2A2A2A]">
              <div className="h-3 w-12 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="h-6 md:h-8 w-8 bg-[#2A2A2A] rounded mt-1 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Search Skeleton */}
        <div className="bg-[#141414] p-3 md:p-4 rounded-xl border border-[#2A2A2A]">
          <div className="h-10 w-full bg-[#2A2A2A] rounded animate-pulse" />
        </div>

        {/* Table Skeleton */}
        <div className="hidden md:block bg-[#141414] rounded-xl border border-[#2A2A2A] overflow-hidden">
          <div className="bg-[#1A1A1A] px-6 py-3">
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-4 w-16 bg-[#2A2A2A] rounded animate-pulse" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="px-6 py-4 border-t border-[#2A2A2A]">
              <div className="flex gap-4">
                <div className="h-5 w-20 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-32 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-16 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-20 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-24 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-20 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-12 bg-[#2A2A2A] rounded animate-pulse ml-auto" />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Cards Skeleton */}
        <div className="md:hidden space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 w-16 bg-[#2A2A2A] rounded animate-pulse" />
                    <div className="h-5 w-12 bg-[#2A2A2A] rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-32 bg-[#2A2A2A] rounded animate-pulse" />
                  <div className="h-3 w-40 bg-[#2A2A2A] rounded mt-1 animate-pulse" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-3 w-12 bg-[#2A2A2A] rounded animate-pulse" />
                    <div className="h-3 w-12 bg-[#2A2A2A] rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-5 bg-[#2A2A2A] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
