/**
 * User Permissions API Routes
 * 
 * GET    /api/admin/users/[id]/permissions - Get effective permissions for a user
 * PUT    /api/admin/users/[id]/permissions - Update user permission overrides
 * 
 * @see Requirements 3.1, 3.2, 3.3, 3.4
 * @see Design Document - API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { PermissionsService } from '@/services/permissions.service'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES } from '@/utils/constants'
import type { PermissionError } from '@/types/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Check if an error is a PermissionError
 */
function isPermissionError(error: unknown): error is PermissionError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

/**
 * Parse and validate user ID from params
 */
function parseUserId(id: string): number | null {
  const userId = parseInt(id, 10)
  return isNaN(userId) ? null : userId
}

/**
 * GET /api/admin/users/[id]/permissions
 * Get effective permissions for a user including:
 * - Role permissions (inherited)
 * - User overrides (granted and revoked)
 * - Effective permissions (calculated)
 * 
 * @see Requirements 3.1 - Show inherited and override permissions clearly differentiated
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async () => {
      const { id } = await params
      const userId = parseUserId(id)

      if (userId === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de usuario inválido',
            },
          },
          { status: 400 }
        )
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, full_name, role, role_id')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Usuario no encontrado',
            },
          },
          { status: 404 }
        )
      }

      // Get effective permissions for this user
      const effectivePermissions = await PermissionsService.getEffectivePermissions(userId)

      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          roleId: effectivePermissions.roleId,
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
    console.error('User permissions fetch error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
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

    if (error instanceof Error && error.name === 'AuthorizationError') {
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

/**
 * PUT /api/admin/users/[id]/permissions
 * Update user permission overrides
 * 
 * Request body:
 * {
 *   granted: string[],  // Permissions to grant (add to user)
 *   revoked: string[]   // Permissions to revoke (remove from user)
 * }
 * 
 * @see Requirements 3.2 - Add permission override to grant additional permissions
 * @see Requirements 3.3 - Revoke permission override to remove permissions
 * @see Requirements 3.4 - Persist changes and log to audit
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async (authContext) => {
      const { id } = await params
      const userId = parseUserId(id)

      if (userId === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de usuario inválido',
            },
          },
          { status: 400 }
        )
      }

      // Parse request body
      const body = await request.json()
      const { granted, revoked } = body

      // Validate granted array
      if (granted !== undefined && !Array.isArray(granted)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El campo granted debe ser un array',
            },
          },
          { status: 400 }
        )
      }

      // Validate revoked array
      if (revoked !== undefined && !Array.isArray(revoked)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El campo revoked debe ser un array',
            },
          },
          { status: 400 }
        )
      }

      // Validate all granted permissions are strings
      if (granted && !granted.every((p: unknown) => typeof p === 'string')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Todos los permisos en granted deben ser strings',
            },
          },
          { status: 400 }
        )
      }

      // Validate all revoked permissions are strings
      if (revoked && !revoked.every((p: unknown) => typeof p === 'string')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Todos los permisos en revoked deben ser strings',
            },
          },
          { status: 400 }
        )
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, username, email, full_name, role, role_id')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Usuario no encontrado',
            },
          },
          { status: 404 }
        )
      }

      // Self-protection: Prevent admin from removing their own ADMIN_MANAGE_PERMISSIONS
      // @see Requirements 7.4 - Prevent admin from removing their own permission management permission
      if (userId === authContext.user.id) {
        const revokedPermissions = revoked || []
        if (revokedPermissions.includes(PERMISSIONS.ADMIN_MANAGE_PERMISSIONS)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'SELF_PERMISSION_REMOVAL',
                message: 'No puedes quitarte el permiso de gestionar permisos a ti mismo',
              },
            },
            { status: 403 }
          )
        }
      }

      // Get current overrides for comparison
      const currentOverrides = await PermissionsService.getUserOverrides(userId)

      // Clear existing overrides first
      const { error: deleteError } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)

      if (deleteError) {
        throw new Error(`Failed to clear user overrides: ${deleteError.message}`)
      }

      // Insert new granted permissions
      const grantedPermissions = granted || []
      const revokedPermissions = revoked || []

      const permissionRows: { user_id: number; permission: string; is_granted: boolean }[] = []

      // Add granted permissions
      for (const permission of grantedPermissions) {
        permissionRows.push({
          user_id: userId,
          permission,
          is_granted: true,
        })
      }

      // Add revoked permissions
      for (const permission of revokedPermissions) {
        permissionRows.push({
          user_id: userId,
          permission,
          is_granted: false,
        })
      }

      // Insert all permission overrides
      if (permissionRows.length > 0) {
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert(permissionRows)

        if (insertError) {
          throw new Error(`Failed to set user overrides: ${insertError.message}`)
        }
      }

      // Log audit entry for the permission change
      // @see Requirements 3.4 - Persist changes and log to audit
      const addedGranted = grantedPermissions.filter((p: string) => !currentOverrides.granted.includes(p))
      const removedGranted = currentOverrides.granted.filter((p: string) => !grantedPermissions.includes(p))
      const addedRevoked = revokedPermissions.filter((p: string) => !currentOverrides.revoked.includes(p))
      const removedRevoked = currentOverrides.revoked.filter((p: string) => !revokedPermissions.includes(p))

      try {
        await supabase
          .from('permissions_audit')
          .insert({
            admin_user_id: authContext.user.id,
            action_type: 'user_permissions_changed',
            target_type: 'user',
            target_id: userId,
            target_name: user.username,
            changes: {
              before: {
                granted: currentOverrides.granted,
                revoked: currentOverrides.revoked,
              },
              after: {
                granted: grantedPermissions,
                revoked: revokedPermissions,
              },
              addedGranted,
              removedGranted,
              addedRevoked,
              removedRevoked,
            },
            ip_address: request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        null,
            user_agent: request.headers.get('user-agent') || null,
          })
      } catch (auditError) {
        // Log error but don't fail the operation
        console.error('Failed to log audit entry:', auditError)
      }

      // Invalidate user cache
      PermissionsService.invalidateUserCache(userId)

      // Get updated effective permissions to return
      const effectivePermissions = await PermissionsService.getEffectivePermissions(userId)

      return NextResponse.json({
        success: true,
        data: {
          userId: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          roleId: effectivePermissions.roleId,
          roleName: effectivePermissions.roleName,
          rolePermissions: effectivePermissions.rolePermissions,
          overrides: {
            granted: effectivePermissions.userGranted,
            revoked: effectivePermissions.userRevoked,
          },
          effectivePermissions: effectivePermissions.effective,
          message: 'Permisos de usuario actualizados exitosamente',
        },
      })
    })
  } catch (error: unknown) {
    console.error('User permissions update error:', error)

    // Handle PermissionError (validation errors from service)
    if (isPermissionError(error)) {
      const statusCode = error.code === 'SELF_PERMISSION_REMOVAL' ? 403 : 400
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: statusCode }
      )
    }

    if (error instanceof Error && error.name === 'AuthenticationError') {
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

    if (error instanceof Error && error.name === 'AuthorizationError') {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : 'Error al actualizar los permisos del usuario',
        },
      },
      { status: 500 }
    )
  }
}
