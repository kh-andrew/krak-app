import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

export async function requireAuth(role?: UserRole) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }
  
  if (role && (session.user as any).role !== role) {
    redirect('/unauthorized')
  }
  
  return session
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user ?? null
}
