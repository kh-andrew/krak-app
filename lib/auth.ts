import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { checkRateLimit, recordSuccessfulLogin } from '@/lib/rate-limit'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      async authorize(credentials, req) {
        // Rate limiting by IP + email
        const ip = req?.headers?.get('x-forwarded-for') || 'unknown'
        const identifier = `${ip}:${credentials?.email || 'unknown'}`
        
        const rateLimit = checkRateLimit(identifier)
        if (!rateLimit.allowed) {
          const blockedMinutes = rateLimit.blockedUntil 
            ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 60000)
            : 30
          throw new Error(`Too many attempts. Try again in ${blockedMinutes} minutes.`)
        }
        
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const { email, password } = parsed.data

        try {
          const user = await prisma.users.findUnique({
            where: { email },
          })

          if (!user || !user.isActive) {
            return null
          }

          const isValid = await bcrypt.compare(password, user.password)
          if (!isValid) {
            return null
          }
          
          // Record successful login to reset rate limit
          recordSuccessfulLogin(identifier)

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
