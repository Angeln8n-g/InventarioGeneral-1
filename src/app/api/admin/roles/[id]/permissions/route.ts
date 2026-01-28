/**
 * Role Permissions API Routes
 * 
 * GET    /api/admin/roles/[id]/permissions - Get permissions for a role
 * PUT    /api/admin/roles/[id]/permissions - Update permissions for a role
 * 
 * @see Requirements 2.1, 2.2, 2.3
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
 * GET /api/admin/roles/[id]/permissions
 * Get all permissions assigned to a role
 * 
 * @see Requirements 2.1 - Show permission matrix with all available permissions
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

      // Check if role exists
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

      return NextResponse.json({
        success: true,
        data: {
          roleId: role.id,
          roleName: role.name,
          permissions,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Role permissions fetch error:', error)

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
          message: 'Error al obtener los permisos del rol',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/roles/[id]/permissions
 * Update all permissions for a role (replaces existing permissions)
 * 
 * @see Requirements 2.2 - Update role permissions in real-time
 * @see Requirements 2.3 - Persist changes and log to audit
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

      // Parse request body
      const body = await request.json()
      const { permissions } = body

      // Validate permissions array
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El campo permissions debe ser un array',
            },
          },
          { status: 400 }
        )
      }

      // Validate all permissions are strings
      if (!permissions.every((p: unknown) => typeof p === 'string')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Todos los permisos deben ser strings',
            },
          },
          { status: 400 }
        )
      }

      // Check if role exists
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

      // Check for critical permissions protection on admin role
      // @see Requirements 2.4 - Prevent removing critical permissions from admin role
      if (role.name === 'admin') {
        const criticalPermissions = [
          PERMISSIONS.SYSTEM_CONFIGURE,
          PERMISSIONS.USERS_MANAGE,
          PERMISSIONS.ADMIN_MANAGE_PERMISSIONS,
        ]

        const missingCritical = criticalPermissions.filter(
          (p) => !permissions.includes(p)
        )

        if (missingCritical.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CRITICAL_PERMISSION',
                message: `No se pueden quitar permisos críticos del rol admin: ${missingCritical.join(', ')}`,
              },
            },
            { status: 403 }
          )
        }
      }

      // Update role permissions
      await PermissionsService.setRolePermissions(
        roleId,
        permissions,
        authContext.user.id
      )

      // Get updated permissions to return
      const updatedPermissions = await PermissionsService.getRolePermissions(roleId)

      return NextResponse.json({
        success: true,
        data: {
          roleId: role.id,
          roleName: role.name,
          permissions: updatedPermissions,
          message: 'Permisos actualizados exitosamente',
        },
      })
    })
  } catch (error: unknown) {
    console.error('Role permissions update error:', error)

    // Handle PermissionError (validation errors from service)
    if (isPermissionError(error)) {
      const statusCode = error.code === 'CRITICAL_PERMISSION' ? 403 : 400
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
          message: error instanceof Error ? error.message : 'Error al actualizar los permisos del rol',
        },
      },
      { status: 500 }
    )
  }
}
