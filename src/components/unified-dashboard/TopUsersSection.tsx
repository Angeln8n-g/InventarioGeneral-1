'use client'

import React, { useState, useMemo } from 'react'
import { UnifiedDataTable } from './UnifiedDataTable'
import type { TopUser, GlobalFilters, ColumnConfig } from '@/types/unified-dashboard'

type ActivityFilter = 'all' | 'loans' | 'consumables'

interface TopUsersSectionProps {
  filters: GlobalFilters
  topUsers?: TopUser[]
  loading?: boolean
  onUserClick?: (userId: number) => void
}

// Icons
const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

export function TopUsersSection({
  filters,
  topUsers = [],
  loading = false,
  onUserClick,
}: TopUsersSectionProps) {
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all')
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const [sortField, setSortField] = useState<string>('rank')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter users by activity type
  const filteredByActivity = useMemo(() => {
    switch (activityFilter) {
      case 'loans':
        return topUsers.filter((u) => u.activeLoans > 0)
      case 'consumables':
        return topUsers.filter((u) => u.totalConsumables > 0)
      default:
        return topUsers
    }
  }, [topUsers, activityFilter])

  // Table columns
  const columns: ColumnConfig<TopUser>[] = useMemo(
    () => [
      {
        key: 'rank',
        header: '#',
        sortable: true,
        width: '60px',
        render: (value) => {
          const rank = value as number
          if (rank <= 3) {
            const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
            return (
              <span className="flex items-center gap-1">
                <TrophyIcon className={`w-4 h-4 ${colors[rank - 1]}`} />
                {rank}
              </span>
            )
          }
          return rank
        },
      },
      {
        key: 'username',
        header: 'Usuario',
        sortable: true,
        searchable: true,
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <UserIcon />
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{row.username}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'activeLoans',
        header: 'Préstamos Activos',
        sortable: true,
        render: (value) => (
          <span className={`${(value as number) > 0 ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-400'}`}>
            {value as number}
          </span>
        ),
      },
      {
        key: 'totalConsumables',
        header: 'Consumibles',
        sortable: true,
        render: (value) => (
          <span className={`${(value as number) > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}`}>
            {value as number}
          </span>
        ),
      },
      {
        key: 'totalCost',
        header: 'Costo Total',
        sortable: true,
        render: (value) => `$${(value as number).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      },
      {
        key: 'lastActivity',
        header: 'Última Actividad',
        sortable: true,
        render: (value) => {
          if (!value) return '-'
          const date = new Date(value as string)
          const now = new Date()
          const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

          if (diffDays === 0) return 'Hoy'
          if (diffDays === 1) return 'Ayer'
          if (diffDays < 7) return `Hace ${diffDays} días`
          return date.toLocaleDateString('es-ES')
        },
      },
    ],
    []
  )

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let data = [...filteredByActivity]

    if (tableSearch) {
      const search = tableSearch.toLowerCase()
      data = data.filter(
        (item) =>
          item.username.toLowerCase().includes(search) ||
          item.email.toLowerCase().includes(search)
      )
    }

    data.sort((a, b) => {
      const aVal = a[sortField as keyof TopUser]
      const bVal = b[sortField as keyof TopUser]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })

    return data
  }, [filteredByActivity, tableSearch, sortField, sortDirection])

  const pageSize = 10
  const paginatedData = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, tablePage])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filterButtons: { value: ActivityFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'loans', label: 'Con Préstamos' },
    { value: 'consumables', label: 'Con Consumibles' },
  ]

  return (
    <div className="space-y-6">
      {/* Header with filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Usuarios Más Activos
        </h3>
        <div className="flex gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => {
                setActivityFilter(btn.value)
                setTablePage(1)
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activityFilter === btn.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Usuarios Activos</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredByActivity.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Préstamos</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {filteredByActivity.reduce((sum, u) => sum + u.activeLoans, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Consumibles</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {filteredByActivity.reduce((sum, u) => sum + u.totalConsumables, 0)}
          </p>
        </div>
      </div>

      {/* Users Table */}
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
          field: sortField,
          direction: sortDirection,
          onSort: handleSort,
        }}
        onRowClick={(row) => onUserClick?.(row.userId)}
        emptyMessage="No se encontraron usuarios activos"
      />
    </div>
  )
}
