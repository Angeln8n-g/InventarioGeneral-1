import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/app/store'
import type { 
  User, 
  ToolInstance, 
  Loan, 
  ConsumableStock, 
  Notification 
} from '@/types/database'
import type { NotificationPreferences, NotificationFilter } from '@/types/notifications'

// Additional types for new mutations
interface BatchLoanRequest {
  tool_instance_ids: number[]
  notes?: string
}

interface BatchLoanResponse {
  success: boolean
  data: {
    created: Loan[]
    failed: Array<{ tool_instance_id: number; error: string }>
    summary: {
      total: number
      successful: number
      failed: number
    }
  }
  message: string
}

interface ConsumeConsumableRequest {
  qr_code: string
  quantity: number
  notes?: string
}

interface ConsumeConsumableResponse {
  data: {
    item_type: {
      name: string
      description?: string
    }
    previous_quantity: number
    consumed_quantity: number
    remaining_quantity: number
    unit_of_measure?: string
    is_low_stock: boolean
  }
  message: string
}

interface ReturnConsumableRequest {
  returns: Array<{
    item_type_id: number
    returned_quantity: number
    consumption_date: string
    notes?: string
  }>
}

interface ReturnConsumableResponse {
  data: {
    returns: unknown[]
    stock_updated: unknown[]
  }
  message: string
  total_returned: number
}

interface ConsumptionHistoryItem {
  consumption_date: string
  items: Array<{
    item_type_id: number
    consumable_stock_id: number
    item_name: string
    item_description?: string
    consumed_quantity: number
    returned_quantity: number
    returnable_quantity: number
    unit_of_measure: string
  }>
  total_items: number
  total_consumed: number
  total_returnable: number
}

