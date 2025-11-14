import { NextRequest, NextResponse } from 'next/server'
import { loanOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_LOANS, async () => {
      const { searchParams } = new URL(request.url)
      const statusParam = searchParams.get('status') || 'active'
      const userId = searchParams.get('user_id')
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')

      // Validate status
      const validStatuses = ['active', 'returned', 'overdue', 'lost'] as const
      const status = validStatuses.includes(statusParam as typeof validStatuses[number])
        ? (statusParam as typeof validStatuses[number])
        : 'active'

      // Build filters
      const filters: {
        status?: 'active' | 'returned' | 'overdue' | 'lost'
        user_id?: number
        start_date?: string
        end_date?: string
      } = {}

      if (status) filters.status = status
      if (userId) filters.user_id = parseInt(userId)
      if (startDate) filters.start_date = startDate
      if (endDate) filters.end_date = endDate

      // Get loans with filters
      const loans = await loanOperations.getAll(filters)

      // Calculate additional info for each loan
      const now = new Date()
      const loansWithInfo = loans.map(loan => {
        const dueDate = new Date(loan.due_date)
        const loanDate = new Date(loan.loan_date)
        const daysActive = Math.floor((now.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24))
        const daysUntilDue = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...loan,
          days_active: daysActive,
          days_until_due: daysUntilDue,
          is_due_soon: daysUntilDue <= 3 && daysUntilDue >= 0,
        }
      })

      // Calculate summary statistics
      const summary = {
        total: loans.length,
        due_soon: loansWithInfo.filter(l => l.is_due_soon).length,
        by_user: loans.reduce((acc, loan) => {
          const userId = loan.user_id
          acc[userId] = (acc[userId] || 0) + 1
          return acc
        }, {} as Record<number, number>),
      }

      return NextResponse.json({
        data: loansWithInfo,
        summary,
        total: loans.length,
      })
    })
  } catch (error: unknown) {
    console.error('Active loans fetch error:', error)

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
