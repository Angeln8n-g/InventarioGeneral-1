import { NextRequest, NextResponse } from 'next/server'
import { combinationOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/device-combinations/by-classroom/[classroomId]
 * Get all device combinations in a specific classroom
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classroomId: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { classroomId: classroomIdStr } = await params
      const classroomId = parseInt(classroomIdStr)

      if (isNaN(classroomId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'ID de aula inválido',
              timestamp: new Date().toISOString()
            }
          },
          { status: 400 }
        )
      }

      const combinations = await combinationOperations.getAll({
        classroom_id: classroomId
      })

      return NextResponse.json({
        success: true,
        data: combinations,
        count: combinations.length
      })
    })
  } catch (error: any) {
    console.error('Error fetching classroom combinations:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
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
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
