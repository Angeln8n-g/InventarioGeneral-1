/**
 * Current User Permissions API Route
 * 
 * GET /api/permissions/effective - Get effective permissions for the authenticated user
 * 
 * This endpoint allows any authenticated user to retrieve their own permissions.
 * No special permission is required - just authentication.
 * 
 * @see Requirements 9.4 - Load all effective permissions in a single query on login
 * @see Design Document - API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { PermissionsService } from '@/services/permissions.service'
import { withAuth, AuthenticationError, AuthorizationError } from '@/lib/auth-middleware'
import { ERROR_CODES } from '@/utils/constants'

/**
 * GET /api/permissions/effective
 * Get effective permissions for the currently authenticated user
 * 
 * Response includes:
 * - User's effective permissions (calculated)
 * - Role permissions (inherited from role)
 * - User overrides (granted and revoked)
 * - Role name
 * 
 * Response format:
 * Success: { success: true, data: { ... } }
 * Error: { success: false, error: { code: string, message: string } }
 * 
 * @see Requirements 9.4 - Load all effective permissions in a single query
 */
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const userId = authContext.user.id

      // Get effective permissions for the authenticated user
      const effectivePermissions = await PermissionsService.getEffectivePermissions(userId)

      return NextResponse.json({
        success: true,
        data: {
          userId,
          roleName: effectivePermissions.roleName,
          rolePermissions: effectivePermissions.rolePermissions,
          overrides: {
            granted: effectivePermissions.userGranted,
            revoked: effectivePermissions.userRevoked,
          },
          effectivePermissions: effectivePermissions.effective,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Current user permissions fetch error:', error)

    // Handle authentication errors (401)
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
          },
        },
        { status: 401 }
      )
    }

    // Handle authorization errors (403)
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
          },
        },
        { status: 403 }
      )
    }

    // Handle generic errors (500)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Error al obtener los permisos del usuario',
        },
      },
      { status: 500 }
    )
  }
}
