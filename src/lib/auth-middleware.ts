import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { userOperations } from './supabase-client'
import { hasPermission, requirePermission, type Permission } from './permissions'

const JWT_SECRET = process.env.JWT_SECRET as string

if (!JWT_SECRET) {
  throw new Error(
    '🔒 SECURITY ERROR: JWT_SECRET environment variable is required!\n' +
    'Generate a secure secret with: openssl rand -base64 32\n' +
    'Add it to your .env file: JWT_SECRET=your_generated_secret'
  )
}

export interface AuthenticatedUser {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
}

export interface AuthContext {
  user: AuthenticatedUser
  token: string
}

export class AuthenticationError extends Error {
  constructor(message: string, public code: string = 'AUTHENTICATION_ERROR') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code: string = 'AUTHORIZATION_ERROR') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export async function authenticateRequest(request: NextRequest): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided')
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number }

    // Get current user data to ensure user still exists and has correct permissions
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
        throw new AuthenticationError('Token expired')
      }
    }
    throw error
  }
}

export function requireAdmin(authContext: AuthContext): void {
  if (authContext.user.role !== 'admin') {
    throw new AuthorizationError('Admin access required')
  }
}

export function requireUserOrAdmin(authContext: AuthContext, userId: number): void {
  if (authContext.user.role !== 'admin' && authContext.user.id !== userId) {
    throw new AuthorizationError('Access denied')
  }
}

export async function withAuth<T>(
  request: NextRequest,
  handler: (authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await authenticateRequest(request)
  return handler(authContext)
}

export async function withAdminAuth<T>(
  request: NextRequest,
  handler: (authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await authenticateRequest(request)
  requireAdmin(authContext)
  return handler(authContext)
}

export async function withUserAuth<T>(
  request: NextRequest,
  userId: number,
  handler: (authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await authenticateRequest(request)
  requireUserOrAdmin(authContext, userId)
  return handler(authContext)
}

// Permission-based authentication wrappers
export async function withPermission<T>(
  request: NextRequest,
  permission: Permission,
  handler: (authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await authenticateRequest(request)
  requirePermission(authContext.user, permission)
  return handler(authContext)
}

export async function withAnyPermission<T>(
  request: NextRequest,
  permissions: Permission[],
  handler: (authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await authenticateRequest(request)

  const hasAnyPermission = permissions.some(permission =>
    hasPermission(authContext.user, permission)
  )

  if (!hasAnyPermission) {
    throw new AuthorizationError(`Requires one of: ${permissions.join(', ')}`)
  }

  return handler(authContext)
}

export async function withResourceOwnership<T>(
  request: NextRequest,
  resourceUserId: number,
  handler: (authContext: AuthContext) => Promise<T>
): Promise<T> {
  const authContext = await authenticateRequest(request)

  // Admins can access any resource
  if (authContext.user.role === 'admin') {
    return handler(authContext)
  }

  // Users can only access their own resources
  if (authContext.user.id !== resourceUserId) {
    throw new AuthorizationError('Can only access own resources')
  }

  return handler(authContext)
}