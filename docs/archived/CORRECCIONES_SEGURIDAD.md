# 🔒 Correcciones de Seguridad Aplicadas

## 📋 Índice de Correcciones

1. [JWT Secret Obligatorio](#1-jwt-secret-obligatorio)
2. [Rate Limiting](#2-rate-limiting)
3. [Validación de Entrada con Zod](#3-validación-de-entrada)
4. [Logs Seguros](#4-logs-seguros)
5. [Headers de Seguridad](#5-headers-de-seguridad)
6. [Password Requirements](#6-password-requirements)
7. [JWT con Expiración](#7-jwt-con-expiración)

---

## 1. JWT Secret Obligatorio

### Archivo: `src/lib/auth-middleware.ts`

**ANTES:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
```

**DESPUÉS:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET environment variable is required. ' +
    'Generate a secure secret with: openssl rand -base64 32'
  )
}
```

### Archivos a actualizar:
- `src/lib/auth-middleware.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/profile/route.ts`
- `src/app/api/auth/logout/route.ts`

### Generar JWT_SECRET seguro:
```bash
# En terminal
openssl rand -base64 32

# O en Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Actualizar .env:
```env
JWT_SECRET=tu_secret_generado_aqui_muy_largo_y_aleatorio
```

---

## 2. Rate Limiting

### Nuevo archivo: `src/middleware/rate-limit.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
  blocked: boolean
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Limpiar registros antiguos cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000)

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

    // Agregar headers informativos
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
```

### Uso en endpoints:

```typescript
// src/app/api/auth/login/route.ts
import { loginRateLimiter } from '@/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResponse = await loginRateLimiter(request)
  if (rateLimitResponse) return rateLimitResponse

  // Resto del código...
}
```

---

## 3. Validación de Entrada

### Instalar Zod:
```bash
npm install zod
```

### Nuevo archivo: `src/lib/validation-schemas.ts`

```typescript
import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
})

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  full_name: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
})

// Tool schemas
export const createToolSchema = z.object({
  item_type_id: z.number().int().positive('Item type ID must be a positive integer'),
  serial_number: z.string()
    .max(100, 'Serial number must be less than 100 characters')
    .optional(),
  qr_code: z.string()
    .max(255, 'QR code must be less than 255 characters')
    .optional(),
  condition_notes: z.string()
    .max(1000, 'Condition notes must be less than 1000 characters')
    .optional()
})

// Loan schemas
export const createLoanSchema = z.object({
  tool_instance_id: z.number().int().positive('Tool instance ID must be a positive integer'),
  due_date: z.string().datetime('Invalid due date format'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
})

// Consumable schemas
export const consumeConsumableSchema = z.object({
  qr_code: z.string()
    .min(1, 'QR code is required')
    .max(255, 'QR code must be less than 255 characters'),
  quantity: z.number()
    .int('Quantity must be an integer')
    .positive('Quantity must be positive')
    .max(10000, 'Quantity must be less than 10000'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
})

// Helper function para validar
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, errors: result.error }
}
```

### Uso en endpoints:

```typescript
// src/app/api/auth/login/route.ts
import { loginSchema, validateRequest } from '@/lib/validation-schemas'

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  // Validar entrada
  const validation = validateRequest(loginSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      { 
        error: 'Invalid input',
        details: validation.errors.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      },
      { status: 400 }
    )
  }
  
  const { username, password } = validation.data
  // Resto del código...
}
```

---

## 4. Logs Seguros

### Nuevo archivo: `src/lib/logger.ts`

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: number
  action?: string
  ip?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sensitiveKeys = [
      'password',
      'password_hash',
      'token',
      'secret',
      'api_key',
      'authorization',
      'cookie'
    ]

    const sanitized: any = Array.isArray(data) ? [] : {}

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value)
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const sanitizedContext = context ? this.sanitize(context) : {}

    const logEntry = {
      timestamp,
      level,
      message,
      ...sanitizedContext
    }

    // En desarrollo, log completo
    if (this.isDevelopment) {
      console[level === 'debug' ? 'log' : level](
        `[${timestamp}] ${level.toUpperCase()}: ${message}`,
        sanitizedContext
      )
    } else {
      // En producción, solo JSON
      console[level === 'debug' ? 'log' : level](JSON.stringify(logEntry))
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context)
    }
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, {
      ...context,
      error: {
        message: error?.message,
        name: error?.name,
        stack: this.isDevelopment ? error?.stack : undefined
      }
    })
  }
}

export const logger = new Logger()
```

### Uso:

```typescript
// ❌ ANTES
console.error('Login error:', error)

// ✅ DESPUÉS
import { logger } from '@/lib/logger'

logger.error('Login failed', error, {
  userId: user?.id,
  action: 'login',
  ip: request.headers.get('x-forwarded-for')
})
```

---

## 5. Headers de Seguridad

