import { NextRequest, NextResponse } from 'next/server'
import { assignmentOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/device-assignments
 * List all device assignments with optional filters
 */
async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { searchParams } = new URL(request.url)
      const classroomId = searchParams.get('classroom_id')
      const deviceId = searchParams.get('electronic_device_id')
      const status = searchParams.get('status') as 'active' | 'removed' | undefined

      const filters: {
        classroom_id?: number
        electronic_device_id?: number
        status?: 'active' | 'removed'
      } = {}

      if (classroomId) filters.classroom_id = parseInt(classroomId)
      if (deviceId) filters.electronic_device_id = parseInt(deviceId)
      if (status) filters.status = status

      const assignments = await assignmentOperations.getAll(filters)

      return NextResponse.json({
        success: true,
        data: assignments,
        count: assignments.length
      })
    })
  } catch (error: any) {
    console.error('Error fetching device assignments:', error)
    
    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        },
        { status: 401 }
      )
    }

    if (error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/device-assignments
 * Create a new device assignment
 */
async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const body = await request.json()
      const { electronic_device_id, classroom_id, notes } = body

      // Validate required fields
      if (!electronic_device_id || !classroom_id) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'El ID del dispositivo y el ID del aula son requeridos',
              details: {
                electronic_device_id: !electronic_device_id ? 'Campo requerido' : undefined,
                classroom_id: !classroom_id ? 'Campo requerido' : undefined
              },
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }

      const assignment = await assignmentOperations.create(
        {
          electronic_device_id,
          classroom_id,
          notes
        },
        authContext.user.id
      )

      return NextResponse.json(
        {
          success: true,
          data: assignment,
          message: 'Dispositivo asignado exitosamente'
        },
        { status: 201 }
      )
    })
  } catch (error: any) {
    console.error('Error creating device assignment:', error)

    if (error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        },
        { status: 401 }
      )
    }

    if (error.name === 'AuthorizationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString()
          }
        },
        { status: 403 }
      )
    }

    // Handle specific error cases
    if (error.message?.includes('already assigned')) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_ASSIGNED',
            message: 'El dispositivo ya está asignado a un aula',
            timestamp: new Date().toISOString()
          }
        },
        { status: 409 }
      )
    }

    if (error.message?.includes('not found')) {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'El dispositivo o el aula no existe',
            timestamp: new Date().toISOString()
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: ERROR_CODES.DATABASE_ERROR,
          message: ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export { GET, POST }

// Apply permission middleware
export const dynamic = 'force-dynamic'
