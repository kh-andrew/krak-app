export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-20">
      {/* Header Skeleton */}
      <div className="bg-[#141414] border-b border-[#2A2A2A] px-4 py-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="h-8 w-32 bg-[#2A2A2A] rounded animate-pulse" />
            <div className="h-4 w-24 bg-[#2A2A2A] rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-[#2A2A2A] rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
              <div className="h-3 w-16 bg-[#2A2A2A] rounded animate-pulse mx-auto" />
              <div className="h-8 w-12 bg-[#2A2A2A] rounded animate-pulse mx-auto mt-2" />
            </div>
          ))}
        </div>

        {/* Form Skeleton */}
        <div className="bg-[#141414] p-4 rounded-xl border border-[#2A2A2A]">
          <div className="h-6 w-32 bg-[#2A2A2A] rounded animate-pulse" />
          <div className="h-10 w-full bg-[#2A2A2A] rounded mt-3 animate-pulse" />
        </div>

        {/* List Skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-[#141414] rounded-xl border border-[#2A2A2A] p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="h-4 w-20 bg-[#2A2A2A] rounded animate-pulse" />
                <div className="h-5 w-32 bg-[#2A2A2A] rounded mt-1 animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-[#2A2A2A] rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-[#2A2A2A]">
              <div className="h-8 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="h-8 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="h-8 bg-[#2A2A2A] rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
