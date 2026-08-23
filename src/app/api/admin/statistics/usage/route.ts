import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const { searchParams } = new URL(request.url)
      const type = searchParams.get('type') || 'both'
      const timeRange = searchParams.get('timeRange') || 'month'

      const { start, end } = getDateRange(timeRange, null, null)

      // Get item types with their instances
      let query = supabase
        .from('item_types')
        .select(`
          id,
          name,
          category,
          tool_instances(id, status)
        `)
        .eq('is_consumable', false)

      if (type === 'tools') {
        query = query.in('category', ['Herramientas', 'Tools'])
      } else if (type === 'electronics') {
        query = query.in('category', ['Electrónicos', 'Electronics'])
      }

      const { data, error } = await query

      if (error) throw error

      // Get all loans for the time period
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('id, tool_instance_id, loan_date, return_date, due_date')
        .gte('loan_date', start)
        .lte('loan_date', end)

      if (loansError) throw loansError

      const usageData = (data || []).map((item: any) => {
        const instances = item.tool_instances || []
        const totalInstances = instances.length
        const availableCount = instances.filter((i: any) => i.status === 'available').length

        // Get loans for this item type's instances
        const instanceIds = instances.map((i: any) => i.id)
        const loans = (loansData || []).filter((loan: any) =>
          instanceIds.includes(loan.tool_instance_id)
        )

        const activeLoans = loans.filter((l: any) => !l.return_date).length

        // Calculate average loan duration
        const completedLoans = loans.filter((l: any) => l.return_date)
        const avgDuration =
          completedLoans.length > 0
            ? completedLoans.reduce((sum: number, loan: any) => {
                const duration =
                  (new Date(loan.return_date).getTime() - new Date(loan.loan_date).getTime()) /
                  (1000 * 60 * 60 * 24)
                return sum + duration
              }, 0) / completedLoans.length
            : 0

        return {
          name: item.name,
          totalLoans: loans.length,
          activeLoans,
          availability: totalInstances > 0 ? (availableCount / totalInstances) * 100 : 0,
          avgLoanDuration: Math.round(avgDuration * 10) / 10,
        }
      })

      return NextResponse.json({ data: usageData })
    })
  } catch (error: unknown) {
    console.error('Usage statistics error:', error)

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
      { error: { code: 'STATS_003', message: ERROR_MESSAGES.GENERIC_ERROR } },
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
  const end: Date = now

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
