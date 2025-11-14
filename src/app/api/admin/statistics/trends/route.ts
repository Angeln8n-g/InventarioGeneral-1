import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const { searchParams } = new URL(request.url)
      const currentStart = searchParams.get('currentStart')
      const currentEnd = searchParams.get('currentEnd')
      const previousStart = searchParams.get('previousStart')
      const previousEnd = searchParams.get('previousEnd')

      if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
        return NextResponse.json(
          { error: { code: 'STATS_010', message: 'Missing required date parameters' } },
          { status: 400 }
        )
      }

      const currentData = await getPeriodData(currentStart, currentEnd)
      const previousData = await getPeriodData(previousStart, previousEnd)

      const change = {
        consumablesUsed: calculatePercentageChange(
          previousData.consumablesUsed,
          currentData.consumablesUsed
        ),
        loansCreated: calculatePercentageChange(
          previousData.loansCreated,
          currentData.loansCreated
        ),
        avgLoanDuration: calculatePercentageChange(
          previousData.avgLoanDuration,
          currentData.avgLoanDuration
        ),
        costs: calculatePercentageChange(previousData.costs, currentData.costs),
      }

      return NextResponse.json({
        data: {
          current: currentData,
          previous: previousData,
          change,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Trends statistics error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        { error: { code: ERROR_CODES.AUTHENTICATION_ERROR, message: error.message } },
        { status: 401 }
      )
    }

    if (error instanceof Error && error.name === 'AuthorizationError') {
      return NextResponse.json(
        { error: { code: ERROR_CODES.AUTHORIZATION_ERROR, message: error.message } },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: { code: 'STATS_006', message: ERROR_MESSAGES.GENERIC_ERROR } },
      { status: 500 }
    )
  }
}

async function getPeriodData(start: string, end: string) {
  // Get consumables used
  const { data: consumables } = await supabase
    .from('consumable_requests')
    .select('fulfilled_quantity')
    .eq('status', 'fulfilled')
    .gte('fulfilled_date', start)
    .lte('fulfilled_date', end)

  const consumablesUsed = consumables?.reduce((sum, item) => sum + item.fulfilled_quantity, 0) || 0

  // Get loans created
  const { data: loans } = await supabase
    .from('loans')
    .select('id, loan_date, return_date')
    .gte('loan_date', start)
    .lte('loan_date', end)

  const loansCreated = loans?.length || 0

  // Calculate average loan duration
  const completedLoans = loans?.filter((l) => l.return_date) || []
  const avgLoanDuration =
    completedLoans.length > 0
      ? completedLoans.reduce((sum, loan) => {
          const duration =
            (new Date(loan.return_date!).getTime() - new Date(loan.loan_date).getTime()) /
            (1000 * 60 * 60 * 24)
          return sum + duration
        }, 0) / completedLoans.length
      : 0

  return {
    period: `${start} to ${end}`,
    consumablesUsed,
    loansCreated,
    avgLoanDuration: Math.round(avgLoanDuration * 10) / 10,
    costs: 0, // Placeholder
  }
}

function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  return Math.round(((newValue - oldValue) / oldValue) * 100 * 10) / 10
}
