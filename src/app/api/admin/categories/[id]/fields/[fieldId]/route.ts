import { NextRequest, NextResponse } from 'next/server'
import { categoryOperations } from '@/lib/db/categoryOperations'
import { fieldOperations } from '@/lib/db/fieldOperations'
import { auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface RouteParams {
  params: Promise<{ id: string; fieldId: string }>
}

/**
 * PUT /api/admin/categories/[id]/fields/[fieldId]
 * Update a field configuration
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id, fieldId } = await params
      const categoryId = parseInt(id, 10)
      const fieldIdNum = parseInt(fieldId, 10)
      
      if (isNaN(categoryId) || isNaN(fieldIdNum)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de categoría o campo inválido',
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

      // Get current field
      const currentField = await fieldOperations.getById(fieldIdNum)
      if (!currentField || currentField.category_id !== categoryId) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Campo no encontrado en esta categoría',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      const body = await request.json()

      // Validate field_type if provided
      if (body.field_type) {
        const validTypes = ['text', 'number', 'select', 'boolean']
        if (!validTypes.includes(body.field_type)) {
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
      }

      // Update the field
      const updatedField = await fieldOperations.update(fieldIdNum, {
        field_name: body.field_name?.trim(),
        field_type: body.field_type,
        is_required: body.is_required,
        display_order: body.display_order,
        options: body.options,
        validation_rules: body.validation_rules,
      })

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'field_update',
          entity_type: 'category_field',
          entity_id: fieldIdNum,
          old_values: {
            field_name: currentField.field_name,
            field_type: currentField.field_type,
            is_required: currentField.is_required,
            display_order: currentField.display_order,
          },
          new_values: {
            field_name: updatedField.field_name,
            field_type: updatedField.field_type,
            is_required: updatedField.is_required,
            display_order: updatedField.display_order,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedField,
        message: 'Campo actualizado exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('Field update error:', error)

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

/**
 * DELETE /api/admin/categories/[id]/fields/[fieldId]
 * Delete a field configuration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id, fieldId } = await params
      const categoryId = parseInt(id, 10)
      const fieldIdNum = parseInt(fieldId, 10)
      
      if (isNaN(categoryId) || isNaN(fieldIdNum)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de categoría o campo inválido',
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

      // Get current field
      const currentField = await fieldOperations.getById(fieldIdNum)
      if (!currentField || currentField.category_id !== categoryId) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Campo no encontrado en esta categoría',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Delete the field (will throw if in use)
      await fieldOperations.delete(fieldIdNum)

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'field_delete',
          entity_type: 'category_field',
          entity_id: fieldIdNum,
          old_values: {
            category_id: categoryId,
            field_name: currentField.field_name,
            field_type: currentField.field_type,
            is_required: currentField.is_required,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        message: 'Campo eliminado exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('Field delete error:', error)

    // Handle field in use error
    if (error instanceof Error && error.message.includes('Cannot delete field')) {
      return NextResponse.json(
        {
          error: {
            code: 'FIELD_IN_USE',
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
