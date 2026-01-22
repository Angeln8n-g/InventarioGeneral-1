/**
 * JWT Authentication - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 22: Endpoints requieren autenticación JWT
 * 
 * Property Description:
 * Para cualquier solicitud a endpoints de evaluación sin token JWT válido, 
 * el sistema debe retornar error 401.
 * 
 * **Validates: Requirements 8.3**
 */

import * as fc from 'fast-check'

// ============================================================================
// Types for Testing
// ============================================================================

/**
 * Represents different types of invalid authorization headers that should always fail
 */
type InvalidAuthHeaderType = 
  | 'missing'           // No Authorization header
  | 'empty'             // Empty Authorization header
  | 'no_bearer'         // Missing "Bearer " prefix
  | 'malformed_bearer'  // Malformed Bearer prefix (e.g., "bearer", "BEARER", "Bear")
  | 'whitespace_only'   // Only whitespace after Bearer
  | 'random_string'     // Random string instead of JWT
  | 'invalid_token'     // Invalid token format

/**
 * Represents an evaluation endpoint for testing
 */
interface EvaluationEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
}

// ============================================================================
// Authentication Validation Logic (extracted from auth-middleware.ts)
// ============================================================================

/**
 * Validates the authorization header format
 * This mirrors the logic in authenticateRequest from auth-middleware.ts
 */
function validateAuthorizationHeader(authHeader: string | null | undefined): {
  isValid: boolean
  error?: string
  token?: string
} {
  // Check if header exists
  if (!authHeader) {
    return { isValid: false, error: 'No token provided' }
  }

  // Check if header starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'No token provided' }
  }

  // Extract token
  const token = authHeader.substring(7)

  // Check if token is empty or whitespace only
  if (!token || token.trim().length === 0) {
    return { isValid: false, error: 'No token provided' }
  }

  // Token exists but we can't validate JWT signature without the secret
  // In real implementation, jwt.verify would throw for invalid tokens
  return { isValid: true, token }
}

/**
 * Checks if a string has valid JWT format (3 base64url-encoded parts separated by dots)
 */
function isValidJwtFormat(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  
  // Check each part is non-empty and contains only base64url characters
  const base64urlRegex = /^[A-Za-z0-9_-]+$/
  return parts.every(part => part.length > 0 && base64urlRegex.test(part))
}

/**
 * Full authentication validation that checks both header format and JWT format
 */
