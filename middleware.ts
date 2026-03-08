import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// For production, use Redis or similar
const rateLimit = new Map<string, { count: number; resetTime: number }>()
const authLimit = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window
const AUTH_RATE_LIMIT_MAX = 20 // auth requests per minute

export function middleware(request: NextRequest) {
  const identifier = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 
                     request.headers.get('x-real-ip') ?? 
                     'anonymous'
  const path = request.nextUrl.pathname

  // Skip rate limiting for health check
  if (path === '/api/health') {
    return NextResponse.next()
  }

  // Stricter limits for auth endpoints
  if (path.startsWith('/api/auth')) {
    const now = Date.now()
    const authRecord = authLimit.get(identifier)

    if (!authRecord || now > authRecord.resetTime) {
      authLimit.set(identifier, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      })
    } else if (authRecord.count >= AUTH_RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    } else {
      authRecord.count++
    }
  }

  // General API rate limiting
  if (path.startsWith('/api/')) {
    const now = Date.now()
    const record = rateLimit.get(identifier)

    if (!record || now > record.resetTime) {
      rateLimit.set(identifier, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      })
    } else if (record.count >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    } else {
      record.count++
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}