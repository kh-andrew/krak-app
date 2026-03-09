import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Hardcoded Supabase connection for production
// This bypasses Vercel's broken environment variable caching
const SUPABASE_URL = "postgresql://postgres.vbrxgybsvbruvtfvueui:Krakhealth*123@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        // Force Supabase connection - ignore Vercel env cache
        url: SUPABASE_URL,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
