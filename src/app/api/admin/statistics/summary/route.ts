import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/statistics/summary
 * Returns summary statistics for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const { searchParams } = new URL(request.url)
      
      // Parse query parameters
      const timeRange = searchParams.get('timeRange') || 'month'
      const category = searchParams.get('category') || 'all'
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      // Calculate date range
      const { start, end } = getDateRange(timeRange, startDate, endDate)

      // Get total consumables used
      const { data: consumablesData, error: consumablesError } = await supabase
        .from('consumable_requests')
        .select('fulfilled_quantity, item_type_id')
        .eq('status', 'fulfilled')
        .gte('fulfilled_date', start)
        .lte('fulfilled_date', end)

      if (consumablesError) throw consumablesError

      const totalConsumablesUsed = consumablesData?.reduce(
        (sum, item) => sum + (item.fulfilled_quantity || 0),
        0
      ) || 0

      // Try to calculate total cost if unit_cost column exists
      let totalCost = 0
      try {
        const { data: costData } = await supabase
          .from('consumable_requests')
          .select('fulfilled_quantity, item_types!inner(unit_cost)')
          .eq('status', 'fulfilled')
          .gte('fulfilled_date', start)
          .lte('fulfilled_date', end)
          .limit(1)

        if (costData && costData.length > 0) {
          // Column exists, calculate actual cost
          const { data: allCostData } = await supabase
            .from('consumable_requests')
            .select('fulfilled_quantity, item_types!inner(unit_cost)')
            .eq('status', 'fulfilled')
            .gte('fulfilled_date', start)
            .lte('fulfilled_date', end)

          totalCost = allCostData?.reduce(
            (sum, item: any) => sum + (item.fulfilled_quantity * (item.item_types?.unit_cost || 0)),
            0
          ) || 0
        }
      } catch (e) {
        // Column doesn't exist yet, use 0
        totalCost = 0
      }

      // Get total loans and active loans
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select('id, status, return_date, due_date')
        .gte('loan_date', start)
        .lte('loan_date', end)

      if (loansError) throw loansError

      const totalLoans = loansData?.length || 0
      const activeLoans = loansData?.filter(loan => loan.status === 'active').length || 0

      // Get overdue loans
      const { data: overdueData, error: overdueError } = await supabase
        .from('loans')
        .select('id')
        .eq('status', 'active')
        .is('return_date', null)
        .lt('due_date', new Date().toISOString())

      if (overdueError) throw overdueError

      const overdueLoans = overdueData?.length || 0

      // Get low stock items
      const { data: stockData, error: stockError } = await supabase
        .from('consumable_stock')
        .select('id, current_quantity, minimum_threshold')

      if (stockError) throw stockError

      const lowStockItems = stockData?.filter(
        item => item.current_quantity <= item.minimum_threshold
      ).length || 0

      return NextResponse.json({
        data: {
          totalConsumablesUsed,
          totalLoans,
          activeLoans,
          overdueLoans,
          lowStockItems,
          totalCost,
        },
      })
    })
  } catch (error: unknown) {
    console.error('Statistics summary error:', error)

    if (error instanceof Error && error.name === 'AuthenticationError') {
      return NextResponse.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
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
          },
        },
        { status: 403 }
      )
    }

    return NextResponse.json(
      {
        error: {
          code: 'STATS_001',
          message: ERROR_MESSAGES.GENERIC_ERROR,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to calculate date range based on time range type
 */
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

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}
