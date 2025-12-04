'use client'

import React, { useState, useMemo } from 'react'
import { UnifiedChart } from './UnifiedChart'
import { UnifiedDataTable } from './UnifiedDataTable'
import type {
  UserConsumptionSectionProps,
  UserConsumption,
  ChartData,
  ColumnConfig,
} from '@/types/unified-dashboard'

interface ExtendedUserConsumptionSectionProps {
  filters: UserConsumptionSectionProps['filters']
  usersData?: UserConsumption[]
  loading?: boolean
  onUserClick?: (user: UserConsumption) => void
}

// Icons
const UserIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export function UserConsumptionSection({
  filters,
  usersData = [],
  loading = false,
  onUserClick,
}: ExtendedUserConsumptionSectionProps) {
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserConsumption | null>(null)
  const [sortBy, setSortBy] = useState<'quantity' | 'cost' | 'name'>('quantity')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalUsers = usersData.length
    const totalQuantity = usersData.reduce((sum, u) => sum + u.totalQuantity, 0)
    const totalCost = usersData.reduce((sum, u) => sum + u.totalCost, 0)
    const avgPerUser = totalUsers > 0 ? totalQuantity / totalUsers : 0

    return { totalUsers, totalQuantity, totalCost, avgPerUser }
  }, [usersData])

  // Table columns
  const columns: ColumnConfig<UserConsumption>[] = useMemo(
    () => [
      {
        key: 'username',
        header: 'Usuario',
        sortable: true,
        searchable: true,
        render: (value, row) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <UserIcon />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{value as string}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'totalQuantity',
        header: 'Cantidad Total',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-gray-900 dark:text-white">{value as number}</span>
        ),
      },
      {
        key: 'totalCost',
        header: 'Costo Total',
        sortable: true,
        render: (value) => (
          <span className="font-medium text-green-600 dark:text-green-400">
            ${(value as number).toFixed(2)}
          </span>
        ),
      },
      {
        key: 'byType',
        header: 'Tipos Consumidos',
        render: (value) => {
          const types = value as UserConsumption['byType']
          return (
            <span className="text-gray-600 dark:text-gray-400">
              {types.length} tipo{types.length !== 1 ? 's' : ''}
            </span>
          )
        },
      },
    ],
    []
  )

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...usersData]

    // Apply search
    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(
        (item) =>
          item.username.toLowerCase().includes(search) ||
          item.email.toLowerCase().includes(search)
      )
    }

    // Apply sort
    data.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortBy) {
        case 'quantity':
          aVal = a.totalQuantity
          bVal = b.totalQuantity
          break
        case 'cost':
          aVal = a.totalCost
          bVal = b.totalCost
          break
        case 'name':
        default:
          aVal = a.username
          bVal = b.username
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    return data
  }, [usersData, tableSearch, sortBy, sortDirection])

  const pageSize = 10
  const paginatedData = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, tablePage])

  // Top consumers chart
  const topConsumersChartData: ChartData = useMemo(() => {
    const top5 = [...usersData]
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5)

    return {
      labels: top5.map((u) => u.username),
      datasets: [
        {
          label: 'Cantidad Consumida',
          data: top5.map((u) => u.totalQuantity),
        },
      ],
    }
  }, [usersData])

  // Selected user trend chart
  const userTrendChartData: ChartData = useMemo(() => {
    if (!selectedUser || !selectedUser.trend) {
      return { labels: [], datasets: [{ label: 'Consumo', data: [] }] }
    }

    return {
      labels: selectedUser.trend.map((t) => t.period),
      datasets: [
        {
          label: `Consumo de ${selectedUser.username}`,
          data: selectedUser.trend.map((t) => t.quantity),
        },
      ],
    }
  }, [selectedUser])

  // Selected user breakdown chart
  const userBreakdownChartData: ChartData = useMemo(() => {
    if (!selectedUser || !selectedUser.byType) {
      return { labels: [], datasets: [{ label: 'Por Tipo', data: [] }] }
    }

    return {
      labels: selectedUser.byType.map((t) => t.typeName),
      datasets: [
        {
          label: 'Cantidad por Tipo',
          data: selectedUser.byType.map((t) => t.quantity),
        },
      ],
    }
  }, [selectedUser])

  const handleSort = (field: string) => {
    let newSortBy: 'quantity' | 'cost' | 'name' = 'name'
    if (field === 'totalQuantity') newSortBy = 'quantity'
    else if (field === 'totalCost') newSortBy = 'cost'
    else if (field === 'username') newSortBy = 'name'

    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('desc')
    }
  }

  const handleRowClick = (user: UserConsumption) => {
    setSelectedUser(user)
    onUserClick?.(user)
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Usuarios</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summaryStats.totalUsers}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cantidad Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summaryStats.totalQuantity}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Costo Total</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${summaryStats.totalCost.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Promedio por Usuario</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summaryStats.avgPerUser.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Top Consumers Chart */}
      <UnifiedChart
        type="bar"
        data={topConsumersChartData}
        title="Top 5 Consumidores"
        loading={loading}
        height={250}
      />

      {/* Users Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Consumo por Usuario
          </h3>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'quantity' | 'cost' | 'name')}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
            >
              <option value="name">Ordenar por Nombre</option>
              <option value="quantity">Ordenar por Cantidad</option>
              <option value="cost">Ordenar por Costo</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        <UnifiedDataTable
          data={paginatedData}
          columns={columns}
          loading={loading}
          searchable
          onSearch={setTableSearch}
          pagination={{
            page: tablePage,
            pageSize,
            total: filteredData.length,
            onPageChange: setTablePage,
          }}
          sorting={{
            field: sortBy === 'quantity' ? 'totalQuantity' : sortBy === 'cost' ? 'totalCost' : 'username',
            direction: sortDirection,
            onSort: handleSort,
          }}
          onRowClick={handleRowClick}
          emptyMessage="No se encontraron datos de consumo"
        />
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <UserIcon />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedUser.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UnifiedChart
              type="line"
              data={userTrendChartData}
              title="Tendencia de Consumo"
              loading={loading}
              height={220}
            />
            <UnifiedChart
              type="pie"
              data={userBreakdownChartData}
              title="Desglose por Tipo"
              loading={loading}
              height={220}
            />
          </div>
        </div>
      )}
    </div>
  )
}
