'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import {
  useGetStatisticsSummaryQuery,
  useGetConsumptionStatisticsQuery,
  useGetUsageStatisticsQuery,
  useGetInventoryStatisticsQuery,
  useGetReturnRateStatisticsQuery,
  useGetTopUsersStatisticsQuery,
  useGetCostsStatisticsQuery,
  useGetAlertsStatisticsQuery,
} from '@/services/api'
import {
  MetricCard,
  AlertPanel,
  TimeRangeFilter,
  CategoryFilter,
  ConsumptionChart,
  UsageChart,
  InventoryStatus,
  ReturnRateChart,
  TopUsersTable,
  CostBreakdown,
} from '@/components/statistics'
import type { TimeRange } from '@/types/statistics'

export default function StatisticsPage() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<TimeRange>({ type: 'month' })
  const [category, setCategory] = useState('all')

  // Build query params
  const queryParams = {
    timeRange: timeRange.type,
    ...(timeRange.type === 'custom' && {
      startDate: timeRange.start,
      endDate: timeRange.end,
    }),
    category,
  }

  // Fetch data
  const { data: summary, isLoading: summaryLoading } = useGetStatisticsSummaryQuery(queryParams)
  const { data: consumption } = useGetConsumptionStatisticsQuery({ ...queryParams, groupBy: 'month' })
  const { data: usage } = useGetUsageStatisticsQuery({ ...queryParams, type: 'both' })
  const { data: inventory } = useGetInventoryStatisticsQuery()
  const { data: returnRate } = useGetReturnRateStatisticsQuery({ ...queryParams, groupBy: 'global' })
  const { data: topUsers } = useGetTopUsersStatisticsQuery({ ...queryParams, limit: 20, filterBy: 'both' })
  const { data: costs } = useGetCostsStatisticsQuery({ ...queryParams, groupBy: 'category' })
  const { data: alerts } = useGetAlertsStatisticsQuery()

  const handleAlertClick = (alert: any) => {
    if (alert.link) {
      router.push(alert.link)
    }
  }

  const handleUserClick = (userId: number) => {
    router.push(`/admin/users/${userId}`)
  }

  const handleExportData = () => {
    const wb = XLSX.utils.book_new()

    // Export Top Users
    if (topUsers?.data) {
      const usersData = topUsers.data.map(user => ({
        Rank: user.rank,
        Usuario: user.username,
        Email: user.email,
        'Préstamos Activos': user.activeLoans,
        'Total Consumibles': user.totalConsumables,
        'Costo Total': user.totalCost,
      }))
      const usersWs = XLSX.utils.json_to_sheet(usersData)
      XLSX.utils.book_append_sheet(wb, usersWs, 'Usuarios Activos')
    }

    // Export Inventory
    if (inventory?.data) {
      const inventoryData = inventory.data.map(item => ({
        Artículo: item.name,
        'Stock Actual': item.currentStock,
        'Mínimo': item.minimumThreshold,
        'Unidad': item.unitOfMeasure,
        Estado: item.status,
        'Días Restantes': item.daysUntilEmpty || 'N/A',
        Categoría: item.category || 'N/A',
      }))
      const inventoryWs = XLSX.utils.json_to_sheet(inventoryData)
      XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventario')
    }

    // Export Summary
    if (summary?.data) {
      const summaryData = [{
        'Consumibles Usados': summary.data.totalConsumablesUsed,
        'Total Préstamos': summary.data.totalLoans,
        'Préstamos Activos': summary.data.activeLoans,
        'Préstamos Vencidos': summary.data.overdueLoans,
        'Items Stock Bajo': summary.data.lowStockItems,
        'Costo Total': summary.data.totalCost,
      }]
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen')
    }

    const timestamp = new Date().toISOString().split('T')[0]
    XLSX.writeFile(wb, `estadisticas_${timestamp}.xlsx`)
  }

  if (summaryLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Panel de Estadísticas
          </h1>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar a Excel
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
          <CategoryFilter
            value={category}
            onChange={setCategory}
            options={['Herramientas', 'Electrónicos', 'Consumibles']}
          />
        </div>

        {/* Alerts */}
        {alerts?.data && alerts.data.length > 0 && (
          <AlertPanel alerts={alerts.data} onAlertClick={handleAlertClick} />
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Consumibles Usados"
            value={summary?.data.totalConsumablesUsed || 0}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            }
            color="blue"
          />
          <MetricCard
            title="Préstamos Totales"
            value={summary?.data.totalLoans || 0}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            color="green"
          />
          <MetricCard
            title="Préstamos Activos"
            value={summary?.data.activeLoans || 0}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
          />
          <MetricCard
            title="Préstamos Vencidos"
            value={summary?.data.overdueLoans || 0}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            color="red"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {consumption?.data && (
            <ConsumptionChart
              data={consumption.data}
              timeRange={timeRange}
              groupBy="month"
            />
          )}
          {usage?.data && (
            <UsageChart data={usage.data} type="both" />
          )}
        </div>

        {/* Inventory Status */}
        {inventory?.data && (
          <InventoryStatus items={inventory.data} autoRefresh={true} />
        )}

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {returnRate?.data && (
            <ReturnRateChart data={returnRate.data} groupBy="global" />
          )}
          {costs?.data && (
            <CostBreakdown data={costs.data} chartType="pie" />
          )}
        </div>

        {/* Top Users */}
        {topUsers?.data && (
          <TopUsersTable
            users={topUsers.data}
            limit={20}
            filterBy="both"
            onUserClick={handleUserClick}
          />
        )}
      </div>
    </div>
  )
}
