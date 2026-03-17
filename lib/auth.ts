import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const secret = process.env.NEXTAUTH_SECRET

if (!secret) {
  console.warn('[AUTH] NEXTAUTH_SECRET not set! Using fallback for development only.')
}

export const authOptions = {
  secret: secret || 'fallback-secret-do-not-use-in-production',
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials')
          return null
        }

        try {
          console.log('[AUTH] Looking up user:', credentials.email)
          console.log('[AUTH] DB_URL set:', !!process.env.DATABASE_URL)
          
          const user = await prisma.users.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            console.log('[AUTH] User not found:', credentials.email)
            return null
          }
          
          console.log('[AUTH] User found:', user.email, 'isActive:', user.isActive)
          
          if (!user.isActive) {
            console.log('[AUTH] User inactive:', credentials.email)
            return null
          }

          console.log('[AUTH] Comparing password...')
          const isValid = await bcrypt.compare(credentials.password, user.password)
          console.log('[AUTH] Password valid:', isValid)
          
          if (!isValid) {
            console.log('[AUTH] Invalid password for:', credentials.email)
            return null
          }

          console.log('[AUTH] Login successful:', credentials.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error('[AUTH_ERROR]', error)
          console.error('[AUTH_ERROR_STACK]', (error as Error).stack)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)
// Deployment trigger: Mon Mar  9 09:43:54 AM CST 2026
