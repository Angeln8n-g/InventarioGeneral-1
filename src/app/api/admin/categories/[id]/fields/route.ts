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
 * GET /api/admin/categories/[id]/fields
 * List all fields for a category
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

      // Verify category exists
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

      // Get fields for this category
      const fields = await fieldOperations.getByCategory(categoryId)

      return NextResponse.json({
        data: fields,
        total: fields.length,
        category: {
          id: category.id,
          name: category.name,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Fields fetch error:', error)

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
 * POST /api/admin/categories/[id]/fields
 * Create a new field for a category
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

      // Verify category exists
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

      const body = await request.json()
      
      // Validate required fields
      if (!body.field_name || typeof body.field_name !== 'string') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El nombre del campo es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const validTypes = ['text', 'number', 'select', 'boolean']
      if (!body.field_type || !validTypes.includes(body.field_type)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El tipo de campo debe ser: text, number, select, o boolean',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Create the field
      const field = await fieldOperations.create({
        category_id: categoryId,
        field_name: body.field_name.trim(),
        field_type: body.field_type,
        is_required: body.is_required ?? false,
        is_custom: body.is_custom ?? true,
        display_order: body.display_order ?? 0,
        options: body.options,
        validation_rules: body.validation_rules,
      })

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'field_create',
          entity_type: 'category_field',
          entity_id: field.id,
          new_values: {
            category_id: categoryId,
            field_name: field.field_name,
            field_type: field.field_type,
            is_required: field.is_required,
            is_custom: field.is_custom,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: field,
        message: 'Campo creado exitosamente',
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('Field creation error:', error)

    // Handle duplicate field name error
    if (error instanceof Error && error.message.includes('Ya existe un campo')) {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_FIELD_NAME',
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
