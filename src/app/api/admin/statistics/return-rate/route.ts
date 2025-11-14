import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const { searchParams } = new URL(request.url)
      const timeRange = searchParams.get('timeRange') || 'month'
      const groupBy = searchParams.get('groupBy') || 'global'

      const { start, end } = getDateRange(timeRange, null, null)

      // Get loans in the time range
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('id, user_id, return_date, due_date, users(id, username, email)')
        .gte('loan_date', start)
        .lte('loan_date', end)

      if (loansError) throw loansError

      const totalLoans = loans?.length || 0
      const onTimeReturns =
        loans?.filter(
          (loan) => loan.return_date && new Date(loan.return_date) <= new Date(loan.due_date)
        ).length || 0
      const lateReturns =
        loans?.filter(
          (loan) => loan.return_date && new Date(loan.return_date) > new Date(loan.due_date)
        ).length || 0

      // Calculate average delay for late returns
      const lateLoans = loans?.filter(
        (loan) =>
          (loan.return_date && new Date(loan.return_date) > new Date(loan.due_date)) ||
          (!loan.return_date && new Date() > new Date(loan.due_date))
      )

      const avgDelayDays =
        lateLoans && lateLoans.length > 0
          ? lateLoans.reduce((sum, loan) => {
              const returnDate = loan.return_date ? new Date(loan.return_date) : new Date()
              const dueDate = new Date(loan.due_date)
              const delayDays = (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
              return sum + Math.max(0, delayDays)
            }, 0) / lateLoans.length
          : 0

      const returnRate = totalLoans > 0 ? (onTimeReturns / totalLoans) * 100 : 0

      let byUser = undefined

      if (groupBy === 'user') {
        // Group by user
        const userStats: Record<number, any> = {}

        loans?.forEach((loan: any) => {
          const userId = loan.user_id
          if (!userStats[userId]) {
            userStats[userId] = {
              userId,
              username: loan.users?.username || 'Unknown',
              totalLoans: 0,
              onTimeReturns: 0,
              lateReturns: 0,
            }
          }

          userStats[userId].totalLoans++

          if (loan.return_date && new Date(loan.return_date) <= new Date(loan.due_date)) {
            userStats[userId].onTimeReturns++
          } else if (loan.return_date && new Date(loan.return_date) > new Date(loan.due_date)) {
            userStats[userId].lateReturns++
          }
        })

        byUser = Object.values(userStats)
          .map((user: any) => ({
            userId: user.userId,
            username: user.username,
            returnRate:
              user.totalLoans > 0 ? (user.onTimeReturns / user.totalLoans) * 100 : 0,
            lateReturns: user.lateReturns,
          }))
          .sort((a, b) => b.lateReturns - a.lateReturns)
          .slice(0, 20)
      }

      return NextResponse.json({
        data: {
          totalLoans,
          onTimeReturns,
          lateReturns,
          returnRate: Math.round(returnRate * 10) / 10,
          avgDelayDays: Math.round(avgDelayDays * 10) / 10,
          byUser,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Return rate statistics error:', error)

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
      { error: { code: 'STATS_005', message: ERROR_MESSAGES.GENERIC_ERROR } },
      { status: 500 }
    )
  }
}

function getDateRange(
  timeRange: string,
  startDate: string | null,
  endDate: string | null
): { start: string; end: string } {
  const now = new Date()
  let start: Date
  let end: Date = now

  if (timeRange === 'custom' && startDate && endDate) {
    return { start: startDate, end: endDate }
  }

  switch (timeRange) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0))
      break
    case 'week':
      start = new Date(now.setDate(now.getDate() - 7))
      break
    case 'quarter':
      start = new Date(now.setMonth(now.getMonth() - 3))
      break
    case 'year':
      start = new Date(now.setFullYear(now.getFullYear() - 1))
      break
    case 'month':
    default:
      start = new Date(now.setMonth(now.getMonth() - 1))
      break
  }

  return { start: start.toISOString(), end: end.toISOString() }
}
