import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
// For production, use Redis or similar
const rateLimit = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // requests per window

export function rateLimitCheck(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimit.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export function middleware(request: NextRequest) {
  // Get IP or user identifier
  const identifier = request.ip ?? 'anonymous'
  const path = request.nextUrl.pathname

  // Stricter limits for auth endpoints
  if (path.startsWith('/api/auth')) {
    const authLimit = new Map<string, { count: number; resetTime: number }>()
    const authRecord = authLimit.get(identifier)
    const now = Date.now()

    if (!authRecord || now > authRecord.resetTime) {
      authLimit.set(identifier, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      })
    } else if (authRecord.count >= 10) {
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
    if (!rateLimitCheck(identifier)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
