import { NextRequest, NextResponse } from 'next/server'
import { loanOperations, toolInstanceOperations, auditLogOperations, notificationOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { canReturnTool } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants'

interface BatchReturnRequest {
  loan_ids: number[]
  notes?: string
}

interface BatchReturnResult {
  loan_id: number
  success: boolean
  loan?: unknown
  error?: string
}

export async function PUT(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body: BatchReturnRequest = await request.json()
      
      if (!body.loan_ids || !Array.isArray(body.loan_ids) || body.loan_ids.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'loan_ids array is required and must not be empty',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Process returns in parallel with Promise.allSettled
      const results = await Promise.allSettled(
        body.loan_ids.map(async (loanId): Promise<BatchReturnResult> => {
          try {
            // Get loan information
            const loan = await loanOperations.getById(loanId)

            if (!loan) {
              return {
                loan_id: loanId,
                success: false,
                error: 'Loan not found',
              }
            }

            // Check if user can return this tool
            if (!canReturnTool(authContext.user, loan.user_id)) {
              return {
                loan_id: loanId,
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED_RETURN,
              }
            }

            // Check if loan is already returned
            if (loan.status === 'returned') {
              return {
                loan_id: loanId,
                success: false,
                error: 'Loan has already been returned',
              }
            }

            // Check if loan is lost
            if (loan.status === 'lost') {
              return {
                loan_id: loanId,
                success: false,
                error: 'Cannot return a loan marked as lost',
              }
            }

            // Update loan status to returned
            const updatedLoan = await loanOperations.returnTool(loanId)

            // Update tool status back to available
            await toolInstanceOperations.updateStatus(
              loan.tool_instance_id,
              'available',
              `Returned by ${authContext.user.username} on ${new Date().toISOString()}${body.notes ? `. Notes: ${body.notes}` : ''}`
            )

            // Create audit log (non-blocking)
            auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'loan_return_batch',
              entity_type: 'loan',
              entity_id: loanId,
              old_values: {
                status: loan.status,
                return_date: loan.return_date,
              },
              new_values: {
                status: 'returned',
                return_date: new Date().toISOString(),
                notes: body.notes,
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            }).catch(err => console.error('Audit log error:', err))

            return {
              loan_id: loanId,
              success: true,
              loan: updatedLoan,
            }
          } catch (error) {
            console.error(`Failed to return loan ${loanId}:`, error)
            return {
              loan_id: loanId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            }
          }
        })
      )

      // Process results
      const returned: unknown[] = []
      const failed: Array<{ loan_id: number; error: string }> = []

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            returned.push(result.value.loan)
          } else {
            failed.push({
              loan_id: result.value.loan_id,
              error: result.value.error || 'Unknown error',
            })
          }
        } else {
          failed.push({
            loan_id: 0,
            error: result.reason?.message || 'Promise rejected',
          })
        }
      })

      // Create notification for successful returns (non-blocking)
      if (returned.length > 0) {
        notificationOperations.create({
          user_id: authContext.user.id,
          type: 'return_confirmation',
          title: 'Batch Returns Completed',
          message: `You have successfully returned ${returned.length} tool(s).`,
        }).catch(err => console.error('Notification error:', err))
      }

      const allSuccess = failed.length === 0
      const statusCode = allSuccess ? 200 : (returned.length > 0 ? 207 : 400)

      return NextResponse.json({
        success: allSuccess,
        data: {
          returned,
          failed,
          summary: {
            total: body.loan_ids.length,
            successful: returned.length,
            failed: failed.length,
          },
        },
        message: allSuccess 
          ? SUCCESS_MESSAGES.TOOL_RETURNED 
          : `Processed ${returned.length} of ${body.loan_ids.length} returns successfully`,
      }, { status: statusCode })
    })
  } catch (error: unknown) {
    console.error('Batch return error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
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
