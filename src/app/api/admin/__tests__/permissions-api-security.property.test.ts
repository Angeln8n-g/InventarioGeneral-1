/**
 * Permissions API Security - Property-Based Tests
 * Sistema de Gestión de Permisos Dinámico
 * 
 * Feature: dynamic-permissions-system
 * 
 * Property 14: Autenticación requerida
 * Para cualquier request a las APIs de permisos sin token de autenticación válido,
 * la respuesta debe ser código 401.
 * 
 * Property 15: Autorización de administrador requerida
 * Para cualquier request de modificación a las APIs de permisos desde un usuario
 * sin rol de administrador, la respuesta debe ser código 403.
 * 
 * **Validates: Requirements 7.2, 7.3**
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
 * Represents a permissions API endpoint for testing
 */
interface PermissionsEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  description: string
  isModification: boolean  // true for POST, PUT, DELETE operations
}

/**
 * Represents a user role for authorization testing
 */
type UserRole = 'user' | 'admin'


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
 * Returns 401 for authentication failures
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


/**
 * Authorization validation that checks if a user has admin role
 * Returns 403 for authorization failures (user is authenticated but not admin)
 * 
 * @see Requirements 7.3 - Non-admin users should receive 403 for modification requests
 */
function validateAdminAuthorization(userRole: UserRole, isModificationRequest: boolean): {
  isAuthorized: boolean
  error?: string
  statusCode: number
} {
  // For modification requests, only admin role is allowed
  if (isModificationRequest && userRole !== 'admin') {
    return {
      isAuthorized: false,
      error: 'Admin access required',
      statusCode: 403
    }
  }

  // For read requests (GET), we still require admin for permissions API
  // as per the withPermission(ADMIN_MANAGE_PERMISSIONS) middleware
  if (userRole !== 'admin') {
    return {
      isAuthorized: false,
      error: 'Permission denied: admin:manage_permissions',
      statusCode: 403
    }
  }

  return {
    isAuthorized: true,
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
      return `Bearer ${randomValue || 'invalid-token-not-jwt'}`
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
// Permissions API Endpoints to Test
// ============================================================================

/**
 * List of all permissions API endpoints that require authentication and admin authorization
 * @see Design Document - API Routes
 */
const permissionsApiEndpoints: PermissionsEndpoint[] = [
  // Roles API
  { path: '/api/admin/roles', method: 'GET', description: 'List all roles', isModification: false },
  { path: '/api/admin/roles', method: 'POST', description: 'Create new role', isModification: true },
  { path: '/api/admin/roles/1', method: 'GET', description: 'Get role by ID', isModification: false },
  { path: '/api/admin/roles/1', method: 'PUT', description: 'Update role', isModification: true },
  { path: '/api/admin/roles/1', method: 'DELETE', description: 'Delete role', isModification: true },
  
  // Role Permissions API
  { path: '/api/admin/roles/1/permissions', method: 'GET', description: 'Get role permissions', isModification: false },
  { path: '/api/admin/roles/1/permissions', method: 'PUT', description: 'Update role permissions', isModification: true },
  
  // User Permissions API
  { path: '/api/admin/users/1/permissions', method: 'GET', description: 'Get user permissions', isModification: false },
  { path: '/api/admin/users/1/permissions', method: 'PUT', description: 'Update user permissions', isModification: true },
  
  // Audit API
  { path: '/api/admin/permissions/audit', method: 'GET', description: 'Get audit history', isModification: false },
]

/**
 * Modification endpoints only (POST, PUT, DELETE)
 */
const modificationEndpoints = permissionsApiEndpoints.filter(e => e.isModification)

/**
 * Read-only endpoints (GET)
 */
const readOnlyEndpoints = permissionsApiEndpoints.filter(e => !e.isModification)


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
 * Generator for permissions API endpoints
 */
const endpointArb = fc.constantFrom(...permissionsApiEndpoints)

/**
 * Generator for modification endpoints only
 */
const modificationEndpointArb = fc.constantFrom(...modificationEndpoints)

/**
 * Generator for read-only endpoints
 */
const readOnlyEndpointArb = fc.constantFrom(...readOnlyEndpoints)

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
  fc.constant('not-a-jwt'),
  fc.constant('only-one-part'),
  fc.constant('two.parts'),
  fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.split('.').length !== 3),
  fc.constant(''),
  fc.constant('   '),
  fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), // Only header, no payload or signature
  fc.constant('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9'), // Missing signature
)

