import { supabase } from '../supabase'
import {
  ToolReportFilters,
  ToolMetrics,
  ToolCharts,
  ToolInstanceWithRelations,
} from '@/types/reports'

export const toolReportOperations = {
  /**
   * Get metrics for tool reports
   */
  async getMetrics(filters: ToolReportFilters): Promise<ToolMetrics> {
    let query = supabase
      .from('tool_instances')
      .select('*, item_type:item_types(*)', { count: 'exact' })

    // Apply filters
    if (filters.category) {
      query = query.eq('item_type.category', filters.category)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data: tools, error, count } = await query

    if (error) throw error

    const totalTools = count || 0
    const availableTools = tools?.filter((t) => t.status === 'available').length || 0
    const maintenanceNeeded =
      tools?.filter((t) => t.status === 'out-of-service' || t.status === 'damaged').length || 0

    // Calculate utilization rate (tools currently loaned / total tools)
    const loanedTools = tools?.filter((t) => t.status === 'loaned').length || 0
    const utilizationRate = totalTools > 0 ? (loanedTools / totalTools) * 100 : 0

    return {
      totalTools,
      availableTools,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      maintenanceNeeded,
    }
  },

  /**
   * Get chart data for tool reports
   */
  async getChartData(filters: ToolReportFilters): Promise<ToolCharts> {
    let query = supabase
      .from('tool_instances')
      .select(
        `
        *,
        item_type:item_types(*)
      `
      )
      .order('created_at', { ascending: true })

    // Apply filters
    if (filters.category) {
      query = query.eq('item_type.category', filters.category)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data: tools, error } = await query

    if (error) throw error

    // Status distribution
    const statusCounts = new Map<string, number>()
    tools?.forEach((tool) => {
      statusCounts.set(tool.status, (statusCounts.get(tool.status) || 0) + 1)
    })
    const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Category distribution
    const categoryCounts = new Map<string, number>()
    tools?.forEach((tool) => {
      const category = (tool.item_type as { category?: string })?.category || 'Sin categoría'
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1)
    })
    const categoryDistribution = Array.from(categoryCounts.entries()).map(
      ([category, count]) => ({
        category,
        count,
      })
    )

    // Get loan history for utilization calculation
    const toolIds = tools?.map((t) => t.id) || []
    let utilizationData: Array<{ tool: string; rate: number }> = []

    if (toolIds.length > 0) {
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('tool_instance_id, loan_date, return_date')
        .in('tool_instance_id', toolIds)

      if (!loansError && loans) {
        // Calculate utilization rate for each tool
        const toolUtilization = new Map<number, { totalDays: number; loanedDays: number }>()

        tools?.forEach((tool) => {
          const createdDate = new Date(tool.created_at)
          const today = new Date()
          const totalDays = Math.floor(
            (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          const toolLoans = loans.filter((l) => l.tool_instance_id === tool.id)
          let loanedDays = 0

          toolLoans.forEach((loan) => {
            const loanDate = new Date(loan.loan_date)
            const returnDate = loan.return_date ? new Date(loan.return_date) : today
            const duration = Math.floor(
              (returnDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24)
            )
            loanedDays += duration
          })

          toolUtilization.set(tool.id, { totalDays, loanedDays })
        })

        // Get top 10 tools by utilization rate
        utilizationData = tools
          ?.map((tool) => {
            const util = toolUtilization.get(tool.id)
            const rate = util && util.totalDays > 0 ? (util.loanedDays / util.totalDays) * 100 : 0
            return {
              tool: (tool.item_type as { name?: string })?.name || 'Unknown',
              rate: Math.round(rate * 10) / 10,
            }
          })
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 10) || []
      }
    }

    // Status timeline (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const statusTimeline: Array<Record<string, string | number>> = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayData: Record<string, string | number> = { date: dateStr }
      statusCounts.forEach((_, status) => {
        dayData[status] = 0
      })

      // Count tools by status on this date (simplified - just use current status)
      tools?.forEach((tool) => {
        const toolCreated = new Date(tool.created_at)
        if (toolCreated <= date) {
          dayData[tool.status] = (dayData[tool.status] as number || 0) + 1
        }
      })

      statusTimeline.push(dayData)
    }

    return {
      statusDistribution,
      categoryDistribution,
      utilization: utilizationData,
      statusTimeline: statusTimeline as Array<{ date: string } & Record<string, number>>,
    }
  },

  /**
   * Get detailed tools with utilization
   */
  async getDetailedTools(filters: ToolReportFilters): Promise<ToolInstanceWithRelations[]> {
    let query = supabase
      .from('tool_instances')
      .select(
        `
        *,
        item_type:item_types(*)
      `
      )
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.category) {
      query = query.eq('item_type.category', filters.category)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data: tools, error } = await query

    if (error) throw error

    // Get loan history for each tool
    const toolIds = tools?.map((t) => t.id) || []
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('tool_instance_id, loan_date, return_date')
      .in('tool_instance_id', toolIds)

    if (loansError) throw loansError

    // Calculate utilization for each tool
    const toolsWithUtilization = tools?.map((tool) => {
      const createdDate = new Date(tool.created_at)
      const today = new Date()
      const totalDays = Math.floor(
        (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      const toolLoans = loans?.filter((l) => l.tool_instance_id === tool.id) || []
      let loanedDays = 0

      const loanHistory = toolLoans.map((loan) => {
        const loanDate = new Date(loan.loan_date)
        const returnDate = loan.return_date ? new Date(loan.return_date) : today
        const duration = Math.floor(
          (returnDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        loanedDays += duration

        return {
          loanDate: loan.loan_date,
          returnDate: loan.return_date,
          duration,
        }
      })

      const utilizationRate = totalDays > 0 ? (loanedDays / totalDays) * 100 : 0

      return {
        ...tool,
        loanHistory,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
      } as ToolInstanceWithRelations
    }) || []

    return toolsWithUtilization
  },
}
