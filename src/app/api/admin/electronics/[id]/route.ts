import { NextRequest, NextResponse } from 'next/server'
import { electronicDeviceOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { validateElectronicDeviceInput } from '@/types/electronics'
import type { ToolInstance } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id } = await params
      const deviceId = parseInt(id, 10)

      if (isNaN(deviceId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid device ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get device details
      const device = await electronicDeviceOperations.getById(deviceId)

      if (!device) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Electronic device not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: device,
      })
    })
  } catch (error: unknown) {
    console.error('Electronic device fetch error:', error)

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id } = await params
      const deviceId = parseInt(id, 10)

      if (isNaN(deviceId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid device ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const body = await request.json()

      // Validate input (partial validation for updates)
      if (body.name || body.category) {
        const validation = validateElectronicDeviceInput({
          name: body.name || 'temp',
          category: body.category || 'Otros',
          ...body,
        })
        if (!validation.isValid) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Validation failed',
                details: validation.errors,
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
      }

      // Get current device state
      const currentDevice = await electronicDeviceOperations.getById(deviceId)

      if (!currentDevice) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Electronic device not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Update device
      const updatedDevice = await electronicDeviceOperations.update(deviceId, body)

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'electronic_device_update',
          entity_type: 'electronic_device',
          entity_id: deviceId,
          old_values: currentDevice as unknown as Record<string, unknown>,
          new_values: body,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        data: updatedDevice,
        message: 'Electronic device updated successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Electronic device update error:', error)

    if (error instanceof Error && error.message === 'Electronic device not found') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
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
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { id } = await params
      const deviceId = parseInt(id, 10)

      if (isNaN(deviceId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid device ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get current device state for audit
      const currentDevice = await electronicDeviceOperations.getById(deviceId)

      if (!currentDevice) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Electronic device not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Delete device (will check for active loans)
      try {
        await electronicDeviceOperations.delete(deviceId)
      } catch (deleteError) {
        if (deleteError instanceof Error && deleteError.message === 'Cannot delete device with active loan') {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'No se puede eliminar un dispositivo con préstamo activo',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
        throw deleteError
      }

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'electronic_device_delete',
          entity_type: 'electronic_device',
          entity_id: deviceId,
          old_values: currentDevice as unknown as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
      }

      return NextResponse.json({
        message: 'Electronic device deleted successfully',
      })
    })
  } catch (error: unknown) {
    console.error('Electronic device deletion error:', error)

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
