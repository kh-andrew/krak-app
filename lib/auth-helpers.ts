import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

export async function requireAuth(role?: UserRole) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }
  
  if (role && session.user.role !== role) {
    redirect('/unauthorized')
  }
  
  return session
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}
