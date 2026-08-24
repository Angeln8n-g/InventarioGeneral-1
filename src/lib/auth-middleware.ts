import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from './supabase-admin'
import { userOperations } from './supabase-client'
import { hasPermission, requirePermission, type Permission } from './permissions'

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev_jwt_secret_key' : '')

export interface AuthenticatedUser {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  auth_id?: string
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
  let token: string | null = null

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    // Check cookies as fallback
    token =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('auth-token')?.value ||
      request.cookies.get('token')?.value ||
      null
  }

  if (!token) {
    throw new AuthenticationError('No token provided')
  }

  // 1. Attempt fast local JWT verification first (0ms latency, works offline)
  if (JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId?: number; id?: number }
      const userId = decoded.userId || decoded.id
      if (userId) {
        const user = await userOperations.getById(userId)
        if (user) {
          return {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: (user.role as 'user' | 'admin') || 'user',
              auth_id: user.auth_id || undefined,
            },
            token,
          }
        }
      }
    } catch (_jwtError) {
      // Token is not a local JWT or expired locally; attempt Supabase Auth next
    }
  }

  // 2. Attempt verification via Supabase Auth (with safe error handling)
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (!authError && authData?.user) {
      const authUser = authData.user

      // Find user in public.users by auth_id or email
      let publicUser = null
      const { data: userByAuthId } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (userByAuthId) {
        publicUser = userByAuthId
      } else if (authUser.email) {
        const { data: userByEmail } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle()
        publicUser = userByEmail

        // Link auth_id if found
        if (publicUser && !publicUser.auth_id) {
          await supabaseAdmin
            .from('users')
            .update({ auth_id: authUser.id })
            .eq('id', publicUser.id)
        }
      }

      if (publicUser) {
        return {
          user: {
            id: publicUser.id,
            username: publicUser.username,
            email: publicUser.email,
            role: (publicUser.role as 'user' | 'admin') || 'user',
            auth_id: authUser.id,
          },
          token,
        }
      }
    }
  } catch (supabaseError: unknown) {
    console.warn('Supabase Auth verification skipped/failed:', supabaseError instanceof Error ? supabaseError.message : supabaseError)
  }

  throw new AuthenticationError('Invalid or expired token')
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

  if (authContext.user.role === 'admin') {
    return handler(authContext)
  }

  if (authContext.user.id !== resourceUserId) {
    throw new AuthorizationError('Can only access own resources')
  }

  return handler(authContext)
}