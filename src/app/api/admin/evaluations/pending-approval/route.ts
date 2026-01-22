import { NextRequest, NextResponse } from 'next/server'
import { evaluationResultOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/evaluations/pending-approval
 * Get evaluations pending approval
 * 
 * Query parameters:
 * - my_approvals: If 'true', only returns evaluations where the current user is the designated approver
 * 
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { searchParams } = new URL(request.url)
      const myApprovalsOnly = searchParams.get('my_approvals') === 'true'

      // Get pending approvals
      const pendingEvaluations = await evaluationResultOperations.getPendingApproval(
        myApprovalsOnly ? auth.user.id : undefined
      )

      return NextResponse.json({
        data: pendingEvaluations,
        total: pendingEvaluations.length,
      })
    })
  } catch (error: unknown) {
    console.error('[Pending Approval API] GET error:', error)

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
