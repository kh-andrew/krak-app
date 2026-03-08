import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Get secret from environment
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET

if (!secret) {
  console.warn('[AUTH] WARNING: No AUTH_SECRET or NEXTAUTH_SECRET set. Using fallback for development only.')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: secret || 'development-secret-do-not-use-in-production',
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Authorize called with email:', credentials?.email)
          
          const parsed = credentialsSchema.safeParse(credentials)
          if (!parsed.success) {
            console.log('[AUTH] Invalid credentials format:', parsed.error)
            return null
          }

          const { email, password } = parsed.data
          console.log('[AUTH] Looking up user:', email)

          const user = await prisma.users.findUnique({
            where: { email },
          })

          if (!user) {
            console.log('[AUTH] User not found:', email)
            return null
          }
          
          if (!user.isActive) {
            console.log('[AUTH] User deactivated:', email)
            return null
          }

          console.log('[AUTH] User found, checking password')
          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            console.log('[AUTH] Invalid password for:', email)
            return null
          }

          console.log('[AUTH] Successful login:', email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: any) {
          console.error('[AUTH_ERROR]', error.message, error.stack)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  events: {
    async signIn(message) {
      console.log('[AUTH_EVENT] signIn:', message)
    },
    async error(message) {
      console.error('[AUTH_EVENT] error:', message)
    },
  },
  debug: process.env.NODE_ENV === 'development',
})
