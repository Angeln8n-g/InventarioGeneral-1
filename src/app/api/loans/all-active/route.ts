import { NextRequest, NextResponse } from 'next/server'
import { loanOperations } from '@/lib/supabase-client'
import { withAuth } from '@/lib/auth-middleware'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      // Get all active loans (not filtered by user)
      const allLoans = await loanOperations.getAll({})
      
      // Filter only active and overdue loans
      const activeLoans = allLoans.filter(loan => 
        loan.status === 'active' || loan.status === 'overdue'
      )

      // Sort by due date
      activeLoans.sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )

      return NextResponse.json({
        data: activeLoans,
        total: activeLoans.length,
      })
    })
  } catch (error: unknown) {
    console.error('All active loans fetch error:', error)

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
