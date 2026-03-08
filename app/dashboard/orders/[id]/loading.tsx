export default function OrderDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header Skeleton */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-6 w-32 bg-[#2A2A2A] rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-[#2A2A2A] rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Order Info Skeleton */}
        <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="h-5 w-24 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="h-4 w-40 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="h-4 w-32 bg-[#2A2A2A] rounded animate-pulse" />
            </div>
            <div className="h-6 w-20 bg-[#2A2A2A] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Customer Skeleton */}
        <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
          <div className="h-5 w-20 bg-[#2A2A2A] rounded animate-pulse mb-3" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-4 w-48 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-4 w-40 bg-[#2A2A2A] rounded animate-pulse" />
          </div>
        </div>

        {/* Line Items Skeleton */}
        <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
          <div className="h-5 w-24 bg-[#2A2A2A] rounded animate-pulse mb-3" />
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between py-2 border-t border-[#2A2A2A]">
              <div className="h-4 w-32 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="h-4 w-16 bg-[#2A2A2A] rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Activity Log Skeleton */}
        <div className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
          <div className="h-5 w-28 bg-[#2A2A2A] rounded animate-pulse mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 py-2">
              <div className="h-2 w-2 bg-[#2A2A2A] rounded-full mt-2 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-full bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-3 w-24 bg-[#2A2A2A] rounded mt-1 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
