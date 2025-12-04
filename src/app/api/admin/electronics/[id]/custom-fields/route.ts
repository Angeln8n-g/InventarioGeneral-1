import { NextRequest, NextResponse } from 'next/server'
import { customFieldOperations } from '@/lib/db/customFieldOperations'
import { electronicDeviceOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/electronics/[id]/custom-fields
 * Get all custom fields for a device
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const deviceId = parseInt(id, 10)
      
      if (isNaN(deviceId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de dispositivo inválido',
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

      // Get custom fields for this device
      const customFields = await customFieldOperations.getByDevice(deviceId)

      return NextResponse.json({
        data: customFields,
        total: customFields.length,
        device_id: deviceId,
      })
    })
  } catch (error: unknown) {
    console.error('Custom fields fetch error:', error)

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
 * POST /api/admin/electronics/[id]/custom-fields
 * Create a new custom field value for a device
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const deviceId = parseInt(id, 10)
      
      if (isNaN(deviceId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de dispositivo inválido',
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
      
      // Validate required fields
      if (!body.field_id || typeof body.field_id !== 'number') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El ID del campo es requerido',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

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

      // Create or update the custom field value
      const customField = await customFieldOperations.upsert(
        deviceId,
        body.field_id,
        body.field_value
      )

      return NextResponse.json({
        data: customField,
        message: 'Campo personalizado guardado exitosamente',
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('Custom field creation error:', error)

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
