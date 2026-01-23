import { NextRequest, NextResponse } from 'next/server'
import { 
  evaluationResultOperations, 
  scheduledEvaluationOperations,
  notificationOperations,
  auditLogOperations,
  userOperations,
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import { notifyEvaluationApproval } from '@/lib/teams-webhook'

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

      // Get scheduled evaluation to check approver assignment
      const scheduledEvaluation = await scheduledEvaluationOperations.getById(
        currentResult.scheduled_evaluation_id
      )

      // Check if evaluation has an assigned approver and if current user is that approver
      if (scheduledEvaluation?.approver_id && scheduledEvaluation.approver_id !== auth.user.id) {
        // Get approver info for the error message
        const approver = scheduledEvaluation.approver as { id: number; username: string; full_name?: string } | undefined
        const approverName = approver?.full_name || approver?.username || 'otro administrador'
        
        return NextResponse.json(
          {
            error: {
              code: 'APPROVAL_ASSIGNED_TO_OTHER',
              message: `Esta evaluación está asignada para aprobación a ${approverName}. Solo el aprobador asignado puede aprobar o rechazar esta evaluación.`,
              assigned_to: {
                id: scheduledEvaluation.approver_id,
                name: approverName,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 403 }
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
        decision as 'approved' | 'rejected',
        auth.user.id,
        comments
      )

      // Send notification to the evaluator
      if (scheduledEvaluation) {
        const classroomName = scheduledEvaluation.classroom?.name || 'Espacio'
        
        try {
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

        // Send Teams notification (if configured)
        try {
          const approverUser = await userOperations.getById(auth.user.id)
          await notifyEvaluationApproval({
            classroomName,
            approved: decision === 'approved',
            approver: approverUser?.full_name || approverUser?.username || 'Administrador',
            comments: comments || undefined,
          })
        } catch (teamsError) {
          console.error('[Evaluation Approve API] Error sending Teams notification:', teamsError)
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
