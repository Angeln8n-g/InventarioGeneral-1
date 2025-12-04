import { NextRequest, NextResponse } from 'next/server'
import { assignmentOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/device-assignments/by-classroom/[classroomId]
 * Get all device assignments for a specific classroom
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

      const { searchParams } = new URL(request.url)
      const status = searchParams.get('status') as 'active' | 'removed' | undefined

      const filters: {
        classroom_id: number
        status?: 'active' | 'removed'
      } = {
        classroom_id: classroomId
      }

      if (status) {
        filters.status = status
      }

      const assignments = await assignmentOperations.getAll(filters)

      return NextResponse.json({
        success: true,
        data: assignments,
        count: assignments.length
      })
    })
  } catch (error: any) {
    console.error('Error fetching classroom assignments:', error)
    
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

export const dynamic = 'force-dynamic'