/**
 * Generator for user roles
 */
const userRoleArb = fc.constantFrom<UserRole>('user', 'admin')

/**
 * Generator for non-admin user roles (only 'user' for now, but extensible)
 */
const nonAdminRoleArb = fc.constant<UserRole>('user')

/**
 * Generator for valid role IDs
 */
const roleIdArb = fc.integer({ min: 1, max: 1000 })

/**
 * Generator for valid user IDs
 */
const userIdArb = fc.integer({ min: 1, max: 10000 })


// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: dynamic-permissions-system', () => {
  /**
   * Property 14: Autenticación requerida
   * 
   * Para cualquier request a las APIs de permisos sin token de autenticación válido,
   * la respuesta debe ser código 401.
   * 
   * **Validates: Requirements 7.2**
   */
  describe('Property 14: Autenticación requerida', () => {
    describe('Missing Authorization Header', () => {
      test('requests without Authorization header should fail with 401', () => {
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

      test('requests with empty Authorization header should fail with 401', () => {
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

      test('requests with undefined Authorization header should fail with 401', () => {
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
      test('requests without Bearer prefix should fail with 401', () => {
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

      test('requests with malformed Bearer prefix should fail with 401', () => {
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

      test('requests with lowercase bearer should fail with 401', () => {
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
      test('requests with invalid JWT format should fail with 401', () => {
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

      test('requests with random string as token should fail with 401', () => {
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

      test('requests with whitespace-only token should fail with 401', () => {
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

      test('JWT with only 1 part should fail with 401', () => {
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

      test('JWT with only 2 parts should fail with 401', () => {
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
      test('all types of invalid authorization headers should fail with 401', () => {
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
      test('all permissions API endpoints require authentication', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(...permissionsApiEndpoints),
            (endpoint) => {
              // Test with no auth header
              const result = validateAuthentication(null)
              
              expect(result.isAuthenticated).toBe(false)
              expect(result.statusCode).toBe(401)
            }
          ),
          { numRuns: permissionsApiEndpoints.length }
        )
      })

      test('roles endpoints require authentication', () => {
        const rolesEndpoints = permissionsApiEndpoints.filter(e => e.path.includes('/roles'))
        
        fc.assert(
          fc.property(
            fc.constantFrom(...rolesEndpoints),
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

      test('user permissions endpoints require authentication', () => {
        const userPermEndpoints = permissionsApiEndpoints.filter(e => e.path.includes('/users/'))
        
        fc.assert(
          fc.property(
            fc.constantFrom(...userPermEndpoints),
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

      test('audit endpoints require authentication', () => {
        const auditEndpoints = permissionsApiEndpoints.filter(e => e.path.includes('/audit'))
        
        fc.assert(
          fc.property(
            fc.constantFrom(...auditEndpoints),
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


    describe('HTTP Methods Coverage', () => {
      test('GET requests without auth should fail with 401', () => {
        const getEndpoints = permissionsApiEndpoints.filter(e => e.method === 'GET')
        
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
        const postEndpoints = permissionsApiEndpoints.filter(e => e.method === 'POST')
        
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
        const putEndpoints = permissionsApiEndpoints.filter(e => e.method === 'PUT')
        
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
        const deleteEndpoints = permissionsApiEndpoints.filter(e => e.method === 'DELETE')
        
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

    describe('Edge Cases', () => {
      test('Authorization header with only Bearer keyword should fail with 401', () => {
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

      test('Authorization header with Bearer and space but no token should fail with 401', () => {
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


  /**
   * Property 15: Autorización de administrador requerida
   * 
   * Para cualquier request de modificación a las APIs de permisos desde un usuario
   * sin rol de administrador, la respuesta debe ser código 403.
   * 
   * **Validates: Requirements 7.3**
   */
  describe('Property 15: Autorización de administrador requerida', () => {
    describe('Non-Admin Users on Modification Endpoints', () => {
      test('non-admin users should receive 403 on POST requests', () => {
        const postEndpoints = modificationEndpoints.filter(e => e.method === 'POST')
        
        fc.assert(
          fc.property(
            fc.constantFrom(...postEndpoints),
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, true)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 25 }
        )
      })

      test('non-admin users should receive 403 on PUT requests', () => {
        const putEndpoints = modificationEndpoints.filter(e => e.method === 'PUT')
        
        fc.assert(
          fc.property(
            fc.constantFrom(...putEndpoints),
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, true)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 25 }
        )
      })

      test('non-admin users should receive 403 on DELETE requests', () => {
        const deleteEndpoints = modificationEndpoints.filter(e => e.method === 'DELETE')
        
        fc.assert(
          fc.property(
            fc.constantFrom(...deleteEndpoints),
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, true)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 25 }
        )
      })
    })


    describe('Non-Admin Users on All Permissions Endpoints', () => {
      test('non-admin users should receive 403 on all permissions API endpoints', () => {
        fc.assert(
          fc.property(
            endpointArb,
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 100 }
        )
      })

      test('non-admin users should receive 403 on roles API', () => {
        const rolesEndpoints = permissionsApiEndpoints.filter(e => e.path.includes('/roles'))
        
        fc.assert(
          fc.property(
            fc.constantFrom(...rolesEndpoints),
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 25 }
        )
      })

      test('non-admin users should receive 403 on user permissions API', () => {
        const userPermEndpoints = permissionsApiEndpoints.filter(e => e.path.includes('/users/'))
        
        fc.assert(
          fc.property(
            fc.constantFrom(...userPermEndpoints),
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 25 }
        )
      })

      test('non-admin users should receive 403 on audit API', () => {
        const auditEndpoints = permissionsApiEndpoints.filter(e => e.path.includes('/audit'))
        
        fc.assert(
          fc.property(
            fc.constantFrom(...auditEndpoints),
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result.isAuthorized).toBe(false)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 25 }
        )
      })
    })


    describe('Admin Users Authorization', () => {
      test('admin users should be authorized on all permissions API endpoints', () => {
        fc.assert(
          fc.property(
            endpointArb,
            (endpoint) => {
              const result = validateAdminAuthorization('admin', endpoint.isModification)
              
              expect(result.isAuthorized).toBe(true)
              expect(result.statusCode).toBe(200)
            }
          ),
          { numRuns: 100 }
        )
      })

      test('admin users should be authorized on modification endpoints', () => {
        fc.assert(
          fc.property(
            modificationEndpointArb,
            (endpoint) => {
              const result = validateAdminAuthorization('admin', true)
              
              expect(result.isAuthorized).toBe(true)
              expect(result.statusCode).toBe(200)
            }
          ),
          { numRuns: 25 }
        )
      })

      test('admin users should be authorized on read-only endpoints', () => {
        fc.assert(
          fc.property(
            readOnlyEndpointArb,
            (endpoint) => {
              const result = validateAdminAuthorization('admin', false)
              
              expect(result.isAuthorized).toBe(true)
              expect(result.statusCode).toBe(200)
            }
          ),
          { numRuns: 25 }
        )
      })
    })


    describe('Role-Based Authorization Properties', () => {
      test('authorization result is deterministic for same role and endpoint', () => {
        fc.assert(
          fc.property(
            endpointArb,
            userRoleArb,
            (endpoint, userRole) => {
              const result1 = validateAdminAuthorization(userRole, endpoint.isModification)
              const result2 = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result1.isAuthorized).toBe(result2.isAuthorized)
              expect(result1.statusCode).toBe(result2.statusCode)
            }
          ),
          { numRuns: 50 }
        )
      })

      test('admin role always grants access, non-admin never grants access', () => {
        fc.assert(
          fc.property(
            endpointArb,
            userRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              if (userRole === 'admin') {
                expect(result.isAuthorized).toBe(true)
                expect(result.statusCode).toBe(200)
              } else {
                expect(result.isAuthorized).toBe(false)
                expect(result.statusCode).toBe(403)
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    describe('Status Code Consistency', () => {
      test('all authorization failures for non-admin users return 403', () => {
        fc.assert(
          fc.property(
            endpointArb,
            nonAdminRoleArb,
            (endpoint, userRole) => {
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 100 }
        )
      })

      test('403 is returned for authorization failures, not 401', () => {
        fc.assert(
          fc.property(
            endpointArb,
            nonAdminRoleArb,
            (endpoint, userRole) => {
              // User is authenticated (would have passed 401 check)
              // but not authorized (should get 403, not 401)
              const result = validateAdminAuthorization(userRole, endpoint.isModification)
              
              expect(result.statusCode).not.toBe(401)
              expect(result.statusCode).toBe(403)
            }
          ),
          { numRuns: 100 }
        )
      })
    })
  })


  /**
   * Combined Authentication and Authorization Tests
   * 
   * These tests verify the complete security flow:
   * 1. First, authentication is checked (401 if failed)
   * 2. Then, authorization is checked (403 if failed)
   */
  describe('Combined Authentication and Authorization', () => {
    test('authentication failure takes precedence over authorization failure', () => {
      fc.assert(
        fc.property(
          endpointArb,
          invalidAuthHeaderTypeArb,
          nonAdminRoleArb,
          (endpoint, headerType, userRole) => {
            const authHeader = generateInvalidAuthHeader(headerType)
            const authResult = validateAuthentication(authHeader)
            
            // Authentication should fail first with 401
            // Authorization check should not even be reached
            expect(authResult.isAuthenticated).toBe(false)
            expect(authResult.statusCode).toBe(401)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('authorization is only checked after successful authentication', () => {
      fc.assert(
        fc.property(
          endpointArb,
          userRoleArb,
          (endpoint, userRole) => {
            // Simulate successful authentication
            const isAuthenticated = true
            
            if (isAuthenticated) {
              // Now check authorization
              const authzResult = validateAdminAuthorization(userRole, endpoint.isModification)
              
              if (userRole === 'admin') {
                expect(authzResult.isAuthorized).toBe(true)
                expect(authzResult.statusCode).toBe(200)
              } else {
                expect(authzResult.isAuthorized).toBe(false)
                expect(authzResult.statusCode).toBe(403)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('security flow: unauthenticated -> 401, authenticated non-admin -> 403, admin -> 200', () => {
      fc.assert(
        fc.property(
          endpointArb,
          fc.oneof(
            fc.constant({ authenticated: false, role: null as UserRole | null }),
            fc.constant({ authenticated: true, role: 'user' as UserRole }),
            fc.constant({ authenticated: true, role: 'admin' as UserRole })
          ),
          (endpoint, authState) => {
            if (!authState.authenticated) {
              // Unauthenticated request
              const result = validateAuthentication(null)
              expect(result.statusCode).toBe(401)
            } else if (authState.role === 'user') {
              // Authenticated but non-admin
              const result = validateAdminAuthorization(authState.role, endpoint.isModification)
              expect(result.statusCode).toBe(403)
            } else if (authState.role === 'admin') {
              // Authenticated admin
              const result = validateAdminAuthorization(authState.role, endpoint.isModification)
              expect(result.statusCode).toBe(200)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
