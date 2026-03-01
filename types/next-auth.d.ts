import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: string
  }
}
