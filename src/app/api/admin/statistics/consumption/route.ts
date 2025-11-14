import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

/**
 * GET /api/admin/statistics/consumption
 * Returns consumption data grouped by month, user, or category
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const { searchParams } = new URL(request.url)
      
      const timeRange = searchParams.get('timeRange') || 'month'
      const groupBy = searchParams.get('groupBy') || 'month'
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')

      const { start, end } = getDateRange(timeRange, startDate, endDate)

      if (groupBy === 'month') {
        // Group by month
        const { data, error } = await supabase.rpc('get_consumption_by_month', {
          start_date: start,
          end_date: end,
        })

        if (error) {
          // Fallback to manual query if RPC doesn't exist
          const { data: consumptionData, error: fallbackError } = await supabase
            .from('consumable_requests')
            .select(`
              fulfilled_date,
              fulfilled_quantity,
              item_types!inner(name, category)
            `)
            .eq('status', 'fulfilled')
            .gte('fulfilled_date', start)
            .lte('fulfilled_date', end)
            .order('fulfilled_date', { ascending: false })

          if (fallbackError) throw fallbackError

          // Group data by month
          const grouped = groupByMonth(consumptionData || [])
          return NextResponse.json({ data: grouped })
        }

        return NextResponse.json({ data: data || [] })
      } else if (groupBy === 'user') {
        // Group by user
        const { data, error } = await supabase
          .from('consumable_requests')
          .select(`
            user_id,
            fulfilled_quantity,
            users!inner(username, email),
            item_types!inner(name, category)
          `)
          .eq('status', 'fulfilled')
          .gte('fulfilled_date', start)
          .lte('fulfilled_date', end)

        if (error) throw error

        const grouped = groupByUser(data || [])
        return NextResponse.json({ data: grouped })
      } else if (groupBy === 'category') {
        // Group by category
        const { data, error } = await supabase
          .from('consumable_requests')
          .select(`
            fulfilled_quantity,
            item_types!inner(name, category)
          `)
          .eq('status', 'fulfilled')
          .gte('fulfilled_date', start)
          .lte('fulfilled_date', end)

        if (error) throw error

        const grouped = groupByCategory(data || [])
        return NextResponse.json({ data: grouped })
      }

      return NextResponse.json({ data: [] })
    })
  } catch (error: unknown) {
    console.error('Consumption statistics error:', error)

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
      { error: { code: 'STATS_002', message: ERROR_MESSAGES.GENERIC_ERROR } },
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

function groupByMonth(data: any[]) {
  const grouped: Record<string, any> = {}

  data.forEach((item) => {
    const date = new Date(item.fulfilled_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!grouped[monthKey]) {
      grouped[monthKey] = {
        period: monthKey,
        consumables: {},
        total: 0,
      }
    }

    const itemName = item.item_types.name
    grouped[monthKey].consumables[itemName] =
      (grouped[monthKey].consumables[itemName] || 0) + item.fulfilled_quantity
    grouped[monthKey].total += item.fulfilled_quantity
  })

  return Object.values(grouped)
}

function groupByUser(data: any[]) {
  const grouped: Record<string, any> = {}

  data.forEach((item) => {
    const userId = item.user_id
    const username = item.users.username

    if (!grouped[userId]) {
      grouped[userId] = {
        period: username,
        consumables: {},
        total: 0,
      }
    }

    const itemName = item.item_types.name
    grouped[userId].consumables[itemName] =
      (grouped[userId].consumables[itemName] || 0) + item.fulfilled_quantity
    grouped[userId].total += item.fulfilled_quantity
  })

  return Object.values(grouped)
}

function groupByCategory(data: any[]) {
  const grouped: Record<string, any> = {}

  data.forEach((item) => {
    const category = item.item_types.category || 'Sin categoría'

    if (!grouped[category]) {
      grouped[category] = {
        period: category,
        consumables: {},
        total: 0,
      }
    }

    const itemName = item.item_types.name
    grouped[category].consumables[itemName] =
      (grouped[category].consumables[itemName] || 0) + item.fulfilled_quantity
    grouped[category].total += item.fulfilled_quantity
  })

  return Object.values(grouped)
}
