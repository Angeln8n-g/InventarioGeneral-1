import { NextRequest, NextResponse } from 'next/server'
import { combinationOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/device-combinations
 * List all device combinations with optional filters
 */
async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const { searchParams } = new URL(request.url)
      const classroomId = searchParams.get('classroom_id')

      const filters: {
        classroom_id?: number
      } = {}

      if (classroomId) {
        filters.classroom_id = parseInt(classroomId)
      }

      const combinations = await combinationOperations.getAll(filters)

      return NextResponse.json({
        success: true,
        data: combinations,
        count: combinations.length
      })
    })
  } catch (error: any) {
    console.error('Error fetching device combinations:', error)
    
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
 * POST /api/admin/device-combinations
 * Create a new device combination
 */
async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (authContext) => {
      const body = await request.json()
      const { device_1_id, device_2_id, combination_type, notes } = body

      // Validate required fields
      if (!device_1_id || !device_2_id) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Los IDs de ambos dispositivos son requeridos',
              details: {
                device_1_id: !device_1_id ? 'Campo requerido' : undefined,
                device_2_id: !device_2_id ? 'Campo requerido' : undefined
              },
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }

      // Validate devices are different
      if (device_1_id === device_2_id) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'No se puede combinar un dispositivo consigo mismo',
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }

      const combination = await combinationOperations.create(
        {
          device_1_id,
          device_2_id,
          combination_type,
          notes
        },
        authContext.user.id
      )

      return NextResponse.json(
        {
          success: true,
          data: combination,
          message: 'Dispositivos combinados exitosamente'
        },
        { status: 201 }
      )
    })
  } catch (error: any) {
    console.error('Error creating device combination:', error)

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
    if (error.message?.includes('different classrooms')) {
      return NextResponse.json(
        {
          error: {
            code: 'DIFFERENT_CLASSROOMS',
            message: 'Ambos dispositivos deben estar en la misma aula',
            timestamp: new Date().toISOString()
          }
        },
        { status: 409 }
      )
    }

    if (error.message?.includes('not assigned')) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_ASSIGNED',
            message: 'Ambos dispositivos deben estar asignados a un aula',
            timestamp: new Date().toISOString()
          }
        },
        { status: 409 }
      )
    }

    if (error.message?.includes('already combined')) {
      return NextResponse.json(
        {
          error: {
            code: 'ALREADY_COMBINED',
            message: 'Estos dispositivos ya están combinados',
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
            message: 'Uno o ambos dispositivos no existen',
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

export const dynamic = 'force-dynamic'
