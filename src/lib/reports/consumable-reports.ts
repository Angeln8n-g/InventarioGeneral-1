import { supabase } from '../supabase'
import {
  ConsumableReportFilters,
  ConsumableMetrics,
  ConsumableCharts,
  CategorySummary,
  CategoryDetailData,
  ConsumableStockWithType,
} from '@/types/reports'

export const consumableReportOperations = {
  /**
   * Get metrics for consumable reports
   */
  async getMetrics(filters: ConsumableReportFilters): Promise<ConsumableMetrics> {
    let query = supabase
      .from('consumable_stock')
      .select('*, item_type:item_types(*)', { count: 'exact' })

    // Apply filters
    if (filters.search) {
      query = query.ilike('item_type.name', `%${filters.search}%`)
    }
    
    if (filters.category) {
      query = query.eq('item_type.category', filters.category)
    }

    const { data: consumables, error, count } = await query

    if (error) throw error

    const totalTypes = count || 0

    // Count low stock items
    const lowStockItems =
      consumables?.filter((c) => c.current_quantity <= c.minimum_threshold).length || 0

    // Calculate total consumption and returns
    let totalConsumption = 0
    let avgDailyConsumption = 0
    let totalReturns = 0
    let totalReturnedItems = 0

    // Determine date range (use filter or default to last 30 days)
    const hasDateRange = filters.dateRange?.start && filters.dateRange?.end
    const startDate = hasDateRange 
      ? filters.dateRange!.start 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = hasDateRange 
      ? filters.dateRange!.end 
      : new Date().toISOString().split('T')[0]

    // Ensure dates include full day range
    const startDateTime = startDate.includes('T') 
      ? startDate 
      : `${startDate}T00:00:00`
    const endDateTime = endDate.includes('T') 
      ? endDate 
      : `${endDate}T23:59:59`

    // Get consumption from stock_movements
    {
      // Get consumption data
      const { data: consumptionMovements, error: consumptionError } = await supabase
        .from('stock_movements')
        .select('quantity')
        .eq('movement_type', 'consumption')
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)

      if (!consumptionError && consumptionMovements) {
        totalConsumption = consumptionMovements.reduce((sum, m) => sum + Math.abs(m.quantity), 0)

        // Calculate average daily consumption
        const start = new Date(startDate)
        const end = new Date(endDate)
        const days = Math.max(
          1,
          Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        )
        avgDailyConsumption = totalConsumption / days
      }
    }

    // Get returns data (always fetch, not just when date range is set)
    {
      const { data: returns, error: returnsError } = await supabase
        .from('consumable_returns')
        .select('returned_quantity', { count: 'exact' })
        .eq('status', 'completed')
        .gte('return_date', startDateTime)
        .lte('return_date', endDateTime)

      if (!returnsError && returns) {
        totalReturns = returns.length
        totalReturnedItems = returns.reduce((sum, r) => sum + r.returned_quantity, 0)
      }
    }

    // Get user consumption data
    let userConsumption: Array<{
      userId: number
      username: string
      totalConsumed: number
      itemsConsumed: Array<{ itemName: string; quantity: number }>
    }> = []

    {
      let movementsQuery = supabase
        .from('stock_movements')
        .select(`
          quantity,
          user_id,
          user:users!inner(id, username),
          consumable_stock!inner(
            item_type:item_types!inner(name)
          )
        `)
        .eq('movement_type', 'consumption')
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)

      // Apply user filter if specified
      if (filters.userId) {
        movementsQuery = movementsQuery.eq('user_id', filters.userId)
      }

      const { data: userMovements, error: userMovementsError } = await movementsQuery

      if (!userMovementsError && userMovements) {
        const userMap = new Map<number, {
          username: string
          totalConsumed: number
          items: Map<string, number>
        }>()

        userMovements.forEach((movement: any) => {
          const userId = movement.user_id
          const username = movement.user?.username || 'Usuario desconocido'
          const quantity = Math.abs(movement.quantity)
          const itemName = movement.consumable_stock?.item_type?.name || 'Item desconocido'

          if (!userMap.has(userId)) {
            userMap.set(userId, {
              username,
              totalConsumed: 0,
              items: new Map()
            })
          }

          const userData = userMap.get(userId)!
          userData.totalConsumed += quantity
          userData.items.set(itemName, (userData.items.get(itemName) || 0) + quantity)
        })

        userConsumption = Array.from(userMap.entries())
          .map(([userId, data]) => ({
            userId,
            username: data.username,
            totalConsumed: data.totalConsumed,
            itemsConsumed: Array.from(data.items.entries())
              .map(([itemName, quantity]) => ({ itemName, quantity }))
              .sort((a, b) => b.quantity - a.quantity)
          }))
          .sort((a, b) => b.totalConsumed - a.totalConsumed)
      }
    }

    return {
      totalTypes,
      lowStockItems,
      totalConsumption,
      avgDailyConsumption: Math.round(avgDailyConsumption * 10) / 10,
      totalReturns,
      totalReturnedItems,
      userConsumption,
    }
  },

  /**
   * Get chart data for consumable reports
   */
  async getChartData(filters: ConsumableReportFilters): Promise<ConsumableCharts> {
    // Determine date range (use filter or default to last 30 days)
    const hasDateRange = filters.dateRange?.start && filters.dateRange?.end
    const startDate = hasDateRange 
      ? filters.dateRange!.start 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = hasDateRange 
      ? filters.dateRange!.end 
      : new Date().toISOString().split('T')[0]

    const startDateTime = startDate.includes('T') ? startDate : `${startDate}T00:00:00`
    const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59`

    let query = supabase.from('consumable_stock').select(
      `
        *,
        item_type:item_types(*)
      `
    )

    // Apply filters
    if (filters.category) {
      query = query.eq('item_type.category', filters.category)
    }

    const { data: consumables, error } = await query

    if (error) throw error

    // Get stock movements for consumption data
    const { data: movements, error: movementsError } = await supabase
      .from('stock_movements')
      .select(`
        quantity,
        created_at,
        consumable_stock_id,
        consumable_stock!inner(
          item_type_id,
          item_type:item_types!inner(category)
        )
      `)
      .eq('movement_type', 'consumption')
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime)

    // Consumption by category
    const categoryConsumption = new Map<string, number>()
    if (!movementsError && movements) {
      movements.forEach((movement: any) => {
        const category = movement.consumable_stock?.item_type?.category || 'Sin categoría'
        const amount = Math.abs(movement.quantity)
        categoryConsumption.set(
          category,
          (categoryConsumption.get(category) || 0) + amount
        )
      })
    }
    const consumptionByCategory = Array.from(categoryConsumption.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
      })
    )

    // Consumption trend by date
    const consumptionByDate = new Map<string, number>()
    if (!movementsError && movements) {
      movements.forEach((movement: any) => {
        const date = movement.created_at.split('T')[0]
        const amount = Math.abs(movement.quantity)
        consumptionByDate.set(date, (consumptionByDate.get(date) || 0) + amount)
      })
    }
    const consumptionTrend = Array.from(consumptionByDate.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Low stock items
    const lowStockItems =
      consumables
        ?.filter((c) => c.current_quantity <= c.minimum_threshold)
        .map((c) => ({
          item: (c.item_type as { name?: string })?.name || 'Unknown',
          stock: c.current_quantity,
          min: c.minimum_threshold,
        }))
        .slice(0, 10) || []

    // Category comparison (last 7 days or date range)
    const comparisonStart = new Date(endDate)
    comparisonStart.setDate(comparisonStart.getDate() - 6) // Last 7 days including today

    const categoryByDateMap = new Map<string, Map<string, number>>()
    if (!movementsError && movements) {
      movements.forEach((movement: any) => {
        const date = movement.created_at.split('T')[0]
        const category = movement.consumable_stock?.item_type?.category || 'Sin categoría'
        const amount = Math.abs(movement.quantity)

        if (!categoryByDateMap.has(date)) {
          categoryByDateMap.set(date, new Map())
        }
        const dateMap = categoryByDateMap.get(date)!
        dateMap.set(category, (dateMap.get(category) || 0) + amount)
      })
    }

    // Build category comparison array
    const categoryComparison: Array<Record<string, string | number>> = []
    const categories = Array.from(categoryConsumption.keys())
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(comparisonStart)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayData: Record<string, string | number> = { date: dateStr }
      
      // Add data for each category
      categories.forEach((category) => {
        const dateMap = categoryByDateMap.get(dateStr)
        dayData[category] = dateMap?.get(category) || 0
      })

      categoryComparison.push(dayData)
    }

    // Consumption vs Returns over time
    const consumptionVsReturns: Array<{ date: string; consumed: number; returned: number }> = []
    const dateSet = new Set<string>()
    
    // Collect all dates
    if (!movementsError && movements) {
      movements.forEach((m: any) => dateSet.add(m.created_at.split('T')[0]))
    }

    // Get returns by date
    const { data: returnsData, error: returnsDataError } = await supabase
      .from('consumable_returns')
      .select('return_date, returned_quantity')
      .eq('status', 'completed')
      .gte('return_date', startDateTime)
      .lte('return_date', endDateTime)

    const returnsByDate = new Map<string, number>()
    if (!returnsDataError && returnsData) {
      returnsData.forEach((r) => {
        const date = r.return_date.split('T')[0]
        dateSet.add(date)
        returnsByDate.set(date, (returnsByDate.get(date) || 0) + r.returned_quantity)
      })
    }

    // Build consumption vs returns array
    Array.from(dateSet)
      .sort()
      .forEach((date) => {
        consumptionVsReturns.push({
          date,
          consumed: consumptionByDate.get(date) || 0,
          returned: returnsByDate.get(date) || 0,
        })
      })

    // Top consumed items
    const itemConsumption = new Map<string, number>()
    if (!movementsError && movements) {
      movements.forEach((movement: any) => {
        const itemName = movement.consumable_stock?.item_type?.name || 'Unknown'
        const amount = Math.abs(movement.quantity)
        itemConsumption.set(itemName, (itemConsumption.get(itemName) || 0) + amount)
      })
    }
    const topConsumed = Array.from(itemConsumption.entries())
      .map(([itemName, quantity]) => ({ itemName, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Top returned items
    const itemReturns = new Map<string, number>()
    if (!returnsDataError && returnsData) {
      const { data: returnsWithItems } = await supabase
        .from('consumable_returns')
        .select(`
          returned_quantity,
          consumable_stock!inner(
            item_type:item_types!inner(name)
          )
        `)
        .eq('status', 'completed')
        .gte('return_date', startDateTime)
        .lte('return_date', endDateTime)

      if (returnsWithItems) {
        returnsWithItems.forEach((r: any) => {
          const itemName = r.consumable_stock?.item_type?.name || 'Unknown'
          itemReturns.set(itemName, (itemReturns.get(itemName) || 0) + r.returned_quantity)
        })
      }
    }
    const topReturned = Array.from(itemReturns.entries())
      .map(([itemName, quantity]) => ({ itemName, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // User consumption chart data (top 10)
    const userConsumptionMap = new Map<string, number>()
    if (!movementsError && movements) {
      const { data: movementsWithUsers } = await supabase
        .from('stock_movements')
        .select(`
          quantity,
          user:users!inner(username)
        `)
        .eq('movement_type', 'consumption')
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)

      if (movementsWithUsers) {
        movementsWithUsers.forEach((m: any) => {
          const username = m.user?.username || 'Unknown'
          const amount = Math.abs(m.quantity)
          userConsumptionMap.set(username, (userConsumptionMap.get(username) || 0) + amount)
        })
      }
    }
    const userConsumptionChart = Array.from(userConsumptionMap.entries())
      .map(([username, total]) => ({ username, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return {
      consumptionByCategory,
      consumptionTrend,
      lowStockItems,
      categoryComparison: categoryComparison as Array<{ date: string } & Record<string, number>>,
      consumptionVsReturns,
      topConsumed,
      topReturned,
      userConsumptionChart,
    }
  },

  /**
   * Get category summaries
   */
  async getCategorySummaries(filters: ConsumableReportFilters): Promise<CategorySummary[]> {
    let query = supabase.from('consumable_stock').select(
      `
        *,
        item_type:item_types(*)
      `
    )

    // Apply filters
    if (filters.search) {
      query = query.ilike('item_type.name', `%${filters.search}%`)
    }
    
    if (filters.category) {
      query = query.eq('item_type.category', filters.category)
    }

    const { data: consumables, error } = await query

    if (error) throw error

    // Determine date range (use filter or default to last 30 days)
    const hasDateRange = filters.dateRange?.start && filters.dateRange?.end
    const startDate = hasDateRange 
      ? filters.dateRange!.start 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = hasDateRange 
      ? filters.dateRange!.end 
      : new Date().toISOString().split('T')[0]

    const startDateTime = startDate.includes('T') ? startDate : `${startDate}T00:00:00`
    const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59`

    // Get consumption data from stock_movements for all consumables
    const consumableIds = consumables?.map(c => c.id) || []
    const consumptionMap = new Map<number, number>()
    const returnsMap = new Map<number, number>()

    if (consumableIds.length > 0) {
      // Get consumption movements
      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('consumable_stock_id, quantity')
        .eq('movement_type', 'consumption')
        .in('consumable_stock_id', consumableIds)
        .gte('created_at', startDateTime)
        .lte('created_at', endDateTime)

      if (!movementsError && movements) {
        movements.forEach((movement) => {
          const stockId = movement.consumable_stock_id
          const quantity = Math.abs(movement.quantity)
          consumptionMap.set(stockId, (consumptionMap.get(stockId) || 0) + quantity)
        })
      }

      // Get returns data from consumable_returns
      const { data: returns, error: returnsError } = await supabase
        .from('consumable_returns')
        .select('consumable_stock_id, returned_quantity')
        .eq('status', 'completed')
        .in('consumable_stock_id', consumableIds)
        .gte('return_date', startDateTime)
        .lte('return_date', endDateTime)

      if (!returnsError && returns) {
        returns.forEach((returnItem) => {
          const stockId = returnItem.consumable_stock_id
          const quantity = returnItem.returned_quantity
          returnsMap.set(stockId, (returnsMap.get(stockId) || 0) + quantity)
        })
      }
    }

    // Group by category
    const categoryMap = new Map<string, ConsumableStockWithType[]>()
    consumables?.forEach((consumable) => {
      const category = (consumable.item_type as { category?: string })?.category || 'Sin categoría'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }

      // Get actual consumption and returns for this item
      const consumptionInPeriod = consumptionMap.get(consumable.id) || 0
      const returnsInPeriod = returnsMap.get(consumable.id) || 0

      // Add consumption, returns and request data
      const enriched: ConsumableStockWithType = {
        ...consumable,
        item_type: consumable.item_type as import('@/types/database').ItemType,
        consumptionInPeriod,
        returnsInPeriod,
        requestsInPeriod: 0,
        status:
          consumable.current_quantity <= 0
            ? 'critical'
            : consumable.current_quantity <= consumable.minimum_threshold
              ? 'low'
              : 'adequate',
      }

      categoryMap.get(category)!.push(enriched)
    })

    // Create summaries
    const summaries: CategorySummary[] = Array.from(categoryMap.entries()).map(
      ([category, items]) => {
        const totalItems = items.length
        const totalStock = items.reduce((sum, item) => sum + item.current_quantity, 0)
        const consumption = items.reduce((sum, item) => sum + item.consumptionInPeriod, 0)
        const lowStockCount = items.filter((item) => item.status !== 'adequate').length

        return {
          category,
          totalItems,
          totalStock,
          consumption,
          lowStockCount,
          items,
        }
      }
    )

    return summaries.sort((a, b) => a.category.localeCompare(b.category))
  },

  /**
   * Get category detail
   */
  async getCategoryDetail(
    category: string,
    filters: ConsumableReportFilters
  ): Promise<CategoryDetailData> {
    const query = supabase
      .from('consumable_stock')
      .select(
        `
        *,
        item_type:item_types(*)
      `
      )
      .eq('item_type.category', category)

    const { data: consumables, error } = await query

    if (error) throw error

    const totalItems = consumables?.length || 0
    const totalStock = consumables?.reduce((sum, c) => sum + c.current_quantity, 0) || 0

    // Calculate consumption from audit logs
    let consumption = 0
    let avgDailyConsumption = 0

    if (filters.dateRange?.start && filters.dateRange?.end) {
      const itemTypeIds = consumables?.map((c) => c.item_type_id) || []

      if (itemTypeIds.length > 0) {
        const { data: auditLogs, error: auditError } = await supabase
          .from('audit_logs')
          .select('new_values, old_values, created_at, entity_id')
          .eq('entity_type', 'consumable_stock')
          .eq('action', 'consumable_adjust')
          .in('entity_id', consumables?.map((c) => c.id) || [])
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end)

        if (!auditError && auditLogs) {
          auditLogs.forEach((log) => {
            const oldQty = (log.old_values as { current_quantity?: number })?.current_quantity || 0
            const newQty = (log.new_values as { current_quantity?: number })?.current_quantity || 0
            const diff = oldQty - newQty
            if (diff > 0) {
              consumption += diff
            }
          })

          const startDate = new Date(filters.dateRange.start)
          const endDate = new Date(filters.dateRange.end)
          const days = Math.max(
            1,
            Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          )
          avgDailyConsumption = consumption / days
        }
      }
    }

    // Project days until empty
    const projectedDaysUntilEmpty =
      avgDailyConsumption > 0 ? Math.floor(totalStock / avgDailyConsumption) : 999

    // Prepare items
    const items =
      consumables?.map((c) => ({
        id: c.id,
        name: (c.item_type as { name?: string })?.name || 'Unknown',
        currentStock: c.current_quantity,
        minimumThreshold: c.minimum_threshold,
        consumption: 0, // Would need to calculate per item
        status:
          c.current_quantity <= 0
            ? ('critical' as const)
            : c.current_quantity <= c.minimum_threshold
              ? ('low' as const)
              : ('adequate' as const),
      })) || []

    // Consumption history (last 30 days)
    const consumptionHistory: Array<{ date: string; amount: number }> = []

    return {
      category,
      metrics: {
        totalItems,
        totalStock,
        consumption,
        avgDailyConsumption: Math.round(avgDailyConsumption * 10) / 10,
        projectedDaysUntilEmpty,
      },
      items,
      consumptionHistory,
    }
  },
}
