import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    const userCount = await prisma.users.count()
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        nodeEnv: process.env.NODE_ENV,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 500 })
  }
}