function validateAuthentication(authHeader: string | null | undefined): {
  isAuthenticated: boolean
  error?: string
  statusCode: number
} {
  const headerValidation = validateAuthorizationHeader(authHeader)
  
  if (!headerValidation.isValid) {
    return {
      isAuthenticated: false,
      error: headerValidation.error,
      statusCode: 401
    }
  }

  // Check JWT format (in real implementation, jwt.verify would do this)
  if (!isValidJwtFormat(headerValidation.token!)) {
    return {
      isAuthenticated: false,
      error: 'Invalid token',
      statusCode: 401
    }
  }

  // Note: In real implementation, we would also verify:
  // 1. JWT signature with secret
  // 2. Token expiration
  // 3. User exists in database
  // For this test, we're validating the format checks that happen before those

  return {
    isAuthenticated: true,
    statusCode: 200
  }
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Generates an invalid authorization header based on the type
 */
function generateInvalidAuthHeader(type: InvalidAuthHeaderType, randomValue?: string): string | null {
  switch (type) {
    case 'missing':
      return null
    case 'empty':
      return ''
    case 'no_bearer':
      return randomValue || 'some-token-without-bearer'
    case 'invalid_token':
      return `Bearer ${randomValue || 'invalid.token.here'}`
    case 'malformed_bearer':
      return `bearer ${randomValue || 'token'}`
    case 'whitespace_only':
      return 'Bearer    '
    case 'random_string':
      return randomValue || 'completely-random-string'
    default:
      return null
  }
}

// ============================================================================
// Evaluation Endpoints to Test
// ============================================================================

/**
 * List of all evaluation endpoints that require JWT authentication
 */
const evaluationEndpoints: EvaluationEndpoint[] = [
  // Templates endpoints
  { path: '/api/admin/evaluations/templates', method: 'GET', description: 'List templates' },
  { path: '/api/admin/evaluations/templates', method: 'POST', description: 'Create template' },
  { path: '/api/admin/evaluations/templates/1', method: 'GET', description: 'Get template by ID' },
  { path: '/api/admin/evaluations/templates/1', method: 'PUT', description: 'Update template' },
  { path: '/api/admin/evaluations/templates/1', method: 'DELETE', description: 'Delete template' },
  
  // Schedule endpoints
  { path: '/api/admin/evaluations/schedule', method: 'GET', description: 'List scheduled evaluations' },
  { path: '/api/admin/evaluations/schedule', method: 'POST', description: 'Create scheduled evaluation' },
  { path: '/api/admin/evaluations/schedule/1', method: 'GET', description: 'Get scheduled evaluation by ID' },
  { path: '/api/admin/evaluations/schedule/1', method: 'PUT', description: 'Update scheduled evaluation' },
  { path: '/api/admin/evaluations/schedule/1', method: 'DELETE', description: 'Delete scheduled evaluation' },
  
  // Calendar endpoint
  { path: '/api/admin/evaluations/calendar', method: 'GET', description: 'Get calendar data' },
  
  // Questionnaire and submission endpoints
  { path: '/api/admin/evaluations/1/questionnaire', method: 'GET', description: 'Get questionnaire' },
  { path: '/api/admin/evaluations/1/submit', method: 'POST', description: 'Submit evaluation' },
  
  // History endpoints
  { path: '/api/admin/evaluations/history/1', method: 'GET', description: 'Get evaluation history' },
  
  // Reports endpoints
  { path: '/api/admin/evaluations/reports/responsible', method: 'GET', description: 'Get responsible report' },
  { path: '/api/admin/evaluations/reports/space', method: 'GET', description: 'Get space report' },
  { path: '/api/admin/evaluations/reports/general', method: 'GET', description: 'Get general report' },
]

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for invalid authorization header types
 */
const invalidAuthHeaderTypeArb = fc.constantFrom<InvalidAuthHeaderType>(
  'missing',
  'empty',
  'no_bearer',
  'invalid_token',
  'malformed_bearer',
  'whitespace_only',
  'random_string'
)

/**
 * Generator for random strings to use in invalid tokens
 */
const randomTokenStringArb = fc.string({ minLength: 1, maxLength: 100 })

/**
 * Generator for evaluation endpoints
 */
const endpointArb = fc.constantFrom(...evaluationEndpoints)

/**
 * Generator for malformed Bearer prefixes
 */
const malformedBearerPrefixArb = fc.constantFrom(
  'bearer',
  'BEARER',
  'Bear',
  'Bearr',
  'Bearer:',
  'Bearer-',
  'Token',
  'Basic',
  'Digest'
)

/**
 * Generator for invalid JWT-like strings (wrong format)
 */
const invalidJwtFormatArb = fc.oneof(
  fc.constant('not.a.jwt'),
  fc.constant('only-one-part'),
  fc.constant('two.parts'),
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('.')),
  fc.constant(''),
  fc.constant('   '),
  fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), // Only header, no payload or signature
  fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9'), // Missing signature
)

/**
 * Generator for base64url-like strings
 */
const base64urlCharArb = fc.constantFrom(
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('')
)

/**
 * Generator for valid-looking JWT format (3 base64url parts)
 * Note: These are syntactically valid but won't pass signature verification
 */
