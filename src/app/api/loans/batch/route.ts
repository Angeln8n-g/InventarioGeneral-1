import { NextRequest, NextResponse } from 'next/server'
import { loanOperations, toolInstanceOperations, auditLogOperations, notificationOperations, supabase } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES, BUSINESS_RULES } from '@/utils/constants'
import { BatchLoanSchema, validateRequestBody } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // 1. Zod Validation
      const validation = await validateRequestBody(BatchLoanSchema, request)
      if (!validation.success) {
        return validation.response
      }

      const body = validation.data
      const defaultDuration = BUSINESS_RULES.DEFAULT_LOAN_DURATION_DAYS || 7
      const dueDateObj = new Date()
      dueDateObj.setDate(dueDateObj.getDate() + defaultDuration)
      const dueDate = body.due_date || dueDateObj.toISOString()

      // 2. Try Atomic RPC Execution
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_batch_loans_atomic', {
          p_user_id: authContext.user.id,
          p_tool_instance_ids: body.tool_instance_ids,
          p_due_date: dueDate,
          p_notes: body.notes || null,
          p_max_loans: BUSINESS_RULES.MAX_LOANS_PER_USER,
        })

        if (!rpcError && rpcResult) {
          if (!rpcResult.success && rpcResult.error_code === 'MAX_LOANS_EXCEEDED') {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.VALIDATION_ERROR,
                  message: rpcResult.message,
                  details: rpcResult,
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 400 }
            )
          }

          const created = rpcResult.data?.created || []
          const failed = rpcResult.data?.failed || []
          const allSuccess = failed.length === 0
          const statusCode = allSuccess ? 201 : (created.length > 0 ? 207 : 400)

          if (created.length > 0) {
            notificationOperations.create({
              user_id: authContext.user.id,
              type: 'loan_confirmation',
              title: 'Batch Loans Created',
              message: `You have successfully borrowed ${created.length} tool(s).`,
            }).catch(err => console.error('Notification error:', err))
          }

          return NextResponse.json({
            success: allSuccess,
            data: rpcResult.data,
            message: allSuccess 
              ? SUCCESS_MESSAGES.LOAN_CREATED 
              : `Processed ${created.length} of ${body.tool_instance_ids.length} loans successfully`,
          }, { status: statusCode })
        }
      } catch (rpcErr) {
        console.warn('create_batch_loans_atomic RPC unavailable, falling back to application transaction logic:', rpcErr)
      }

      // 3. Graceful Fallback Logic
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

      const results = await Promise.allSettled(
        body.tool_instance_ids.map(async (toolInstanceId) => {
          const tool = await toolInstanceOperations.getById(toolInstanceId)
          if (!tool) {
            return {
              tool_instance_id: toolInstanceId,
              success: false,
              error: ERROR_MESSAGES.TOOL_NOT_FOUND,
            }
          }

          if (tool.status !== 'available') {
            return {
              tool_instance_id: toolInstanceId,
              success: false,
              error: `Tool is ${tool.status}, not available for loan`,
            }
          }

          const toolDuration = tool.item_type?.default_loan_duration_days || defaultDuration
          const itemDueDateObj = new Date()
          itemDueDateObj.setDate(itemDueDateObj.getDate() + toolDuration)

          const loan = await loanOperations.create({
            user_id: authContext.user.id,
            tool_instance_id: toolInstanceId,
            due_date: body.due_date || itemDueDateObj.toISOString(),
            notes: body.notes,
          })

          await toolInstanceOperations.updateStatus(
            toolInstanceId,
            'loaned',
            `Loaned to ${authContext.user.username} on ${new Date().toISOString()}`
          )

          return {
            tool_instance_id: toolInstanceId,
            success: true,
            loan,
          }
        })
      )

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
