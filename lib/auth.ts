import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from '@/lib/supabase'

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
          
          // Authenticate with Supabase Auth only (skip Prisma for now due to connection issues)
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (authError || !authData.user) {
            console.log('[AUTH] Supabase Auth failed:', authError?.message)
            return null
          }

          console.log('[AUTH] Supabase Auth successful:', authData.user.email)

          // Return user data from Supabase Auth
          // Note: We're skipping Prisma database lookup due to connection pooler issues
          // The user data will be synced when database connection is fixed
          return {
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
            role: 'ADMIN', // Default role - will be fetched from DB when connection works
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