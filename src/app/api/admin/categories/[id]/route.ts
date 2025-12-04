import { NextRequest, NextResponse } from 'next/server'
import { categoryOperations } from '@/lib/db/categoryOperations'
import { fieldOperations } from '@/lib/db/fieldOperations'
import { auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/categories/[id]
 * Get a single category by ID with field configurations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const categoryId = parseInt(id, 10)
      
      if (isNaN(categoryId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de categoría inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const category = await categoryOperations.getById(categoryId)
      
      if (!category) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Categoría no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Get field configurations for this category
      const fields = await fieldOperations.getByCategory(categoryId)
      
      // Get device count
      const deviceCount = await categoryOperations.getDeviceCount(categoryId)

      return NextResponse.json({
        data: {
          ...category,
          fields,
          device_count: deviceCount,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Category fetch error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/categories/[id]
 * Update a category
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id } = await params
      const categoryId = parseInt(id, 10)
      
      if (isNaN(categoryId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de categoría inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const body = await request.json()
      
      // Get current category for audit log
      const currentCategory = await categoryOperations.getById(categoryId)
      if (!currentCategory) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Categoría no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Update the category
      const updatedCategory = await categoryOperations.update(categoryId, {
        name: body.name?.trim(),
        description: body.description?.trim(),
        icon: body.icon?.trim(),
        is_active: body.is_active,
      })

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'category_update',
          entity_type: 'device_category',
          entity_id: categoryId,
          old_values: {
            name: currentCategory.name,
            description: currentCategory.description,
            icon: currentCategory.icon,
            is_active: currentCategory.is_active,
          },
          new_values: {
            name: updatedCategory.name,
            description: updatedCategory.description,
            icon: updatedCategory.icon,
            is_active: updatedCategory.is_active,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedCategory,
        message: 'Categoría actualizada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('Category update error:', error)

    // Handle duplicate name error
    if (error instanceof Error && error.message.includes('Ya existe una categoría')) {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_NAME',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      )
    }

    // Handle optimistic locking error
    if (error instanceof Error && error.message.includes('modified by another user')) {
      return NextResponse.json(
        {
          error: {
            code: 'CONFLICT',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      )
    }

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id } = await params
      const categoryId = parseInt(id, 10)
      
      if (isNaN(categoryId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de categoría inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get current category for audit log
      const currentCategory = await categoryOperations.getById(categoryId)
      if (!currentCategory) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Categoría no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Delete the category (will throw if devices exist)
      await categoryOperations.delete(categoryId)

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'category_delete',
          entity_type: 'device_category',
          entity_id: categoryId,
          old_values: {
            name: currentCategory.name,
            description: currentCategory.description,
            icon: currentCategory.icon,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        message: 'Categoría eliminada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('Category delete error:', error)

    // Handle category in use error
    if (error instanceof Error && error.message.includes('Cannot delete category')) {
      return NextResponse.json(
        {
          error: {
            code: 'CATEGORY_IN_USE',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 409 }
      )
    }

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
