import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from '@/lib/supabase'
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
          console.log('[AUTH] Authenticating via Supabase Auth:', credentials.email)
          
          // Step 1: Authenticate with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (authError || !authData.user) {
            console.log('[AUTH] Supabase Auth failed:', authError?.message)
            return null
          }

          console.log('[AUTH] Supabase Auth successful:', authData.user.email)

          // Step 2: Get or create user in Prisma database
          let dbUser = await prisma.users.findUnique({
            where: { email: credentials.email },
          })

          if (!dbUser) {
            console.log('[AUTH] Creating user in database:', credentials.email)
            // Create user in database if doesn't exist
            dbUser = await prisma.users.create({
              data: {
                id: authData.user.id,
                email: credentials.email,
                name: authData.user.user_metadata?.name || credentials.email.split('@')[0],
                role: 'ADMIN', // Default role
                password: 'supabase-managed', // Password is managed by Supabase
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            })
          }

          if (!dbUser.isActive) {
            console.log('[AUTH] User inactive:', credentials.email)
            return null
          }

          console.log('[AUTH] Login successful:', credentials.email)
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          }
        } catch (error) {
          console.error('[AUTH_ERROR]', error)
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