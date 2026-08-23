import { NextRequest, NextResponse } from 'next/server'
import { scheduledEvaluationOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { EvaluationStatus, ScheduledEvaluationWithDetails, SpaceType } from '@/types/evaluations'

/**
 * Calendar event representation for the frontend
 * Includes all necessary information for calendar display
 */
interface CalendarEvent {
  id: number
  classroom_id: number
  classroom_name: string
  classroom_location: string
  responsible_person?: string
  template_id: number
  template_name: string
  space_type: SpaceType
  scheduled_date: string
  status: EvaluationStatus
  created_at: string
  updated_at: string
}

/**
 * Transforms a scheduled evaluation into a calendar event
 * @param evaluation - The scheduled evaluation with details
 * @returns Calendar event for frontend display
 */
function transformToCalendarEvent(evaluation: ScheduledEvaluationWithDetails): CalendarEvent {
  return {
    id: evaluation.id,
    classroom_id: evaluation.classroom_id,
    classroom_name: evaluation.classroom?.name || 'Unknown',
    classroom_location: evaluation.classroom?.location || '',
    responsible_person: evaluation.classroom?.responsible_person,
    template_id: evaluation.template_id,
    template_name: evaluation.template?.name || 'Unknown',
    space_type: evaluation.template?.space_type || 'training_room',
    scheduled_date: evaluation.scheduled_date,
    status: evaluation.status,
    created_at: evaluation.created_at,
    updated_at: evaluation.updated_at,
  }
}

/**
 * Validates date string format
 * @param dateStr - The date string to validate
 * @returns true if valid ISO date string
 */
function isValidDateString(dateStr: string): boolean {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

/**
 * GET /api/admin/evaluations/calendar
 * Retrieves evaluations for calendar display within a date range
 * Requires admin role
 *
 * Query parameters:
 * - start_date: Start of date range (required, ISO string)
 * - end_date: End of date range (required, ISO string)
 * - space_type: Filter by space type (optional: training_room, warehouse, external_plant)
 * - status: Filter by evaluation status (optional: pending, completed, overdue, cancelled)
 *
 * Features:
 * - Automatically marks pending evaluations as overdue if scheduled_date has passed
 * - Includes classroom and template information for display
 * - Returns events formatted for calendar component
 *
 * @returns Array of calendar events with evaluation details
 * Validates: Requirements 1.1, 1.4, 1.6
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { searchParams } = new URL(request.url)

      // Parse required query parameters
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      // Validate required date range parameters
      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Los parámetros start_date y end_date son requeridos',
              details: ['start_date and end_date query parameters are required'],
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate date format
      if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Formato de fecha inválido. Use formato ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss)',
              details: ['start_date and end_date must be valid ISO date strings'],
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Validate date range (start should be before or equal to end)
      if (new Date(startDate) > new Date(endDate)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin',
              details: ['start_date must be before or equal to end_date'],
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Parse optional filter parameters
      const spaceType = searchParams.get('space_type') as SpaceType | null
      const status = searchParams.get('status') as EvaluationStatus | null

      // Validate space_type if provided
      if (spaceType) {
        const validSpaceTypes: SpaceType[] = ['training_room', 'warehouse', 'external_plant']
        if (!validSpaceTypes.includes(spaceType)) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Tipo de espacio inválido. Use: training_room, warehouse, o external_plant',
                details: ['space_type must be one of: training_room, warehouse, external_plant'],
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
      }

      // Validate status if provided
      if (status) {
        const validStatuses: EvaluationStatus[] = ['pending', 'completed', 'overdue', 'cancelled']
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'Estado inválido. Use: pending, completed, overdue, o cancelled',
                details: ['status must be one of: pending, completed, overdue, cancelled'],
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }
      }

      // Fetch evaluations by date range
      // The getByDateRange method automatically marks overdue evaluations (Requirement 1.6)
      let evaluations = await scheduledEvaluationOperations.getByDateRange(startDate, endDate)

      // Apply optional filters
      if (spaceType) {
        evaluations = evaluations.filter(
          (e) => e.template?.space_type === spaceType
        )
      }

      if (status) {
        evaluations = evaluations.filter((e) => e.status === status)
      }

      // Transform to calendar events
      const calendarEvents = evaluations.map(transformToCalendarEvent)

      // Group events by status for summary
      const summary = {
        total: calendarEvents.length,
        pending: calendarEvents.filter((e) => e.status === 'pending').length,
        completed: calendarEvents.filter((e) => e.status === 'completed').length,
        overdue: calendarEvents.filter((e) => e.status === 'overdue').length,
        cancelled: calendarEvents.filter((e) => e.status === 'cancelled').length,
      }

      return NextResponse.json({
        data: calendarEvents,
        summary,
        filters: {
          start_date: startDate,
          end_date: endDate,
          space_type: spaceType,
          status,
        },
      })
    })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        console.warn('[Calendar API] Authentication expired or invalid token')
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

      if (error.name === 'AuthorizationError') {
        console.warn('[Calendar API] Access denied: insufficient permissions')
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
    }

    console.error('[Calendar API] GET error:', error)

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
