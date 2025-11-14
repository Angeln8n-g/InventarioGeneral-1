// Simple in-memory rate limiter for reports
// In production, consider using Redis for distributed rate limiting

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  requests: number
  window: number // in milliseconds
}

export const RATE_LIMITS = {
  REPORT_VIEW: { requests: 60, window: 60000 }, // 60 requests per minute
  REPORT_EXPORT: { requests: 10, window: 60000 }, // 10 requests per minute
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    const resetTime = now + config.window
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime,
    }
  }

  if (entry.count >= config.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
  }
}

export function getRateLimitKey(userId: number, endpoint: string): string {
  return `${userId}:${endpoint}`
}
