import { NextRequest, NextResponse } from 'next/server'
import { loanOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      // Get all loans for the authenticated user
      const allLoans = await loanOperations.getAll({ user_id: authContext.user.id })
      
      // Separate loans by status
      const activeLoans = allLoans.filter(loan => loan.status === 'active')
      const overdueLoans = allLoans.filter(loan => 
        loan.status === 'overdue' || 
        (loan.status === 'active' && new Date(loan.due_date) < new Date())
      )
      const returnedLoans = allLoans.filter(loan => loan.status === 'returned')
      const lostLoans = allLoans.filter(loan => loan.status === 'lost')

      return NextResponse.json({
        data: {
          active: activeLoans,
          overdue: overdueLoans,
          returned: returnedLoans,
          lost: lostLoans,
          total: allLoans.length,
        },
        summary: {
          active_count: activeLoans.length,
          overdue_count: overdueLoans.length,
          returned_count: returnedLoans.length,
          lost_count: lostLoans.length,
        },
      })
    })
  } catch (error: unknown) {
    console.error('My loans fetch error:', error)

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