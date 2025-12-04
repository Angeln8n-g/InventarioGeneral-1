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
      const limit = parseInt(searchParams.get('limit') || '20')
      const filterBy = searchParams.get('filterBy') || 'both'

      const { start, end } = getDateRange(timeRange, null, null)

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email')

      if (usersError) throw usersError

      // Get loans per user (within date range)
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('user_id, status')
        .gte('loan_date', start)
        .lte('loan_date', end)

      if (loansError) throw loansError

      // Also get ALL active loans (regardless of date) to show current active loans
      const { data: activeLoans, error: activeLoansError } = await supabase
        .from('loans')
        .select('user_id')
        .eq('status', 'active')

      if (activeLoansError) throw activeLoansError

      // Get consumables per user
      const { data: consumables, error: consumablesError } = await supabase
        .from('consumable_requests')
        .select('user_id, fulfilled_quantity')
        .eq('status', 'fulfilled')
        .gte('fulfilled_date', start)
        .lte('fulfilled_date', end)

      if (consumablesError) throw consumablesError

      // Aggregate data per user
      const userStats: Record<number, any> = {}

      users?.forEach((user) => {
        userStats[user.id] = {
          userId: user.id,
          username: user.username,
          email: user.email,
          activeLoans: 0,
          totalLoans: 0,
          totalConsumables: 0,
          totalCost: 0,
        }
      })

      loans?.forEach((loan) => {
        if (userStats[loan.user_id]) {
          userStats[loan.user_id].totalLoans++
        }
      })

      // Count current active loans per user
      activeLoans?.forEach((loan) => {
        if (userStats[loan.user_id]) {
          userStats[loan.user_id].activeLoans++
        }
      })

      consumables?.forEach((consumable) => {
        if (userStats[consumable.user_id]) {
          userStats[consumable.user_id].totalConsumables += consumable.fulfilled_quantity
        }
      })

      // Filter based on filterBy parameter
      let topUsers = Object.values(userStats)
      
      if (filterBy === 'loans') {
        // Show users with active loans OR loans in the period
        topUsers = topUsers.filter((user: any) => user.activeLoans > 0 || user.totalLoans > 0)
      } else if (filterBy === 'consumables') {
        topUsers = topUsers.filter((user: any) => user.totalConsumables > 0)
      }
      // For 'all' or 'both', include all users

      // Sort by activity score (loans + consumables)
      topUsers.sort((a: any, b: any) => {
        const scoreA = a.totalLoans + a.totalConsumables + a.activeLoans
        const scoreB = b.totalLoans + b.totalConsumables + b.activeLoans
        return scoreB - scoreA
      })

      topUsers = topUsers.slice(0, limit).map((user: any, index) => ({
        ...user,
        rank: index + 1,
      }))

      // Calculate summary stats
      const totalActiveUsers = Object.values(userStats).filter((u: any) => u.totalLoans > 0 || u.totalConsumables > 0).length
      const totalLoans = Object.values(userStats).reduce((sum: number, u: any) => sum + u.totalLoans, 0)
      const totalConsumablesUsed = Object.values(userStats).reduce((sum: number, u: any) => sum + u.totalConsumables, 0)

      return NextResponse.json({ 
        data: topUsers,
        summary: {
          totalActiveUsers,
          totalLoans,
          totalConsumables: totalConsumablesUsed,
        }
      })
    })
  } catch (error: unknown) {
    console.error('Top users statistics error:', error)

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
      { error: { code: 'STATS_007', message: ERROR_MESSAGES.GENERIC_ERROR } },
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
