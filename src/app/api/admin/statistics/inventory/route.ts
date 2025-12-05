import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.USERS_VIEW_ALL, async () => {
      // Get consumable stock with item type info
      const { data: stockData, error: stockError } = await supabase
        .from('consumable_stock')
        .select(`
          id,
          current_quantity,
          minimum_threshold,
          unit_of_measure,
          item_types!inner(id, name, category)
        `)

      if (stockError) throw stockError

      // Get average daily consumption for last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: consumptionData, error: consumptionError } = await supabase
        .from('consumable_requests')
        .select('item_type_id, fulfilled_quantity, fulfilled_date')
        .eq('status', 'fulfilled')
        .gte('fulfilled_date', thirtyDaysAgo.toISOString())

      if (consumptionError) throw consumptionError

      // Calculate average daily consumption and total consumed per item
      const avgConsumption: Record<number, number> = {}
      const totalConsumed: Record<number, number> = {}
      const consumptionByItem: Record<number, number[]> = {}

      consumptionData?.forEach((item) => {
        if (!consumptionByItem[item.item_type_id]) {
          consumptionByItem[item.item_type_id] = []
        }
        consumptionByItem[item.item_type_id].push(item.fulfilled_quantity)
      })

      Object.keys(consumptionByItem).forEach((itemId) => {
        const quantities = consumptionByItem[Number(itemId)]
        const total = quantities.reduce((sum, q) => sum + q, 0)
        avgConsumption[Number(itemId)] = total / 30
        totalConsumed[Number(itemId)] = total
      })

      // Build inventory items with status
      const inventoryItems = (stockData || []).map((stock: any) => {
        const currentQty = stock.current_quantity
        const minThreshold = stock.minimum_threshold
        const avgDaily = avgConsumption[stock.item_types.id] || 0

        let status: 'critical' | 'low' | 'normal' | 'high'
        if (currentQty === 0) {
          status = 'critical'
        } else if (currentQty <= minThreshold) {
          status = 'low'
        } else if (currentQty <= minThreshold * 2) {
          status = 'normal'
        } else {
          status = 'high'
        }

        const daysUntilEmpty = avgDaily > 0 ? Math.round(currentQty / avgDaily) : null

        return {
          id: stock.item_types.id,
          name: stock.item_types.name,
          currentStock: currentQty,
          minimumThreshold: minThreshold,
          status,
          daysUntilEmpty,
          unitOfMeasure: stock.unit_of_measure || 'unidades',
          category: stock.item_types.category,
          totalConsumed: totalConsumed[stock.item_types.id] || 0,
          avgDailyConsumption: avgDaily,
        }
      })

      // Sort by status priority
      inventoryItems.sort((a, b) => {
        const statusOrder = { critical: 1, low: 2, normal: 3, high: 4 }
        return statusOrder[a.status] - statusOrder[b.status]
      })

      return NextResponse.json({ data: inventoryItems })
    })
  } catch (error: unknown) {
    console.error('Inventory statistics error:', error)

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
      { error: { code: 'STATS_004', message: ERROR_MESSAGES.GENERIC_ERROR } },
      { status: 500 }
    )
  }
}
