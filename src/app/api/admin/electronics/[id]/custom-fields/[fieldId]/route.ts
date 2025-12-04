import { NextRequest, NextResponse } from 'next/server'
import { customFieldOperations } from '@/lib/db/customFieldOperations'
import { electronicDeviceOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface RouteParams {
  params: Promise<{ id: string; fieldId: string }>
}

/**
 * PUT /api/admin/electronics/[id]/custom-fields/[fieldId]
 * Update a custom field value for a device
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id, fieldId } = await params
      const deviceId = parseInt(id, 10)
      const fieldIdNum = parseInt(fieldId, 10)
      
      if (isNaN(deviceId) || isNaN(fieldIdNum)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de dispositivo o campo inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Verify device exists
      const device = await electronicDeviceOperations.getById(deviceId)
      if (!device) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Dispositivo no encontrado',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      const body = await request.json()
      
      if (body.field_value === undefined) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El valor del campo es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Update or create the custom field value
      const customField = await customFieldOperations.upsert(
        deviceId,
        fieldIdNum,
        body.field_value
      )

      return NextResponse.json({
        data: customField,
        message: 'Campo personalizado actualizado exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('Custom field update error:', error)

    if (error instanceof Error && error.message.includes('Field not found')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Campo no encontrado',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
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
 * DELETE /api/admin/electronics/[id]/custom-fields/[fieldId]
 * Delete a custom field value for a device
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id, fieldId } = await params
      const deviceId = parseInt(id, 10)
      const fieldIdNum = parseInt(fieldId, 10)
      
      if (isNaN(deviceId) || isNaN(fieldIdNum)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de dispositivo o campo inválido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Verify device exists
      const device = await electronicDeviceOperations.getById(deviceId)
      if (!device) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Dispositivo no encontrado',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Get the custom field to delete
      const customField = await customFieldOperations.getByDeviceAndField(deviceId, fieldIdNum)
      if (!customField) {
        return NextResponse.json(
          {
            error: {
              code: 'NOT_FOUND',
              message: 'Campo personalizado no encontrado para este dispositivo',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Delete the custom field value
      await customFieldOperations.delete(customField.id)

      return NextResponse.json({
        message: 'Campo personalizado eliminado exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('Custom field delete error:', error)

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
