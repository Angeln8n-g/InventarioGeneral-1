import { supabase } from '../supabase'
import {
  LoanReportFilters,
  LoanMetrics,
  LoanCharts,
  LoanWithRelations,
} from '@/types/reports'

export const loanReportOperations = {
  /**
   * Get metrics for loan reports
   */
  async getMetrics(filters: LoanReportFilters): Promise<LoanMetrics> {
    let query = supabase.from('loans').select('*', { count: 'exact' })

    // Apply filters
    if (filters.dateRange?.start) {
      query = query.gte('loan_date', filters.dateRange.start)
    }
    if (filters.dateRange?.end) {
      query = query.lte('loan_date', filters.dateRange.end)
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters.toolInstanceId) {
      query = query.eq('tool_instance_id', filters.toolInstanceId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data: loans, error, count } = await query

    if (error) throw error

    const totalLoans = count || 0
    const activeLoans = loans?.filter((l) => l.status === 'active').length || 0
    const overdueLoans = loans?.filter((l) => l.status === 'overdue').length || 0
    const returnedLoans = loans?.filter((l) => l.status === 'returned').length || 0

    // Calculate return rate
    const returnRate = totalLoans > 0 ? (returnedLoans / totalLoans) * 100 : 0

    // Calculate average duration for returned loans
    const durations = loans
      ?.filter((l) => l.return_date && l.loan_date)
      .map((l) => {
        const loanDate = new Date(l.loan_date)
        const returnDate = new Date(l.return_date!)
        return (returnDate.getTime() - loanDate.getTime()) / (1000 * 60 * 60 * 24)
      }) || []

    const avgDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

    return {
      totalLoans,
      activeLoans,
      overdueLoans,
      returnRate: Math.round(returnRate * 10) / 10,
      avgDuration: Math.round(avgDuration * 10) / 10,
    }
  },

  /**
   * Get chart data for loan reports
   */
  async getChartData(filters: LoanReportFilters): Promise<LoanCharts> {
    let query = supabase
      .from('loans')
      .select(
        `
        *,
        user:users(id, username, email),
        tool_instance:tool_instances(
          *,
          item_type:item_types(id, name, category)
        )
      `
      )
      .order('loan_date', { ascending: true })

    // Apply filters
    if (filters.dateRange?.start) {
      query = query.gte('loan_date', filters.dateRange.start)
    }
    if (filters.dateRange?.end) {
      query = query.lte('loan_date', filters.dateRange.end)
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }
    if (filters.toolInstanceId) {
      query = query.eq('tool_instance_id', filters.toolInstanceId)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    const { data: loans, error } = await query

    if (error) throw error

    // Loans trend by date
    const loansByDate = new Map<string, number>()
    loans?.forEach((loan) => {
      const date = loan.loan_date.split('T')[0]
      loansByDate.set(date, (loansByDate.get(date) || 0) + 1)
    })
    const loansTrend = Array.from(loansByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Status distribution
    const statusCounts = new Map<string, number>()
    loans?.forEach((loan) => {
      statusCounts.set(loan.status, (statusCounts.get(loan.status) || 0) + 1)
    })
    const statusDistribution = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }))

    // Top 10 tools
    const toolCounts = new Map<string, number>()
    loans?.forEach((loan) => {
      const toolName = (loan.tool_instance as { item_type?: { name?: string } })?.item_type?.name || 'Unknown'
      toolCounts.set(toolName, (toolCounts.get(toolName) || 0) + 1)
    })
    const topTools = Array.from(toolCounts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top 10 users
    const userCounts = new Map<string, number>()
    loans?.forEach((loan) => {
      const username = (loan.user as { username?: string })?.username || 'Unknown'
      userCounts.set(username, (userCounts.get(username) || 0) + 1)
    })
    const topUsers = Array.from(userCounts.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      loansTrend,
      statusDistribution,
      topTools,
      topUsers,
    }
  },

  /**
   * Get detailed loans with pagination
   */
  async getDetailedLoans(
    filters: LoanReportFilters,
    page: number,
    pageSize: number
  ): Promise<{ loans: LoanWithRelations[]; totalCount: number }> {
    // First get total count
    let countQuery = supabase.from('loans').select('*', { count: 'exact', head: true })

    if (filters.dateRange?.start) {
      countQuery = countQuery.gte('loan_date', filters.dateRange.start)
    }
    if (filters.dateRange?.end) {
      countQuery = countQuery.lte('loan_date', filters.dateRange.end)
    }
    if (filters.userId) {
      countQuery = countQuery.eq('user_id', filters.userId)
    }
    if (filters.toolInstanceId) {
      countQuery = countQuery.eq('tool_instance_id', filters.toolInstanceId)
    }
    if (filters.status) {
      countQuery = countQuery.eq('status', filters.status)
    }

    const { count, error: countError } = await countQuery
    if (countError) throw countError

    // Then get paginated data
    let dataQuery = supabase
      .from('loans')
      .select(
        `
        *,
        user:users(id, username, email),
        tool_instance:tool_instances(
          *,
          item_type:item_types(id, name, category)
        )
      `
      )
      .order('loan_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (filters.dateRange?.start) {
      dataQuery = dataQuery.gte('loan_date', filters.dateRange.start)
    }
    if (filters.dateRange?.end) {
      dataQuery = dataQuery.lte('loan_date', filters.dateRange.end)
    }
    if (filters.userId) {
      dataQuery = dataQuery.eq('user_id', filters.userId)
    }
    if (filters.toolInstanceId) {
      dataQuery = dataQuery.eq('tool_instance_id', filters.toolInstanceId)
    }
    if (filters.status) {
      dataQuery = dataQuery.eq('status', filters.status)
    }

    const { data: loans, error: dataError } = await dataQuery
    if (dataError) throw dataError

    // Calculate days overdue for each loan
    const loansWithOverdue = loans?.map((loan) => {
      let daysOverdue: number | undefined
      if (loan.status === 'overdue' || (loan.status === 'active' && loan.due_date)) {
        const dueDate = new Date(loan.due_date)
        const today = new Date()
        const diffTime = today.getTime() - dueDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays > 0) {
          daysOverdue = diffDays
        }
      }

      return {
        ...loan,
        daysOverdue,
      } as LoanWithRelations
    }) || []

    return {
      loans: loansWithOverdue,
      totalCount: count || 0,
    }
  },
}
