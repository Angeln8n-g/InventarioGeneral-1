import { NextRequest, NextResponse } from 'next/server'
import { loanOperations, toolInstanceOperations, auditLogOperations, notificationOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { validateLoanEligibility } from '@/utils/validation'
import { createLoanSchema } from '@/utils/validation'
import { ERROR_CODES, ERROR_MESSAGES, SUCCESS_MESSAGES, BUSINESS_RULES } from '@/utils/constants'

export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const body = await request.json()
      
      // Validate input
      const validatedData = createLoanSchema.validateSync({
        ...body,
        user_id: authContext.user.id, // Always use authenticated user's ID
      })

      // Get tool information
      const tool = await toolInstanceOperations.getById(validatedData.tool_instance_id)
      
      if (!tool) {
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

      // Check if tool is available
      if (tool.status !== 'available') {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.TOOL_NOT_AVAILABLE,
              message: ERROR_MESSAGES.TOOL_UNAVAILABLE,
              details: {
                current_status: tool.status,
                tool_id: tool.id,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 409 }
        )
      }

      // Check user's current active loans
      const userActiveLoans = await loanOperations.getActiveByUserId(authContext.user.id)
      
      // Validate loan eligibility
      const eligibility = validateLoanEligibility(
        tool.status,
        userActiveLoans.length,
        BUSINESS_RULES.MAX_LOANS_PER_USER
      )
      
      if (!eligibility.isEligible) {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: eligibility.reason,
              details: {
                active_loans_count: userActiveLoans.length,
                max_loans_allowed: BUSINESS_RULES.MAX_LOANS_PER_USER,
              },
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }

      // Calculate due date if not provided
      let dueDate = validatedData.due_date
      if (!dueDate) {
        const defaultDuration = tool.item_type?.default_loan_duration_days || BUSINESS_RULES.DEFAULT_LOAN_DURATION_DAYS
        const dueDateObj = new Date()
        dueDateObj.setDate(dueDateObj.getDate() + defaultDuration)
        dueDate = dueDateObj.toISOString()
      } else if (typeof dueDate !== 'string') {
        dueDate = new Date(dueDate).toISOString()
      }

      try {
        // Start transaction-like operations
        // 1. Create the loan
        const loan = await loanOperations.create({
          user_id: authContext.user.id,
          tool_instance_id: validatedData.tool_instance_id,
          due_date: dueDate,
          notes: validatedData.notes,
        })

        // 2. Update tool status to loaned
        await toolInstanceOperations.updateStatus(
          validatedData.tool_instance_id,
          'loaned',
          `Loaned to ${authContext.user.username} on ${new Date().toISOString()}`
        )

        // 3. Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'loan_create',
            entity_type: 'loan',
            entity_id: loan.id,
            new_values: {
              tool_instance_id: validatedData.tool_instance_id,
              due_date: dueDate,
              notes: validatedData.notes,
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
          // Don't fail the loan creation if audit logging fails
        }

        // 4. Create notification for loan confirmation
        try {
          await notificationOperations.create({
            user_id: authContext.user.id,
            type: 'loan_confirmation',
            title: 'Loan Created Successfully',
            message: `You have successfully borrowed ${tool.item_type?.name || 'tool'}. Please return it by ${new Date(dueDate).toLocaleDateString()}.`,
          })
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError)
          // Don't fail the loan creation if notification fails
        }

        return NextResponse.json({
          data: loan,
          message: SUCCESS_MESSAGES.LOAN_CREATED,
        }, { status: 201 })

      } catch (error: unknown) {
        console.error('Loan creation transaction error:', error)
        
        // If loan creation fails, we should try to revert any changes
        // In a real production system, this would be handled by database transactions
        
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.DATABASE_ERROR,
              message: 'Failed to create loan. Please try again.',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 500 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('Loan creation error:', error)

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

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      // Build filters from query parameters
      const filters: Record<string, unknown> = {}
      
      // Regular users can only see their own loans
      if (authContext.user.role !== 'admin') {
        filters.user_id = authContext.user.id
      } else {
        // Admins can filter by user_id if specified
        const userId = searchParams.get('user_id')
        if (userId) {
          const parsed = parseInt(userId, 10)
          if (!isNaN(parsed)) {
            filters.user_id = parsed
          }
        }
      }
      
      const status = searchParams.get('status')
      if (status) {
        filters.status = status
      }
      
      const overdue = searchParams.get('overdue')
      if (overdue === 'true') {
        filters.overdue = true
      }
      
      const startDate = searchParams.get('start_date')
      if (startDate) {
        filters.start_date = startDate
      }
      
      const endDate = searchParams.get('end_date')
      if (endDate) {
        filters.end_date = endDate
      }

      // Get loans with filters
      const loans = await loanOperations.getAll(filters)

      return NextResponse.json({
        data: loans,
        total: loans.length,
        filters: filters,
      })
    })
  } catch (error: unknown) {
    console.error('Loans fetch error:', error)

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