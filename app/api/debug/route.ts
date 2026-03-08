import { NextResponse } from 'next/server'

export async function GET() {
  // Show first 50 chars of DATABASE_URL to debug
  const dbUrl = process.env.DATABASE_URL || 'not set'
  const dbUrlPreview = dbUrl.substring(0, 60) + '...'
  
  return NextResponse.json({
    databaseUrlPreview: dbUrlPreview,
    isNeon: dbUrl.includes('neon.tech'),
    isSupabase: dbUrl.includes('supabase.com'),
    nodeEnv: process.env.NODE_ENV,
  })
}
