/**
 * Roles API Routes
 * 
 * GET  /api/admin/roles - List all roles
 * POST /api/admin/roles - Create a new role
 * 
 * @see Requirements 1.1, 1.2
 * @see Design Document - API Routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { RolesService } from '@/services/roles.service'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES } from '@/utils/constants'
import type { PermissionError } from '@/types/permissions'

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
 * GET /api/admin/roles
 * List all roles with user counts
 * 
 * @see Requirements 1.1 - Show list of roles with name, description, user count
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async () => {
      const roles = await RolesService.getAllRoles()

      return NextResponse.json({
        success: true,
        data: roles,
      })
    })
  } catch (error: unknown) {
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

    console.error('Roles fetch error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: 'Error al obtener los roles',
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/roles
 * Create a new role
 * 
 * @see Requirements 1.2 - Create role with valid name and description
 * @see Requirements 1.3 - Reject duplicate role names
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_PERMISSIONS, async (authContext) => {
      const body = await request.json()

      // Validate required fields
      if (!body.name || typeof body.name !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ROLE_NAME_REQUIRED',
              message: 'El nombre del rol es requerido',
            },
          },
          { status: 400 }
        )
      }

      // Create the role
      const role = await RolesService.createRole(
        {
          name: body.name,
          description: body.description,
          permissions: body.permissions,
        },
        authContext.user.id
      )

      return NextResponse.json(
        {
          success: true,
          data: role,
        },
        { status: 201 }
      )
    })
  } catch (error: unknown) {
    console.error('Role creation error:', error)

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
          message: error instanceof Error ? error.message : 'Error al crear el rol',
        },
      },
      { status: 500 }
    )
  }
}