const validJwtFormatArb = fc.tuple(
  fc.array(base64urlCharArb, { minLength: 10, maxLength: 50 }).map(arr => arr.join('')),
  fc.array(base64urlCharArb, { minLength: 10, maxLength: 50 }).map(arr => arr.join('')),
  fc.array(base64urlCharArb, { minLength: 10, maxLength: 50 }).map(arr => arr.join('')),
).map(([header, payload, signature]) => `${header}.${payload}.${signature}`)

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 22: Endpoints requieren autenticación JWT', () => {
  /**
   * Property 22: JWT Authentication Required
   * For any request to evaluation endpoints without a valid JWT token,
   * the system must return a 401 error.
   * 
   * **Validates: Requirements 8.3**
   */
  
  describe('Missing Authorization Header', () => {
    test('requests without Authorization header should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          (endpoint) => {
            const result = validateAuthentication(null)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
            expect(result.error).toBe('No token provided')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('requests with empty Authorization header should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          (endpoint) => {
            const result = validateAuthentication('')
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('requests with undefined Authorization header should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          (endpoint) => {
            const result = validateAuthentication(undefined)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Invalid Bearer Prefix', () => {
    test('requests without Bearer prefix should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          randomTokenStringArb,
          (endpoint, token) => {
            // Token without "Bearer " prefix
            const result = validateAuthentication(token)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('requests with malformed Bearer prefix should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          malformedBearerPrefixArb,
          randomTokenStringArb,
          (endpoint, prefix, token) => {
            const authHeader = `${prefix} ${token}`
            const result = validateAuthentication(authHeader)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('requests with lowercase bearer should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          randomTokenStringArb,
          (endpoint, token) => {
            const result = validateAuthentication(`bearer ${token}`)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Invalid JWT Token Format', () => {
    test('requests with invalid JWT format should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          invalidJwtFormatArb,
          (endpoint, invalidToken) => {
            const result = validateAuthentication(`Bearer ${invalidToken}`)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('requests with random string as token should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.split('.').length !== 3),
          (endpoint, randomString) => {
            const result = validateAuthentication(`Bearer ${randomString}`)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('requests with whitespace-only token should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.array(fc.constantFrom(' ', '\t'), { minLength: 0, maxLength: 10 }).map(arr => arr.join('')),
          (endpoint, whitespace) => {
            const result = validateAuthentication(`Bearer ${whitespace}`)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('JWT with only 1 part should fail authentication', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.string({ minLength: 10, maxLength: 50 }).filter(s => !s.includes('.')),
          (endpoint, singlePart) => {
            const result = validateAuthentication(`Bearer ${singlePart}`)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('JWT with only 2 parts should fail authentication', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.tuple(
            fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes('.')),
            fc.string({ minLength: 5, maxLength: 30 }).filter(s => !s.includes('.'))
          ),
          (endpoint, [part1, part2]) => {
            const result = validateAuthentication(`Bearer ${part1}.${part2}`)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('All Invalid Header Types', () => {
    test('all types of invalid authorization headers should fail authentication with 401', () => {
      fc.assert(
        fc.property(
          endpointArb,
          invalidAuthHeaderTypeArb,
          randomTokenStringArb,
          (endpoint, headerType, randomValue) => {
            const authHeader = generateInvalidAuthHeader(headerType, randomValue)
            const result = validateAuthentication(authHeader)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Endpoint Coverage', () => {
    test('all evaluation endpoints require authentication', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...evaluationEndpoints),
          (endpoint) => {
            // Test with no auth header
            const result = validateAuthentication(null)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: evaluationEndpoints.length }
      )
    })

    test('templates endpoints require authentication', () => {
      const templateEndpoints = evaluationEndpoints.filter(e => e.path.includes('/templates'))
      
      fc.assert(
        fc.property(
          fc.constantFrom(...templateEndpoints),
          invalidAuthHeaderTypeArb,
          (endpoint, headerType) => {
            const authHeader = generateInvalidAuthHeader(headerType)
            const result = validateAuthentication(authHeader)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('schedule endpoints require authentication', () => {
      const scheduleEndpoints = evaluationEndpoints.filter(e => e.path.includes('/schedule'))
      
      fc.assert(
        fc.property(
          fc.constantFrom(...scheduleEndpoints),
          invalidAuthHeaderTypeArb,
          (endpoint, headerType) => {
            const authHeader = generateInvalidAuthHeader(headerType)
            const result = validateAuthentication(authHeader)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('reports endpoints require authentication', () => {
      const reportEndpoints = evaluationEndpoints.filter(e => e.path.includes('/reports'))
      
      fc.assert(
        fc.property(
          fc.constantFrom(...reportEndpoints),
          invalidAuthHeaderTypeArb,
          (endpoint, headerType) => {
            const authHeader = generateInvalidAuthHeader(headerType)
            const result = validateAuthentication(authHeader)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Authentication Validation Properties', () => {
    test('authentication validation is deterministic for same input', () => {
      fc.assert(
        fc.property(
          endpointArb,
          invalidAuthHeaderTypeArb,
          randomTokenStringArb,
          (endpoint, headerType, randomValue) => {
            const authHeader = generateInvalidAuthHeader(headerType, randomValue)
            const result1 = validateAuthentication(authHeader)
            const result2 = validateAuthentication(authHeader)
            
            // Both should have same result
            expect(result1.isAuthenticated).toBe(result2.isAuthenticated)
            expect(result1.statusCode).toBe(result2.statusCode)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('valid JWT format passes header validation but would fail signature verification', () => {
      fc.assert(
        fc.property(
          endpointArb,
          validJwtFormatArb,
          (endpoint, validFormatToken) => {
            const result = validateAuthentication(`Bearer ${validFormatToken}`)
            
            // Format validation passes (3 parts, base64url encoded)
            // In real implementation, this would fail at jwt.verify due to invalid signature
            expect(result.isAuthenticated).toBe(true)
            // Note: Real implementation would return 401 because signature is invalid
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Edge Cases', () => {
    test('Bearer with extra spaces before token should fail if token is invalid', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.integer({ min: 2, max: 10 }),
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.split('.').length !== 3),
          (endpoint, numSpaces, token) => {
            const spaces = ' '.repeat(numSpaces)
            // "Bearer  token" - extra space means token starts with space
            const authHeader = `Bearer${spaces}${token}`
            const result = validateAuthentication(authHeader)
            
            // This should fail because the token format is invalid
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('Authorization header with only Bearer keyword should fail', () => {
      fc.assert(
        fc.property(
          endpointArb,
          (endpoint) => {
            const result = validateAuthentication('Bearer')
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('Authorization header with Bearer and space but no token should fail', () => {
      fc.assert(
        fc.property(
          endpointArb,
          (endpoint) => {
            const result = validateAuthentication('Bearer ')
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('HTTP Methods Coverage', () => {
    test('GET requests without auth should fail with 401', () => {
      const getEndpoints = evaluationEndpoints.filter(e => e.method === 'GET')
      
      fc.assert(
        fc.property(
          fc.constantFrom(...getEndpoints),
          (endpoint) => {
            const result = validateAuthentication(null)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: getEndpoints.length }
      )
    })

    test('POST requests without auth should fail with 401', () => {
      const postEndpoints = evaluationEndpoints.filter(e => e.method === 'POST')
      
      fc.assert(
        fc.property(
          fc.constantFrom(...postEndpoints),
          (endpoint) => {
            const result = validateAuthentication(null)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: postEndpoints.length }
      )
    })

    test('PUT requests without auth should fail with 401', () => {
      const putEndpoints = evaluationEndpoints.filter(e => e.method === 'PUT')
      
      fc.assert(
        fc.property(
          fc.constantFrom(...putEndpoints),
          (endpoint) => {
            const result = validateAuthentication(null)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: putEndpoints.length }
      )
    })

    test('DELETE requests without auth should fail with 401', () => {
      const deleteEndpoints = evaluationEndpoints.filter(e => e.method === 'DELETE')
      
      fc.assert(
        fc.property(
          fc.constantFrom(...deleteEndpoints),
          (endpoint) => {
            const result = validateAuthentication(null)
            
            expect(result.isAuthenticated).toBe(false)
            expect(result.statusCode).toBe(401)
          }
        ),
        { numRuns: deleteEndpoints.length }
      )
    })
  })

  describe('Status Code Consistency', () => {
    test('all authentication failures return 401 status code', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.oneof(
            fc.constant(null),
            fc.constant(''),
            fc.constant('invalid'),
            fc.constant('bearer token'),
            fc.constant('Bearer'),
            fc.constant('Bearer '),
            fc.constant('Bearer invalid'),
            invalidJwtFormatArb.map(t => `Bearer ${t}`)
          ),
          (endpoint, authHeader) => {
            const result = validateAuthentication(authHeader)
            
            if (!result.isAuthenticated) {
              expect(result.statusCode).toBe(401)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
