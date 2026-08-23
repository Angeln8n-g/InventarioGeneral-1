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
      const groupBy = searchParams.get('groupBy') || 'category'

      const { start, end } = getDateRange(timeRange, null, null)

      // Get consumable requests with item type info
      const { data: consumables, error } = await supabase
        .from('consumable_requests')
        .select(`
          fulfilled_quantity,
          item_types!inner(name, category)
        `)
        .eq('status', 'fulfilled')
        .gte('fulfilled_date', start)
        .lte('fulfilled_date', end)

      if (error) throw error

      // Try to get unit_cost if column exists
      let hasUnitCost = false
      const itemTypesWithCost: Record<number, number> = {}
      
      try {
        const { data: itemTypesData } = await supabase
          .from('item_types')
          .select('id, unit_cost')
          .limit(1)

        if (itemTypesData && itemTypesData.length > 0 && 'unit_cost' in itemTypesData[0]) {
          hasUnitCost = true
          const { data: allItemTypes } = await supabase
            .from('item_types')
            .select('id, unit_cost')

          allItemTypes?.forEach((item: any) => {
            itemTypesWithCost[item.id] = item.unit_cost || 0
          })
        }
      } catch (e) {
        // Column doesn't exist, use default costs
        hasUnitCost = false
      }

      // Group by category and calculate costs
      const grouped: Record<string, any> = {}

      consumables?.forEach((item: any) => {
        const category = item.item_types.category || 'Sin categoría'

        if (!grouped[category]) {
          grouped[category] = {
            category,
            cost: 0,
            items: 0,
          }
        }

        grouped[category].items += item.fulfilled_quantity
        // Use actual unit_cost if available, otherwise use default $10
        const unitCost = hasUnitCost ? (itemTypesWithCost[item.item_types.id] || 10) : 10
        grouped[category].cost += item.fulfilled_quantity * unitCost
      })

      const costData = Object.values(grouped)
      const totalCost = costData.reduce((sum: number, item: any) => sum + item.cost, 0)

      // Calculate percentages
      const costDataWithPercentages = costData.map((item: any) => ({
        ...item,
        percentage: totalCost > 0 ? Math.round((item.cost / totalCost) * 100 * 10) / 10 : 0,
      }))

      // Sort by cost descending
      costDataWithPercentages.sort((a, b) => b.cost - a.cost)

      return NextResponse.json({ data: costDataWithPercentages })
    })
  } catch (error: unknown) {
    console.error('Costs statistics error:', error)

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
      { error: { code: 'STATS_008', message: ERROR_MESSAGES.GENERIC_ERROR } },
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