### Actualizar: `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          }
        ]
      }
    ]
  }
}

export default nextConfig
```

---

## 6. Password Requirements

### Actualizar migración: `supabase/migrations/008_password_requirements.sql`

```sql
-- Agregar tabla para historial de passwords (prevenir reuso)
CREATE TABLE IF NOT EXISTS password_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_history_user ON password_history(user_id);

-- Función para validar password
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Mínimo 8 caracteres
  IF LENGTH(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Al menos una mayúscula
  IF password !~ '[A-Z]' THEN
    RAISE EXCEPTION 'Password must contain at least one uppercase letter';
  END IF;
  
  -- Al menos una minúscula
  IF password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must contain at least one lowercase letter';
  END IF;
  
  -- Al menos un número
  IF password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one number';
  END IF;
  
  -- Al menos un carácter especial
  IF password !~ '[^A-Za-z0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one special character';
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para guardar historial de passwords
CREATE OR REPLACE FUNCTION save_password_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.password_hash != OLD.password_hash THEN
    INSERT INTO password_history (user_id, password_hash)
    VALUES (NEW.id, OLD.password_hash);
    
    -- Mantener solo últimos 5 passwords
    DELETE FROM password_history
    WHERE user_id = NEW.id
    AND id NOT IN (
      SELECT id FROM password_history
      WHERE user_id = NEW.id
      ORDER BY created_at DESC
      LIMIT 5
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_save_password_history
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION save_password_history();
```

---

## 7. JWT con Expiración

### Actualizar: `src/app/api/auth/login/route.ts`

```typescript
// Generar token con expiración
const token = jwt.sign(
  { 
    userId: user.id,
    role: user.role,
    iat: Math.floor(Date.now() / 1000)
  },
  JWT_SECRET,
  { 
    expiresIn: '24h', // Token expira en 24 horas
    issuer: 'inventory-system',
    audience: 'inventory-api'
  }
)

// Generar refresh token (opcional)
const refreshToken = jwt.sign(
  { 
    userId: user.id,
    type: 'refresh'
  },
  JWT_SECRET,
  { 
    expiresIn: '7d' // Refresh token expira en 7 días
  }
)
```

### Middleware para verificar expiración:

```typescript
// src/lib/auth-middleware.ts
export async function authenticateRequest(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided')
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'inventory-system',
      audience: 'inventory-api'
    }) as { userId: number; iat: number; exp: number }

    // Verificar si el token está próximo a expirar (menos de 1 hora)
    const now = Math.floor(Date.now() / 1000)
    const timeUntilExpiry = decoded.exp - now
    
    if (timeUntilExpiry < 3600) {
      // Agregar header para que el cliente sepa que debe renovar
      // (implementar en el response)
    }

    // Get current user data
    const user = await userOperations.getById(decoded.userId)

    if (!user) {
      throw new AuthenticationError('User not found')
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role as 'user' | 'admin',
      },
      token,
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token')
      }
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired', 'TOKEN_EXPIRED')
      }
    }
    throw error
  }
}
```

---

## 📋 Checklist de Implementación

### Crítico (Hacer HOY)
- [ ] Actualizar JWT_SECRET en todos los archivos
- [ ] Generar JWT_SECRET seguro
- [ ] Actualizar .env con nuevo secret
- [ ] Implementar rate limiting en login
- [ ] Implementar validación con Zod en login
- [ ] Actualizar logs para remover datos sensibles

### Alto (Esta Semana)
- [ ] Implementar rate limiting en todos los endpoints
- [ ] Implementar validación en todos los endpoints
- [ ] Actualizar next.config.ts con headers de seguridad
- [ ] Implementar password requirements
- [ ] Agregar expiración a JWT tokens

### Medio (Próximas 2 Semanas)
- [ ] Implementar refresh tokens
- [ ] Agregar password history
- [ ] Implementar CSRF protection
- [ ] Mejorar auditoría de acciones sensibles
- [ ] Configurar log rotation

---

## 🧪 Testing

### Probar Rate Limiting:
```bash
# Hacer 10 requests rápidos al login
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  echo ""
done
```

### Probar Validación:
```bash
# Intentar login con username inválido
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","password":"test123"}'
```

### Probar JWT Expiration:
```typescript
// Generar token con expiración corta para testing
const testToken = jwt.sign(
  { userId: 1 },
  JWT_SECRET,
  { expiresIn: '10s' } // Expira en 10 segundos
)

// Esperar 11 segundos y probar
setTimeout(() => {
  // Debería fallar con "Token expired"
}, 11000)
```

---

## 📚 Recursos Adicionales

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Zod Documentation](https://zod.dev/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)

---

**Tiempo estimado de implementación:** 8-12 horas  
**Prioridad:** 🔴 **CRÍTICA**  
**Impacto:** 🟢 **MUY ALTO**
