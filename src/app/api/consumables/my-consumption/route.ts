import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { supabase } from '@/lib/supabase'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'

export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async (authContext) => {
      const { searchParams } = new URL(request.url)
      
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      const itemTypeId = searchParams.get('item_type_id')

      // Calculate date range (default to last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0]

      // Get stock movements (consumptions)
      let query = supabase
        .from('stock_movements')
        .select(`
          id,
          created_at,
          quantity,
          consumable_stock_id,
          consumable_stock:consumable_stock!inner(
            id,
            item_type_id,
            unit_of_measure,
            item_type:item_types!inner(
              id,
              name,
              description
            )
          )
        `)
        .eq('user_id', authContext.user.id)
        .eq('movement_type', 'consumption')
        .lt('quantity', 0)
        .gte('created_at', startDate || defaultStartDate)

      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59')
      }

      if (itemTypeId) {
        query = query.eq('consumable_stock.item_type_id', parseInt(itemTypeId, 10))
      }

      const { data: movements, error: movementsError } = await query.order('created_at', { ascending: false })

      if (movementsError) {
        throw movementsError
      }

      // Get returns for this user
      const { data: returns, error: returnsError } = await supabase
        .from('consumable_returns')
        .select('item_type_id, returned_quantity, original_consumption_date')
        .eq('user_id', authContext.user.id)
        .eq('status', 'completed')
        .gte('original_consumption_date', startDate || defaultStartDate)

      if (returnsError) {
        throw returnsError
      }

      // Group movements by date and item
      const groupedByDate: Record<string, Record<number, any>> = {}

      movements?.forEach((movement: any) => {
        const date = movement.created_at.split('T')[0]
        const itemTypeId = movement.consumable_stock.item_type_id
        
        if (!groupedByDate[date]) {
          groupedByDate[date] = {}
        }

        if (!groupedByDate[date][itemTypeId]) {
          groupedByDate[date][itemTypeId] = {
            item_type_id: itemTypeId,
            consumable_stock_id: movement.consumable_stock_id,
            item_name: movement.consumable_stock.item_type.name,
            item_description: movement.consumable_stock.item_type.description,
            consumed_quantity: 0,
            returned_quantity: 0,
            unit_of_measure: movement.consumable_stock.unit_of_measure || 'units',
          }
        }

        groupedByDate[date][itemTypeId].consumed_quantity += Math.abs(movement.quantity)
      })

      // Add returns to the grouped data
      returns?.forEach((returnItem: any) => {
        const date = returnItem.original_consumption_date
        const itemTypeId = returnItem.item_type_id

        if (groupedByDate[date] && groupedByDate[date][itemTypeId]) {
          groupedByDate[date][itemTypeId].returned_quantity += returnItem.returned_quantity
        }
      })

      // Convert to array format and calculate returnable quantities
      const data = Object.entries(groupedByDate).map(([date, itemsObj]) => {
        const items = Object.values(itemsObj).map((item: any) => ({
          ...item,
          returnable_quantity: Math.max(0, item.consumed_quantity - item.returned_quantity),
        }))

        return {
          consumption_date: date,
          items,
          total_items: items.length,
          total_consumed: items.reduce((sum, item) => sum + item.consumed_quantity, 0),
          total_returnable: items.reduce((sum, item) => sum + item.returnable_quantity, 0),
        }
      })

      // Sort by date descending
      data.sort((a, b) => b.consumption_date.localeCompare(a.consumption_date))

      return NextResponse.json({
        data,
        total_dates: data.length,
      })
    })
  } catch (error: unknown) {
    console.error('Consumption history fetch error:', error)

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
