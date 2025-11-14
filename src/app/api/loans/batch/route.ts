import { NextRequest, NextResponse } from 'next/server'
import { loanOperations, toolInstanceOperations, auditLogOperations, notificationOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { validateLoanEligibility } from '@/utils/validation'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES, BUSINESS_RULES } from '@/utils/constants'

interface BatchLoanRequest {
  tool_instance_ids: number[]
  notes?: string
}

interface BatchLoanResult {
  tool_instance_id: number
  success: boolean
  loan?: unknown
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body: BatchLoanRequest = await request.json()
      
      if (!body.tool_instance_ids || !Array.isArray(body.tool_instance_ids) || body.tool_instance_ids.length === 0) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'tool_instance_ids array is required and must not be empty',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Check user's current active loans
      const userActiveLoans = await loanOperations.getActiveByUserId(authContext.user.id)
      const currentLoanCount = userActiveLoans.length
      const maxLoans = BUSINESS_RULES.MAX_LOANS_PER_USER
      const availableSlots = maxLoans - currentLoanCount

      if (body.tool_instance_ids.length > availableSlots) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: `Cannot create ${body.tool_instance_ids.length} loans. You have ${currentLoanCount} active loans and can only create ${availableSlots} more.`,
              details: {
                active_loans_count: currentLoanCount,
                max_loans_allowed: maxLoans,
                requested_loans: body.tool_instance_ids.length,
                available_slots: availableSlots,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Process loans in parallel with Promise.allSettled
      const results = await Promise.allSettled(
        body.tool_instance_ids.map(async (toolInstanceId): Promise<BatchLoanResult> => {
          try {
            // Get tool information
            const tool = await toolInstanceOperations.getById(toolInstanceId)
            
            if (!tool) {
              return {
                tool_instance_id: toolInstanceId,
                success: false,
                error: ERROR_MESSAGES.TOOL_NOT_FOUND,
              }
            }

            // Check if tool is available
            if (tool.status !== 'available') {
              return {
                tool_instance_id: toolInstanceId,
                success: false,
                error: `Tool is ${tool.status}, not available for loan`,
              }
            }

            // Calculate due date
            const defaultDuration = tool.item_type?.default_loan_duration_days || BUSINESS_RULES.DEFAULT_LOAN_DURATION_DAYS
            const dueDateObj = new Date()
            dueDateObj.setDate(dueDateObj.getDate() + defaultDuration)
            const dueDate = dueDateObj.toISOString()

            // Create the loan
            const loan = await loanOperations.create({
              user_id: authContext.user.id,
              tool_instance_id: toolInstanceId,
              due_date: dueDate,
              notes: body.notes,
            })

            // Update tool status to loaned
            await toolInstanceOperations.updateStatus(
              toolInstanceId,
              'loaned',
              `Loaned to ${authContext.user.username} on ${new Date().toISOString()}`
            )

            // Create audit log (non-blocking)
            auditLogOperations.create({
              user_id: authContext.user.id,
              action: 'loan_create_batch',
              entity_type: 'loan',
              entity_id: loan.id,
              new_values: {
                tool_instance_id: toolInstanceId,
                due_date: dueDate,
                notes: body.notes,
              },
              ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              user_agent: request.headers.get('user-agent') || 'unknown',
            }).catch(err => console.error('Audit log error:', err))

            return {
              tool_instance_id: toolInstanceId,
              success: true,
              loan,
            }
          } catch (error) {
            console.error(`Failed to create loan for tool ${toolInstanceId}:`, error)
            return {
              tool_instance_id: toolInstanceId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
            }
          }
        })
      )

      // Process results
      const created: unknown[] = []
      const failed: Array<{ tool_instance_id: number; error: string }> = []

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            created.push(result.value.loan)
          } else {
            failed.push({
              tool_instance_id: result.value.tool_instance_id,
              error: result.value.error || 'Unknown error',
            })
          }
        } else {
          failed.push({
            tool_instance_id: 0,
            error: result.reason?.message || 'Promise rejected',
          })
        }
      })

      // Create notification for successful loans (non-blocking)
      if (created.length > 0) {
        notificationOperations.create({
          user_id: authContext.user.id,
          type: 'loan_confirmation',
          title: 'Batch Loans Created',
          message: `You have successfully borrowed ${created.length} tool(s).`,
        }).catch(err => console.error('Notification error:', err))
      }

      const allSuccess = failed.length === 0
      const statusCode = allSuccess ? 201 : (created.length > 0 ? 207 : 400)

      return NextResponse.json({
        success: allSuccess,
        data: {
          created,
          failed,
          summary: {
            total: body.tool_instance_ids.length,
            successful: created.length,
            failed: failed.length,
          },
        },
        message: allSuccess 
          ? SUCCESS_MESSAGES.LOAN_CREATED 
          : `Processed ${created.length} of ${body.tool_instance_ids.length} loans successfully`,
      }, { status: statusCode })
    })
  } catch (error: unknown) {
    console.error('Batch loan creation error:', error)

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      )
    }

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
