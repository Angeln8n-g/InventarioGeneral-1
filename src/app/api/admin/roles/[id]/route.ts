/**
 * Individual Role API Routes
 * 
 * GET    /api/admin/roles/[id] - Get a role by ID
 * PUT    /api/admin/roles/[id] - Update a role
 * DELETE /api/admin/roles/[id] - Delete a role
 * 
 * @see Requirements 1.4, 1.6, 1.7, 1.8
 * @see Design Document - API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { RolesService } from '@/services/roles.service'
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
 * Parse and validate role ID from params
 */
function parseRoleId(id: string): number | null {
  const roleId = parseInt(id, 10)
  return isNaN(roleId) ? null : roleId
}

/**
 * GET /api/admin/roles/[id]
 * Get a single role by ID with permissions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async () => {
      const { id } = await params
      const roleId = parseRoleId(id)

      if (roleId === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de rol inválido',
            },
          },
          { status: 400 }
        )
      }

      const role = await RolesService.getRoleById(roleId)

      if (!role) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Rol no encontrado',
            },
          },
          { status: 404 }
        )
      }

      // Get permissions for this role
      const permissions = await PermissionsService.getRolePermissions(roleId)

      // Get user count
      const users = await RolesService.getUsersByRole(roleId)

      return NextResponse.json({
        success: true,
        data: {
          ...role,
          permissions,
          userCount: users.length,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Role fetch error:', error)

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
          message: 'Error al obtener el rol',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/roles/[id]
 * Update a role's name and/or description
 * 
 * @see Requirements 1.4 - Edit role name/description while preserving permissions and users
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async (authContext) => {
      const { id } = await params
      const roleId = parseRoleId(id)

      if (roleId === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de rol inválido',
            },
          },
          { status: 400 }
        )
      }

      const body = await request.json()

      // Check if role exists
      const existingRole = await RolesService.getRoleById(roleId)
      if (!existingRole) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Rol no encontrado',
            },
          },
          { status: 404 }
        )
      }

      // Update the role
      const updatedRole = await RolesService.updateRole(
        roleId,
        {
          name: body.name,
          description: body.description,
        },
        authContext.user.id
      )

      return NextResponse.json({
        success: true,
        data: updatedRole,
      })
    })
  } catch (error: unknown) {
    console.error('Role update error:', error)

    // Handle PermissionError (validation errors from service)
    if (isPermissionError(error)) {
      const statusCode = error.code === 'ROLE_NAME_EXISTS' ? 409 : 400
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
          message: error instanceof Error ? error.message : 'Error al actualizar el rol',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/roles/[id]
 * Delete a role
 * 
 * @see Requirements 1.5 - Show confirmation with affected users
 * @see Requirements 1.6 - Reassign users to "user" role when deleting
 * @see Requirements 1.7, 1.8 - Reject deletion of protected roles (admin, user)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async (authContext) => {
      const { id } = await params
      const roleId = parseRoleId(id)

      if (roleId === null) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de rol inválido',
            },
          },
          { status: 400 }
        )
      }

      // Check if role exists
      const existingRole = await RolesService.getRoleById(roleId)
      if (!existingRole) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Rol no encontrado',
            },
          },
          { status: 404 }
        )
      }

      // Check if role can be deleted (protected roles check)
      const canDelete = await RolesService.canDeleteRole(roleId)
      if (!canDelete.canDelete) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROTECTED_ROLE',
              message: canDelete.reason || 'No se puede eliminar este rol',
            },
          },
          { status: 403 }
        )
      }

      // Delete the role (will reassign users to "user" role)
      await RolesService.deleteRole(roleId, authContext.user.id)

      return NextResponse.json({
        success: true,
        data: {
          message: 'Rol eliminado exitosamente',
          affectedUsers: canDelete.affectedUsers || 0,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Role delete error:', error)

    // Handle PermissionError (protected role errors from service)
    if (isPermissionError(error)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: 403 }
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
          message: error instanceof Error ? error.message : 'Error al eliminar el rol',
        },
      },
      { status: 500 }
    )
  }
}
