import { NextRequest, NextResponse } from 'next/server'
import { toolInstanceOperations, auditLogOperations, loanOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { validateToolStatus } from '@/utils/validation'
import { ERROR_CODES, ERROR_MESSAGES, TOOL_STATUSES } from '@/utils/constants'
import { z } from 'zod'

const adjustStatusSchema = z.object({
  status: z.enum(['available', 'loaned', 'out-of-service', 'lost', 'damaged']),
  justification: z
    .string()
    .min(10, 'Justification must be at least 10 characters')
    .max(1000, 'Justification must be less than 1000 characters'),
  close_active_loan: z.boolean().default(false),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.TOOLS_ADJUST_STATUS, async (authContext) => {
      const resolvedParams = await params
      const toolId = parseInt(resolvedParams.id, 10)
      
      if (isNaN(toolId)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid tool ID',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      const body = await request.json()
      
      // Validate input
      const parseResult = adjustStatusSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: parseResult.error.issues[0]?.message || 'Validation error',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
      const validatedData = parseResult.data

      // Get current tool
      const currentTool = await toolInstanceOperations.getById(toolId)
      
      if (!currentTool) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: ERROR_MESSAGES.TOOL_NOT_FOUND,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 404 }
        )
      }

      // Validate status transition
      if (!validateToolStatus(currentTool.status, validatedData.status)) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: `Cannot change status from ${currentTool.status} to ${validatedData.status}`,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Handle active loans if tool is being marked as lost/damaged
      let closedLoan = null
      if (['lost', 'damaged'].includes(validatedData.status) && currentTool.status === 'loaned') {
        // Find active loan for this tool
        const activeLoans = await loanOperations.getAll({
          tool_instance_id: toolId,
          status: 'active',
        })
        
        if (activeLoans.length > 0) {
          const activeLoan = activeLoans[0]
          
          if (validatedData.close_active_loan) {
            // Close the active loan
            closedLoan = await loanOperations.update(activeLoan.id, {
              status: validatedData.status === 'lost' ? 'lost' : 'returned',
              return_date: new Date().toISOString(),
              notes: `Tool marked as ${validatedData.status} by admin. Original loan closed automatically.`,
            })
          } else {
            return NextResponse.json(
              {
                error: {
                  code: ERROR_CODES.CONFLICT,
                  message: `Tool has an active loan. Set close_active_loan to true to automatically close it.`,
                  details: {
                    active_loan: activeLoan,
                  },
                  timestamp: new Date().toISOString(),
                },
              },
              { status: 409 }
            )
          }
        }
      }

      // Update tool status
      const updatedTool = await toolInstanceOperations.updateStatus(
        toolId,
        validatedData.status,
        validatedData.justification
      )

      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: authContext.user.id,
          action: 'status_change',
          entity_type: 'tool_instance',
          entity_id: toolId,
          old_values: {
            status: currentTool.status,
            condition_notes: currentTool.condition_notes,
          },
          new_values: {
            status: validatedData.status,
            condition_notes: validatedData.justification,
            justification: validatedData.justification,
          },
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('Failed to create audit log:', auditError)
        // Don't fail the request if audit logging fails
      }

      return NextResponse.json({
        data: {
          tool: updatedTool,
          closed_loan: closedLoan,
        },
        message: `Tool status updated to ${validatedData.status}`,
      })
    })
  } catch (error: unknown) {
    console.error('Tool status adjustment error:', error)

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

    if (error instanceof Error && error.name === 'AuthorizationError') {
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