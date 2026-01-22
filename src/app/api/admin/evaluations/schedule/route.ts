import { NextRequest, NextResponse } from 'next/server'
import { scheduledEvaluationOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { CreateScheduledEvaluationInput, EvaluationStatus } from '@/types/evaluations'

/**
 * Validates the input for creating a new scheduled evaluation
 * @param body - The request body to validate
 * @returns Validation result with isValid flag and errors array
 */
function validateCreateScheduledEvaluationInput(body: unknown): {
  isValid: boolean
  errors: string[]
  data?: CreateScheduledEvaluationInput
} {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] }
  }

  const input = body as Record<string, unknown>

  // Validate classroom_id
  if (!input.classroom_id || typeof input.classroom_id !== 'number') {
    errors.push('classroom_id is required and must be a number')
  }

  // Validate template_id
  if (!input.template_id || typeof input.template_id !== 'number') {
    errors.push('template_id is required and must be a number')
  }

  // Validate scheduled_date
  if (!input.scheduled_date || typeof input.scheduled_date !== 'string') {
    errors.push('scheduled_date is required and must be a string')
  } else {
    // Validate date format
    const date = new Date(input.scheduled_date)
    if (isNaN(date.getTime())) {
      errors.push('scheduled_date must be a valid ISO date string')
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  return {
    isValid: true,
    errors: [],
    data: {
      classroom_id: input.classroom_id as number,
      template_id: input.template_id as number,
      scheduled_date: input.scheduled_date as string,
    },
  }
}

/**
 * GET /api/admin/evaluations/schedule
 * Lists scheduled evaluations with optional filters
 * Requires admin role
 *
 * Query parameters:
 * - status: Filter by evaluation status (pending, completed, overdue, cancelled)
 * - classroom_id: Filter by classroom ID
 * - start_date: Filter by start date (ISO string)
 * - end_date: Filter by end date (ISO string)
 *
 * @returns Array of scheduled evaluations with classroom and template details
 * Validates: Requirements 1.2, 1.3
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { searchParams } = new URL(request.url)

      // Parse query parameters
      const status = searchParams.get('status') as EvaluationStatus | null
      const classroomIdParam = searchParams.get('classroom_id')
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      const classroomId = classroomIdParam ? parseInt(classroomIdParam, 10) : undefined

      // Build filters
      const filters: {
        status?: EvaluationStatus
        classroom_id?: number
      } = {}

      if (status) {
        const validStatuses: EvaluationStatus[] = ['pending', 'completed', 'overdue', 'cancelled']
        if (validStatuses.includes(status)) {
          filters.status = status
        }
      }

      if (classroomId && !isNaN(classroomId)) {
        filters.classroom_id = classroomId
      }

      let evaluations

      // If date range is provided, use getByDateRange
      if (startDate && endDate) {
        evaluations = await scheduledEvaluationOperations.getByDateRange(startDate, endDate)

        // Apply additional filters if provided
        if (filters.status) {
          evaluations = evaluations.filter((e) => e.status === filters.status)
        }
        if (filters.classroom_id) {
          evaluations = evaluations.filter((e) => e.classroom_id === filters.classroom_id)
        }
      } else {
        // Use getAll with filters
        evaluations = await scheduledEvaluationOperations.getAll(filters)
      }

      return NextResponse.json({
        data: evaluations,
        total: evaluations.length,
      })
    })
  } catch (error: unknown) {
    console.error('[Scheduled Evaluations API] GET error:', error)

    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
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
 * POST /api/admin/evaluations/schedule
 * Creates a new scheduled evaluation
 * Requires admin role
 *
 * @body CreateScheduledEvaluationInput - Scheduled evaluation data
 *   - classroom_id: ID of the classroom to evaluate (required)
 *   - template_id: ID of the evaluation template to use (required)
 *   - scheduled_date: Date and time for the evaluation (required, ISO string)
 *
 * @returns Created scheduled evaluation
 * Validates: Requirements 1.2, 1.3
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      console.log('[Scheduled Evaluations API] POST request received')

      const body = await request.json()
      console.log('[Scheduled Evaluations API] Request body:', JSON.stringify(body, null, 2))

      // Validate input
      const validation = validateCreateScheduledEvaluationInput(body)
      console.log('[Scheduled Evaluations API] Validation result:', validation)

      if (!validation.isValid || !validation.data) {
        console.log('[Scheduled Evaluations API] Validation failed:', validation.errors)
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

      console.log('[Scheduled Evaluations API] Creating scheduled evaluation...')
      const scheduledEvaluation = await scheduledEvaluationOperations.create(
        validation.data,
        auth.user.id
      )
      console.log('[Scheduled Evaluations API] Scheduled evaluation created:', scheduledEvaluation)

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'scheduled_evaluation_create',
          entity_type: 'scheduled_evaluation',
          entity_id: scheduledEvaluation.id,
          new_values: validation.data as unknown as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Scheduled Evaluations API] Audit log error (non-critical):', auditError)
      }

      return NextResponse.json(
        {
          data: scheduledEvaluation,
          message: 'Evaluación programada creada exitosamente',
        },
        { status: 201 }
      )
    })
  } catch (error: unknown) {
    console.error('[Scheduled Evaluations API] POST error:', error)

    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
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

      // Handle specific validation errors from the operations layer
      if (error.message === 'Missing required fields: classroom_id, template_id, and scheduled_date are required') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'La programación requiere: espacio a evaluar, fecha y hora, y plantilla de cuestionario',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
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
