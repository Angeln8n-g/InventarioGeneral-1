import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
    count: number
    resetTime: number
    blocked: boolean
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Limpiar registros antiguos cada 5 minutos
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, record] of rateLimitMap.entries()) {
            if (now > record.resetTime) {
                rateLimitMap.delete(key)
            }
        }
    }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
    maxRequests: number
    windowMs: number
    blockDurationMs?: number
}

export function createRateLimiter(config: RateLimitConfig) {
    const { maxRequests, windowMs, blockDurationMs = windowMs * 2 } = config

    return async (request: NextRequest): Promise<NextResponse | null> => {
        // Obtener IP del cliente
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown'

        const now = Date.now()
        const record = rateLimitMap.get(ip)

        // Si está bloqueado
        if (record?.blocked && now < record.resetTime) {
            return NextResponse.json(
                {
                    error: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((record.resetTime - now) / 1000)),
                        'X-RateLimit-Limit': String(maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(record.resetTime)
                    }
                }
            )
        }

        // Si no hay registro o expiró
        if (!record || now > record.resetTime) {
            rateLimitMap.set(ip, {
                count: 1,
                resetTime: now + windowMs,
                blocked: false
            })
            return null
        }

        // Incrementar contador
        record.count++

        // Si excede el límite, bloquear
        if (record.count > maxRequests) {
            record.blocked = true
            record.resetTime = now + blockDurationMs

            return NextResponse.json(
                {
                    error: 'Too many requests. You have been temporarily blocked.',
                    retryAfter: Math.ceil(blockDurationMs / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil(blockDurationMs / 1000)),
                        'X-RateLimit-Limit': String(maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(record.resetTime)
                    }
                }
            )
        }

        return null
    }
}

// Rate limiters predefinidos
export const loginRateLimiter = createRateLimiter({
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutos
    blockDurationMs: 30 * 60 * 1000 // 30 minutos de bloqueo
})

export const apiRateLimiter = createRateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minuto
    blockDurationMs: 5 * 60 * 1000 // 5 minutos de bloqueo
})

export const strictRateLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minuto
    blockDurationMs: 10 * 60 * 1000 // 10 minutos de bloqueo
})
