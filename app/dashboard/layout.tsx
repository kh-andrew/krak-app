import { requireAuth } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuth()
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="bg-[#141414] border-b border-[#2A2A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center gap-3">
                <Image
                  src="/krak-logo.jpg"
                  alt="Krak"
                  width={100}
                  height={35}
                  className="rounded"
                  priority
                />
                <span className="text-gray-400 text-sm hidden sm:block">|</span>
                <span className="text-white font-semibold hidden sm:block">
                  Order Management
                </span>
              </Link>
              
              <div className="ml-8 flex space-x-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2A2A2A] transition-colors"
                >
                  Orders
                </Link>
                <Link
                  href="/dashboard/deliveries"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2A2A2A] transition-colors"
                >
                  Deliveries
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {(session.user as any).name || session.user?.email}
              </span>
              
              <a
                href="/api/auth/signout"
                className="text-sm text-gray-400 hover:text-[#FF6B4A] transition-colors"
              >
                Sign Out
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