interface MyConsumptionsResponse {
  data: ConsumptionHistoryItem[]
  total_dates: number
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ['Tool', 'Loan', 'Consumable', 'Notification', 'User', 'NotificationPreferences'],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation<
      { user: User; token: string },
      { username: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    // Tool endpoints
    getToolByQR: builder.query<{ data: ToolInstance }, string>({
      query: (qrCode) => `/tools/qr/${qrCode}`,
      providesTags: ['Tool'],
    }),

    // Loan endpoints
    createLoan: builder.mutation<
      { data: Loan },
      { toolInstanceId: number; dueDate: string; notes?: string }
    >({
      query: (loanData) => ({
        url: '/loans',
        method: 'POST',
        body: loanData,
      }),
      invalidatesTags: ['Loan', 'Tool'],
    }),

    /**
     * Create multiple loans in a single batch operation
     * @param tool_instance_ids - Array of tool instance IDs to loan
     * @param notes - Optional notes for all loans
     * @returns Batch loan creation result with success/failure details
     */
    createBatchLoans: builder.mutation<BatchLoanResponse, BatchLoanRequest>({
      query: (batchData) => ({
        url: '/loans/batch',
        method: 'POST',
        body: batchData,
      }),
      invalidatesTags: ['Loan', 'Tool', 'Notification'],
    }),

    returnTool: builder.mutation<{ data: Loan }, number>({
      query: (loanId) => ({
        url: `/loans/${loanId}/return`,
        method: 'PUT',
      }),
      invalidatesTags: ['Loan', 'Tool'],
    }),

    getMyLoans: builder.query<{ data: Loan[] }, void>({
      query: () => '/loans/my',
      providesTags: ['Loan'],
      keepUnusedDataFor: 300, // 5 minutes - frequently accessed
    }),

    getAllActiveLoans: builder.query<{ data: Loan[]; total: number }, void>({
      query: () => '/loans/all-active',
      providesTags: ['Loan'],
      keepUnusedDataFor: 180, // 3 minutes
    }),

    getAvailableTools: builder.query<{
      data: Array<{
        item_type_id: number
        name: string
        description?: string
        category?: string
        available_count: number
      }>
      total: number
      total_available_tools: number
    }, void>({
      query: () => '/tools/available',
      providesTags: ['Tool'],
      keepUnusedDataFor: 180, // 3 minutes
    }),

    // Consumable endpoints
    getConsumables: builder.query<{ data: ConsumableStock[]; total: number; filters: Record<string, unknown> }, void>({
      query: () => '/consumables',
      providesTags: ['Consumable'],
      keepUnusedDataFor: 180, // 3 minutes - moderate volatility
    }),

    requestConsumable: builder.mutation<
      { data: ConsumableStock },
      { itemTypeId: number; quantity: number; notes?: string }
    >({
      query: (requestData) => ({
        url: '/consumables/request',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Consumable'],
    }),

    /**
     * Consume a consumable item by QR code
     * @param qr_code - QR code of the consumable
     * @param quantity - Quantity to consume
     * @param notes - Optional notes
     * @returns Consumption result with updated stock information
     */
    consumeConsumable: builder.mutation<ConsumeConsumableResponse, ConsumeConsumableRequest>({
      query: (consumeData) => ({
        url: '/consumables/consume',
        method: 'POST',
        body: consumeData,
      }),
      invalidatesTags: ['Consumable', 'Notification'],
    }),

    /**
     * Return previously consumed consumables
     * @param returns - Array of return items with quantities and dates
     * @returns Return processing result
     */
    returnConsumable: builder.mutation<ReturnConsumableResponse, ReturnConsumableRequest>({
      query: (returnData) => ({
        url: '/consumables/return',
        method: 'POST',
        body: returnData,
      }),
      invalidatesTags: ['Consumable'],
    }),

    /**
     * Get user's consumption history grouped by date
     * @returns Consumption history with returnable quantities
     */
    getMyConsumptions: builder.query<MyConsumptionsResponse, void>({
      query: () => '/consumables/my-consumption',
      providesTags: ['Consumable'],
      keepUnusedDataFor: 180, // 3 minutes
    }),

    // Notification endpoints
    getNotifications: builder.query<
      { data: Notification[]; total: number; unread_count: number; page: number; limit: number; totalPages: number }, 
      { page?: number; limit?: number; filters?: NotificationFilter } | void
    >({
      query: (params) => {
        const searchParams = new URLSearchParams()
        if (params) {
          if (params.page) searchParams.append('page', params.page.toString())
          if (params.limit) searchParams.append('limit', params.limit.toString())
          if (params.filters?.type) searchParams.append('type', params.filters.type)
          if (params.filters?.read !== undefined) searchParams.append('read', params.filters.read.toString())
          if (params.filters?.startDate) searchParams.append('start_date', params.filters.startDate)
          if (params.filters?.endDate) searchParams.append('end_date', params.filters.endDate)
        }
        return `/notifications?${searchParams.toString()}`
      },
      providesTags: ['Notification'],
      // Keep previous data on error to avoid UI flashing
      keepUnusedDataFor: 60,
      // Return empty data on error instead of throwing
      transformErrorResponse: (response) => {
        console.warn('Notifications API error (non-critical):', response)
        return response
      },
    }),

    markNotificationAsRead: builder.mutation<{ data: Notification; message: string }, number>({
      query: (notificationId) => ({
        url: '/notifications',
        method: 'PUT',
        body: {
          action: 'mark_read',
          notification_id: notificationId,
        },
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsAsRead: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/notifications',
        method: 'PUT',
        body: {
          action: 'mark_all_read',
        },
      }),
      invalidatesTags: ['Notification'],
    }),

    deleteNotification: builder.mutation<{ message: string }, number>({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Notification preferences endpoints
    getNotificationPreferences: builder.query<{ data: NotificationPreferences }, void>({
      query: () => '/notifications/preferences',
      providesTags: ['NotificationPreferences'],
    }),

    updateNotificationPreferences: builder.mutation<
      { data: NotificationPreferences; message: string }, 
      Partial<NotificationPreferences>
    >({
      query: (preferences) => ({
        url: '/notifications/preferences',
        method: 'PUT',
        body: preferences,
      }),
      invalidatesTags: ['NotificationPreferences'],
    }),

    // Admin endpoints
    getDashboardStats: builder.query<{
      data: {
        totalTools: number
        availableTools: number
        loanedTools: number
        overdueLoans: number
        totalUsers: number
        activeLoans: number
        consumableTypes: number
        totalConsumables: number
        lowStockItems: number
        totalElectronics: number
      }
    }, void>({
      query: () => '/admin/dashboard/stats',
      keepUnusedDataFor: 60, // 1 minute - high volatility
    }),

    getToolQRImage: builder.query<Blob, number>({
      query: (toolId) => ({
        url: `/admin/tools/${toolId}/qr-image`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    adjustToolStatus: builder.mutation<
      { data: ToolInstance },
      { toolId: number; status: string; justification: string }
    >({
      query: ({ toolId, ...data }) => ({
        url: `/admin/tools/${toolId}/adjust`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tool'],
    }),

    // Statistics endpoints
    getStatisticsSummary: builder.query<
      { data: {
        totalConsumablesUsed: number
        totalLoans: number
        activeLoans: number
        overdueLoans: number
        lowStockItems: number
        totalCost: number
      }},
      { timeRange?: string; startDate?: string; endDate?: string; category?: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/summary',
        params,
      }),
      keepUnusedDataFor: 300, // 5 minutes
    }),

    getConsumptionStatistics: builder.query<
      { data: Array<{
        period: string
        consumables: Record<string, number>
        total: number
      }>},
      { timeRange?: string; groupBy?: string; startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/consumption',
        params,
      }),
      keepUnusedDataFor: 300,
    }),

    getUsageStatistics: builder.query<
      { data: Array<{
        name: string
        totalLoans: number
        activeLoans: number
        availability: number
        avgLoanDuration: number
      }>},
      { timeRange?: string; type?: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/usage',
        params,
      }),
      keepUnusedDataFor: 300,
    }),

    getInventoryStatistics: builder.query<
      { data: Array<{
        id: number
        name: string
        currentStock: number
        minimumThreshold: number
        status: 'critical' | 'low' | 'normal' | 'high'
        daysUntilEmpty: number | null
        unitOfMeasure: string
        category?: string
      }>},
      void
    >({
      query: () => '/admin/statistics/inventory',
      keepUnusedDataFor: 30, // 30 seconds - auto-refresh
    }),

    getReturnRateStatistics: builder.query<
      { data: {
        totalLoans: number
        onTimeReturns: number
        lateReturns: number
        returnRate: number
        avgDelayDays: number
        byUser?: Array<{
          userId: number
          username: string
          returnRate: number
          lateReturns: number
        }>
      }},
      { timeRange?: string; groupBy?: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/return-rate',
        params,
      }),
      keepUnusedDataFor: 300,
    }),

    getTrendsStatistics: builder.query<
      { data: {
        current: {
          period: string
          consumablesUsed: number
          loansCreated: number
          avgLoanDuration: number
          costs: number
        }
        previous: {
          period: string
          consumablesUsed: number
          loansCreated: number
          avgLoanDuration: number
          costs: number
        }
        change: {
          consumablesUsed: number
          loansCreated: number
          avgLoanDuration: number
          costs: number
        }
      }},
      { currentStart: string; currentEnd: string; previousStart: string; previousEnd: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/trends',
        params,
      }),
      keepUnusedDataFor: 300,
    }),

    getTopUsersStatistics: builder.query<
      { data: Array<{
        userId: number
        username: string
        email: string
        activeLoans: number
        totalConsumables: number
        totalCost: number
        rank: number
      }>},
      { timeRange?: string; limit?: number; filterBy?: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/top-users',
        params,
      }),
      keepUnusedDataFor: 300,
    }),

    getCostsStatistics: builder.query<
      { data: Array<{
        category: string
        cost: number
        percentage: number
        items: number
      }>},
      { timeRange?: string; groupBy?: string }
    >({
      query: (params) => ({
        url: '/admin/statistics/costs',
        params,
      }),
      keepUnusedDataFor: 300,
    }),

    getAlertsStatistics: builder.query<
      { data: Array<{
        id: number
        type: 'critical_stock' | 'overdue_loans' | 'low_availability'
        severity: 'critical' | 'warning' | 'info'
        title: string
        message: string
        link?: string
        timestamp: string
      }>},
      void
    >({
      query: () => '/admin/statistics/alerts',
      keepUnusedDataFor: 60, // 1 minute - frequently updated
    }),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetToolByQRQuery,
  useCreateLoanMutation,
  useCreateBatchLoansMutation,
  useReturnToolMutation,
  useGetMyLoansQuery,
  useGetAllActiveLoansQuery,
  useGetAvailableToolsQuery,
  useGetConsumablesQuery,
  useRequestConsumableMutation,
  useConsumeConsumableMutation,
  useReturnConsumableMutation,
  useGetMyConsumptionsQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetDashboardStatsQuery,
  useGetToolQRImageQuery,
  useAdjustToolStatusMutation,
  useGetStatisticsSummaryQuery,
  useGetConsumptionStatisticsQuery,
  useGetUsageStatisticsQuery,
  useGetInventoryStatisticsQuery,
  useGetReturnRateStatisticsQuery,
  useGetTrendsStatisticsQuery,
  useGetTopUsersStatisticsQuery,
  useGetCostsStatisticsQuery,
  useGetAlertsStatisticsQuery,
} = api