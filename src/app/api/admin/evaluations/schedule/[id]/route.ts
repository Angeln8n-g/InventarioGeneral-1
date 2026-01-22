import { NextRequest, NextResponse } from 'next/server'
import { scheduledEvaluationOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * Validates the input for updating a scheduled evaluation
 * @param body - The request body to validate
 * @returns Validation result with isValid flag and errors array
 */
function validateUpdateScheduledEvaluationInput(body: unknown): {
  isValid: boolean
  errors: string[]
  data?: { scheduled_date?: string; template_id?: number }
} {
  const errors: string[] = []

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] }
  }

  const input = body as Record<string, unknown>
  const data: { scheduled_date?: string; template_id?: number } = {}

  // Validate scheduled_date (optional)
  if (input.scheduled_date !== undefined) {
    if (typeof input.scheduled_date !== 'string') {
      errors.push('scheduled_date must be a string')
    } else {
      const date = new Date(input.scheduled_date)
      if (isNaN(date.getTime())) {
        errors.push('scheduled_date must be a valid ISO date string')
      } else {
        data.scheduled_date = input.scheduled_date
      }
    }
  }

  // Validate template_id (optional)
  if (input.template_id !== undefined) {
    if (typeof input.template_id !== 'number' || input.template_id <= 0) {
      errors.push('template_id must be a positive number')
    } else {
      data.template_id = input.template_id
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors }
  }

  // Check that at least one field is being updated
  if (Object.keys(data).length === 0) {
    return { isValid: false, errors: ['At least one field must be provided for update (scheduled_date or template_id)'] }
  }

  return { isValid: true, errors: [], data }
}

/**
 * GET /api/admin/evaluations/schedule/[id]
 * Gets a single scheduled evaluation by ID with classroom and template details
 * Requires admin role
 *
 * @returns Scheduled evaluation with details
 * Validates: Requirements 1.7, 8.3, 8.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const evaluationId = parseInt(id, 10)

      if (isNaN(evaluationId) || evaluationId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid evaluation ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const evaluation = await scheduledEvaluationOperations.getById(evaluationId)

      if (!evaluation) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Evaluación programada no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: evaluation,
      })
    })
  } catch (error: unknown) {
    console.error('[Scheduled Evaluations API] GET [id] error:', error)

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
 * PUT /api/admin/evaluations/schedule/[id]
 * Updates an existing scheduled evaluation
 * Only allowed if the evaluation status is 'pending'
 * Requires admin role
 *
 * @body { scheduled_date?: string, template_id?: number }
 * @returns Updated scheduled evaluation
 * Validates: Requirements 1.7, 8.3, 8.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const evaluationId = parseInt(id, 10)

      if (isNaN(evaluationId) || evaluationId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid evaluation ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Check if evaluation exists
      const existingEvaluation = await scheduledEvaluationOperations.getById(evaluationId)

      if (!existingEvaluation) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Evaluación programada no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Check if evaluation is pending (only pending evaluations can be edited)
      if (existingEvaluation.status !== 'pending') {
        return NextResponse.json(
          {
            error: {
              code: 'EVALUATION_NOT_PENDING',
              message: 'Solo se pueden editar evaluaciones pendientes',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        )
      }

      const body = await request.json()

      // Validate input
      const validation = validateUpdateScheduledEvaluationInput(body)

      if (!validation.isValid || !validation.data) {
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

      // Store old values for audit log
      const oldValues = {
        scheduled_date: existingEvaluation.scheduled_date,
        template_id: existingEvaluation.template_id,
      }

      // Update evaluation
      const updatedEvaluation = await scheduledEvaluationOperations.update(
        evaluationId,
        validation.data
      )

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'scheduled_evaluation_update',
          entity_type: 'scheduled_evaluation',
          entity_id: evaluationId,
          old_values: oldValues as unknown as Record<string, unknown>,
          new_values: validation.data as unknown as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Scheduled Evaluations API] Audit log error (non-critical):', auditError)
      }

      return NextResponse.json({
        data: updatedEvaluation,
        message: 'Evaluación programada actualizada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('[Scheduled Evaluations API] PUT [id] error:', error)

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

      // Handle specific error for non-pending evaluations
      if (error.message === 'Only pending evaluations can be edited') {
        return NextResponse.json(
          {
            error: {
              code: 'EVALUATION_NOT_PENDING',
              message: 'Solo se pueden editar evaluaciones pendientes',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
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

/**
 * DELETE /api/admin/evaluations/schedule/[id]
 * Cancels a scheduled evaluation (changes status to 'cancelled')
 * Requires admin role
 *
 * @returns Success message
 * Validates: Requirements 1.8, 8.3, 8.4
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const evaluationId = parseInt(id, 10)

      if (isNaN(evaluationId) || evaluationId <= 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid evaluation ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Check if evaluation exists
      const existingEvaluation = await scheduledEvaluationOperations.getById(evaluationId)

      if (!existingEvaluation) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Evaluación programada no encontrada',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Store evaluation info for audit log before cancellation
      const cancelledEvaluationInfo = {
        id: existingEvaluation.id,
        classroom_id: existingEvaluation.classroom_id,
        template_id: existingEvaluation.template_id,
        scheduled_date: existingEvaluation.scheduled_date,
        status: existingEvaluation.status,
      }

      // Cancel evaluation (soft delete - changes status to cancelled)
      await scheduledEvaluationOperations.delete(evaluationId)

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'scheduled_evaluation_cancel',
          entity_type: 'scheduled_evaluation',
          entity_id: evaluationId,
          old_values: cancelledEvaluationInfo as unknown as Record<string, unknown>,
          new_values: { status: 'cancelled' },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Scheduled Evaluations API] Audit log error (non-critical):', auditError)
      }

      return NextResponse.json({
        message: 'Evaluación programada cancelada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('[Scheduled Evaluations API] DELETE [id] error:', error)

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
          message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    )
  }
}
