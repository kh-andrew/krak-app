// Rate limiting utility for login attempts
// Prevents brute force attacks

interface RateLimitEntry {
  attempts: number
  lastAttempt: number
  blockedUntil?: number
}

const loginAttempts = new Map<string, RateLimitEntry>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000 // 30 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: number } {
  const now = Date.now()
  const entry = loginAttempts.get(identifier)
  
  // Clean up old entries
  if (entry && entry.blockedUntil && now > entry.blockedUntil) {
    loginAttempts.delete(identifier)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }
  
  // Check if currently blocked
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      blockedUntil: entry.blockedUntil 
    }
  }
  
  // Check if window has expired
  if (entry && now - entry.lastAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { attempts: 1, lastAttempt: now })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 }
  }
  
  // Check attempts within window
  if (entry) {
    if (entry.attempts >= MAX_ATTEMPTS) {
      const blockedUntil = now + BLOCK_DURATION_MS
      loginAttempts.set(identifier, { 
        ...entry, 
        blockedUntil,
        lastAttempt: now 
      })
      return { allowed: false, remainingAttempts: 0, blockedUntil }
    }
    
    loginAttempts.set(identifier, {
      attempts: entry.attempts + 1,
      lastAttempt: now
    })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.attempts - 1 }
  }
  
  // First attempt
  loginAttempts.set(identifier, { attempts: 1, lastAttempt: now })
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 }
}

export function recordSuccessfulLogin(identifier: string): void {
  // Clear attempts on successful login
  loginAttempts.delete(identifier)
}

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of loginAttempts.entries()) {
    if (now - entry.lastAttempt > WINDOW_MS && !entry.blockedUntil) {
      loginAttempts.delete(key)
    }
  }
}, 60 * 60 * 1000)
