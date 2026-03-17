import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT_SET'
  
  // Mask the password for security
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@')
  
  return NextResponse.json({
    database_url_set: !!process.env.DATABASE_URL,
    database_url_preview: maskedUrl,
    node_env: process.env.NODE_ENV,
  })
}