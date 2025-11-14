import { NextRequest, NextResponse } from 'next/server'
import { 
  loanOperations, 
  notificationOperations,
  auditLogOperations 
} from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_LOANS, async (authContext) => {
      // Get all overdue loans
      const overdueLoans = await loanOperations.getOverdueLoans()

      // Group by user for easier management
      const loansByUser = overdueLoans.reduce((acc, loan) => {
        const userId = loan.user_id
        if (!acc[userId]) {
          acc[userId] = {
            user: loan.user,
            loans: [],
            total_overdue: 0,
          }
        }
        acc[userId].loans.push(loan)
        acc[userId].total_overdue += 1
        return acc
      }, {} as Record<number, { user: unknown; loans: unknown[]; total_overdue: number }>)

      // Calculate overdue statistics
      const now = new Date()
      const overdueStats = overdueLoans.map(loan => {
        const dueDate = new Date(loan.due_date)
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        return {
          ...loan,
          days_overdue: daysOverdue,
          severity: daysOverdue <= 7 ? 'low' : daysOverdue <= 30 ? 'medium' : 'high'
        }
      })

      return NextResponse.json({
        data: overdueStats,
        grouped_by_user: loansByUser,
        total: overdueLoans.length,
        summary: {
          total_overdue: overdueLoans.length,
          unique_users: Object.keys(loansByUser).length,
          severity_breakdown: {
            low: overdueStats.filter(l => l.severity === 'low').length,
            medium: overdueStats.filter(l => l.severity === 'medium').length,
            high: overdueStats.filter(l => l.severity === 'high').length,
          },
        },
      })
    })
  } catch (error: unknown) {
    console.error('Overdue loans fetch error:', error)

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

export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_LOANS, async (authContext) => {
      const body = await request.json()
      const { action } = body

      if (action === 'send_overdue_notifications') {
        // Get all overdue loans
        const overdueLoans = await loanOperations.getOverdueLoans()
        
        const notifications: Array<{ user_id: number; type: string; title: string; message: string }> = []
        const now = new Date()

        for (const loan of overdueLoans) {
          const dueDate = new Date(loan.due_date)
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // Create notification based on severity
          let notificationType = 'overdue_reminder'
          let title = 'Overdue Tool Return Reminder'
          let message = `Your loan of ${loan.tool_instance?.item_type?.name || 'tool'} is ${daysOverdue} day(s) overdue. Please return it as soon as possible.`

          if (daysOverdue > 30) {
            notificationType = 'overdue_final_notice'
            title = 'Final Notice: Overdue Tool Return'
            message = `FINAL NOTICE: Your loan of ${loan.tool_instance?.item_type?.name || 'tool'} is ${daysOverdue} days overdue. Immediate return is required to avoid penalties.`
          } else if (daysOverdue > 7) {
            notificationType = 'overdue_escalation'
            title = 'Escalated: Overdue Tool Return'
            message = `ESCALATED: Your loan of ${loan.tool_instance?.item_type?.name || 'tool'} is ${daysOverdue} days overdue. Please contact administration immediately.`
          }

          try {
            const notification = await notificationOperations.create({
              user_id: loan.user_id,
              type: notificationType,
              title,
              message,
            })
            notifications.push(notification)

            // Update loan status to overdue if not already
            if (loan.status === 'active') {
              await loanOperations.markOverdue(loan.id)
            }
          } catch (notificationError) {
            console.error(`Failed to create notification for loan ${loan.id}:`, notificationError)
          }
        }

        // Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'overdue_notifications_sent',
            entity_type: 'system',
            entity_id: 0,
            new_values: {
              total_loans: overdueLoans.length,
              notifications_sent: notifications.length,
              timestamp: new Date().toISOString(),
            },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
        }

        return NextResponse.json({
          message: 'Overdue notifications sent successfully',
          data: {
            total_overdue_loans: overdueLoans.length,
            notifications_sent: notifications.length,
            failed_notifications: overdueLoans.length - notifications.length,
          },
        })

      } else if (action === 'mark_loan_overdue') {
        const { loan_id } = body
        
        if (!loan_id) {
          return NextResponse.json(
            {
              error: {
                code: ERROR_CODES.VALIDATION_ERROR,
                message: 'loan_id is required',
                timestamp: new Date().toISOString(),
              },
            },
            { status: 400 }
          )
        }

        // Mark specific loan as overdue
        const updatedLoan = await loanOperations.markOverdue(loan_id)

        // Create audit log
        try {
          await auditLogOperations.create({
            user_id: authContext.user.id,
            action: 'loan_marked_overdue',
            entity_type: 'loan',
            entity_id: loan_id,
            old_values: { status: 'active' },
            new_values: { status: 'overdue' },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
          })
        } catch (auditError) {
          console.error('Failed to create audit log:', auditError)
        }

        return NextResponse.json({
          message: 'Loan marked as overdue',
          data: updatedLoan,
        })

      } else {
        return NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid action. Supported actions: send_overdue_notifications, mark_loan_overdue',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        )
      }
    })
  } catch (error: unknown) {
    console.error('Overdue processing error:', error)

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