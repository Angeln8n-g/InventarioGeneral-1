import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      const { searchParams } = new URL(request.url)
      const dateRangeType = searchParams.get('dateRangeType') || 'month'
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      const category = searchParams.get('category')
      const sortBy = searchParams.get('sortBy') || 'quantity'
      const sortDirection = searchParams.get('sortDirection') || 'desc'
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const { start, end } = getDateRange(dateRangeType, startDate, endDate)

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, email')

      if (usersError) throw usersError

      // Get consumable requests with item type info
      const consumablesQuery = supabase
        .from('consumable_requests')
        .select(`
          user_id,
          fulfilled_quantity,
          fulfilled_date,
          item_type:item_types(id, name, category_id)
        `)
        .eq('status', 'fulfilled')
        .gte('fulfilled_date', start)
        .lte('fulfilled_date', end)

      const { data: consumables, error: consumablesError } = await consumablesQuery

      if (consumablesError) throw consumablesError

      // Aggregate data per user
      const userConsumption: Record<number, {
        userId: number
        username: string
        email: string
        totalQuantity: number
        totalCost: number
        byType: Record<number, { typeId: number; typeName: string; quantity: number; cost: number }>
        byPeriod: Record<string, number>
      }> = {}

      users?.forEach((user) => {
        userConsumption[user.id] = {
          userId: user.id,
          username: user.username,
          email: user.email || '',
          totalQuantity: 0,
          totalCost: 0,
          byType: {},
          byPeriod: {},
        }
      })

      consumables?.forEach((request: any) => {
        const userId = request.user_id
        if (!userConsumption[userId]) return

        const quantity = request.fulfilled_quantity || 0
        const itemType = request.item_type
        const typeId = itemType?.id || 0
        const typeName = itemType?.name || 'Sin tipo'

        // Filter by category if specified
        if (category && itemType?.category_id?.toString() !== category) {
          return
        }

        userConsumption[userId].totalQuantity += quantity
        // Note: Cost calculation would need price data from item_types or consumables

        // Aggregate by type
        if (!userConsumption[userId].byType[typeId]) {
          userConsumption[userId].byType[typeId] = {
            typeId,
            typeName,
            quantity: 0,
            cost: 0,
          }
        }
        userConsumption[userId].byType[typeId].quantity += quantity

        // Aggregate by period (month)
        if (request.fulfilled_date) {
          const date = new Date(request.fulfilled_date)
          const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          userConsumption[userId].byPeriod[period] = 
            (userConsumption[userId].byPeriod[period] || 0) + quantity
        }
      })

      // Transform to array and filter users with consumption
      let result = Object.values(userConsumption)
        .filter(user => user.totalQuantity > 0)
        .map(user => ({
          userId: user.userId,
          username: user.username,
          email: user.email,
          totalQuantity: user.totalQuantity,
          totalCost: user.totalCost,
          byType: Object.values(user.byType),
          trend: Object.entries(user.byPeriod)
            .map(([period, quantity]) => ({ period, quantity }))
            .sort((a, b) => a.period.localeCompare(b.period)),
        }))

      // Sort
      result.sort((a, b) => {
        let comparison = 0
        switch (sortBy) {
          case 'quantity':
            comparison = a.totalQuantity - b.totalQuantity
            break
          case 'cost':
            comparison = a.totalCost - b.totalCost
            break
          case 'name':
            comparison = a.username.localeCompare(b.username)
            break
          default:
            comparison = a.totalQuantity - b.totalQuantity
        }
        return sortDirection === 'desc' ? -comparison : comparison
      })

      const total = result.length
      const offset = (page - 1) * limit
      result = result.slice(offset, offset + limit)

      return NextResponse.json({ data: result, total })
    })
  } catch (error: unknown) {
    console.error('User consumption statistics error:', error)

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
      { error: { code: 'STATS_UC_001', message: ERROR_MESSAGES.GENERIC_ERROR } },
      { status: 500 }
    )
  }
}

function getDateRange(
  dateRangeType: string,
  startDate: string | null,
  endDate: string | null
): { start: string; end: string } {
  const now = new Date()
  let start: Date
  let end: Date = new Date()

  if (dateRangeType === 'custom' && startDate && endDate) {
    return { start: startDate, end: endDate }
  }

  switch (dateRangeType) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'quarter':
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      break
    case 'year':
      start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    case 'month':
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
  }

  return { start: start.toISOString(), end: end.toISOString() }
}
