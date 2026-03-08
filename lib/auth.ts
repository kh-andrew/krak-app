import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// Generate a consistent secret for JWT signing
// In production, this should be set via AUTH_SECRET environment variable
const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret,
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
          const parsed = credentialsSchema.safeParse(credentials)
          if (!parsed.success) {
            console.log('[AUTH] Invalid credentials format')
            return null
          }

          const { email, password } = parsed.data

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
        } catch (error) {
          console.error('[AUTH_ERROR]', error)
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
})
