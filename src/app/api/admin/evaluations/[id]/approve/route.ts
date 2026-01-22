import { NextRequest, NextResponse } from 'next/server'
import { 
  evaluationResultOperations, 
  scheduledEvaluationOperations,
  notificationOperations,
  auditLogOperations 
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { ApprovalStatus } from '@/types/evaluations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/evaluations/[id]/approve
 * Get evaluation details for approval review
 * Requires admin role
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const evaluationId = parseInt(id, 10)

      if (isNaN(evaluationId)) {
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

      // Get the evaluation result with full details
      const result = await evaluationResultOperations.getByIdWithDetails(evaluationId)

      if (!result) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Evaluation result not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        data: result,
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Approve API] GET error:', error)

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
 * POST /api/admin/evaluations/[id]/approve
 * Approve or reject an evaluation
 * Requires admin role
 * 
 * @body
 *   - decision: 'approved' | 'rejected' (required)
 *   - comments: string (optional) - reason for the decision
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const evaluationId = parseInt(id, 10)

      if (isNaN(evaluationId)) {
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

      const body = await request.json()
      const { decision, comments } = body

      // Validate decision
      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Decision must be "approved" or "rejected"',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Get the current evaluation result
      const currentResult = await evaluationResultOperations.getById(evaluationId)

      if (!currentResult) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: 'Evaluation result not found',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Check if already approved/rejected
      if (currentResult.approval_status !== 'pending') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: `Esta evaluación ya fue ${currentResult.approval_status === 'approved' ? 'aprobada' : 'rechazada'}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Update the evaluation result with approval
      const updatedResult = await evaluationResultOperations.updateApproval(
        evaluationId,
        decision as ApprovalStatus,
        auth.user.id,
        comments
      )

      // Get scheduled evaluation details for notification
      const scheduledEvaluation = await scheduledEvaluationOperations.getById(
        currentResult.scheduled_evaluation_id
      )

      // Send notification to the evaluator
      if (scheduledEvaluation) {
        try {
          const classroomName = scheduledEvaluation.classroom?.name || 'Espacio'
          const notificationType = decision === 'approved' ? 'evaluation_approved' : 'evaluation_rejected'
          const title = decision === 'approved' 
            ? 'Evaluación Aprobada' 
            : 'Evaluación Rechazada'
          const message = decision === 'approved'
            ? `Tu evaluación de "${classroomName}" ha sido aprobada.${comments ? ` Comentarios: ${comments}` : ''}`
            : `Tu evaluación de "${classroomName}" ha sido rechazada.${comments ? ` Motivo: ${comments}` : ''}`

          await notificationOperations.create({
            user_id: currentResult.evaluator_id,
            type: notificationType,
            title,
            message,
          })
        } catch (notificationError) {
          console.error('[Evaluation Approve API] Error sending notification:', notificationError)
        }
      }

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: `evaluation_${decision}`,
          entity_type: 'evaluation_result',
          entity_id: evaluationId,
          old_values: { approval_status: 'pending' },
          new_values: { 
            approval_status: decision, 
            approved_by: auth.user.id,
            approval_comments: comments 
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Evaluation Approve API] Audit log error:', auditError)
      }

      return NextResponse.json({
        data: updatedResult,
        message: decision === 'approved' 
          ? 'Evaluación aprobada exitosamente' 
          : 'Evaluación rechazada',
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Approve API] POST error:', error)

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
