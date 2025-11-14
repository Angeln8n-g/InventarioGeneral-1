'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import ReportFilters from '@/components/reports/ReportFilters'
import ReportMetrics from '@/components/reports/ReportMetrics'
import ExportButton from '@/components/reports/ExportButton'
import TabNavigation from '@/components/reports/TabNavigation'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Users, BarChart3, Activity } from 'lucide-react'
import type {
  ConsumableReportFilters,
  ConsumableReportData,
  FilterConfig,
  Metric,
  ConsumableStockWithType,
} from '@/types/reports'

export default function ConsumableReportsPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)

  const [filters, setFilters] = useState<ConsumableReportFilters>({})
  const [reportData, setReportData] = useState<ConsumableReportData | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([])
  const [expandedUsers, setExpandedUsers] = useState<Set<number>>(new Set())

  // Fetch categories and users
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return
      try {
        const [categoriesResponse, usersResponse] = await Promise.all([
          fetch('/api/admin/item-types?consumables_only=true', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        if (categoriesResponse.ok) {
          const data = await categoriesResponse.json()
          const uniqueCategories = Array.from(
            new Set(
              data.data
                .map((type: { category?: string }) => type.category)
                .filter((cat: string | undefined): cat is string => !!cat)
            )
          ).sort() as string[]
          setCategories(uniqueCategories)
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.data || [])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }
    fetchData()
  }, [token])

  const availableFilters: FilterConfig[] = [
    {
      type: 'search',
      name: 'search',
      label: 'Buscar por Nombre',
      placeholder: 'Nombre del material...',
    },
    {
      type: 'select',
      name: 'category',
      label: 'Categoría',
      options: categories.map(cat => ({ value: cat, label: cat })),
      placeholder: 'Todas las categorías',
    },
    {
      type: 'select',
      name: 'userId',
      label: 'Usuario',
      options: users.map(user => ({ value: user.id.toString(), label: user.username })),
      placeholder: 'Todos los usuarios',
    },
    {
      type: 'date-range',
      name: 'dateRange',
      label: 'Rango de Fechas',
    },
    {
      type: 'select',
      name: 'stockLevel',
      label: 'Nivel de Stock',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'adequate', label: 'Adecuado' },
        { value: 'low', label: 'Bajo' },
        { value: 'critical', label: 'Crítico' },
      ],
      placeholder: 'Todos los niveles',
    },
  ]

  const fetchReportData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.userId) params.append('user_id', filters.userId.toString())
      if (filters.dateRange?.start) params.append('start_date', filters.dateRange.start)
      if (filters.dateRange?.end) params.append('end_date', filters.dateRange.end)
      if (filters.stockLevel) params.append('stock_level', filters.stockLevel)

      const response = await fetch(`/api/admin/reports/consumables?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle token expiration
        if (response.status === 401 || errorData.error?.code === 'AUTHENTICATION_ERROR') {
          // Token expired, redirect to login
          window.location.href = '/login?expired=true'
          return
        }
        
        throw new Error(errorData.error?.message || 'Error al cargar el reporte')
      }

      const data = await response.json()
      setReportData(data.data)
    } catch (err) {
      console.error('Error fetching report:', err)
      
      // Check if it's a network error or token issue
      if (err instanceof Error && err.message.includes('Token expired')) {
        window.location.href = '/login?expired=true'
        return
      }
      
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [token, filters])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchReportData()
    }
  }, [isAuthenticated, isAdmin, fetchReportData])

  const handleFiltersChange = (newFilters: ConsumableReportFilters) => {
    if (newFilters.userId && typeof newFilters.userId === 'string') {
      newFilters.userId = parseInt(newFilters.userId, 10)
    }
    setFilters(newFilters as ConsumableReportFilters)
  }

  const toggleUserExpand = (userId: number) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedUsers(newExpanded)
  }

  // Export handlers
  const handleExportCSV = () => {
    if (!reportData) return
    
    const csvData: any[] = []
    reportData.categories.forEach(category => {
      category.items.forEach(item => {
        csvData.push({
          'ID': item.id,
          'Nombre': item.item_type.name,
          'Categoría': category.category,
          'Stock Actual': item.current_quantity,
          'Mínimo': item.minimum_threshold,
          'Consumido': item.consumptionInPeriod,
          'Devuelto': item.returnsInPeriod,
          'Neto': item.consumptionInPeriod - item.returnsInPeriod,
          'Estado': item.status === 'adequate' ? 'Adecuado' : item.status === 'low' ? 'Bajo' : 'Crítico',
        })
      })
    })

    const headers = Object.keys(csvData[0] || {})
    const rows = csvData.map(row => headers.map(h => row[h]))
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `consumables-report-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportPDF = () => {
    alert('Exportación a PDF disponible próximamente')
  }

  const handleExportExcel = () => {
    alert('Exportación a Excel disponible próximamente')
  }

  // Prepare metrics
  const metrics: Metric[] = reportData
    ? [
      {
        id: 'totalTypes',
        label: 'Tipos de Materiales',
        value: reportData.metrics.totalTypes,
        icon: <Package className="w-6 h-6" />,
        color: 'blue' as const,
        format: 'number' as const,
      },
      {
        id: 'lowStock',
        label: 'Items con Stock Bajo',
        value: reportData.metrics.lowStockItems,
        icon: <AlertTriangle className="w-6 h-6" />,
        color: 'red' as const,
        format: 'number' as const,
      },
      {
        id: 'totalConsumption',
        label: 'Total Consumido',
        value: reportData.metrics.totalConsumption,
        icon: <TrendingDown className="w-6 h-6" />,
        color: 'blue' as const,
        format: 'number' as const,
      },
      {
        id: 'totalReturned',
        label: 'Total Devuelto',
        value: reportData.metrics.totalReturnedItems || 0,
        icon: <TrendingUp className="w-6 h-6" />,
        color: 'green' as const,
        format: 'number' as const,
      },
    ]
    : []

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Historial de Materiales">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  // Tab 1: Consumo por Usuario
  const userConsumptionTab = (
    <div className="space-y-6">
      {reportData?.metrics.userConsumption && reportData.metrics.userConsumption.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla de Usuarios */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Consumo por Usuario
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {reportData.metrics.userConsumption.map((user) => {
                  const totalConsumption = reportData.metrics.totalConsumption
                  const percentage = totalConsumption > 0 
                    ? ((user.totalConsumed / totalConsumption) * 100).toFixed(1)
                    : '0.0'
                  const isExpanded = expandedUsers.has(user.userId)

                  return (
                    <div
                      key={user.userId}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <button
                        onClick={() => toggleUserExpand(user.userId)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.totalConsumed} items ({percentage}% del total)
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                              {user.totalConsumed}
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {isExpanded && user.itemsConsumed.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                          {user.itemsConsumed.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm text-gray-600 dark:text-gray-400"
                            >
                              <span>• {item.itemName}</span>
                              <span className="font-medium">{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Gráfico de Barras */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Top 10 Usuarios
              </h3>
              <div className="space-y-3">
                {reportData.charts.userConsumptionChart.map((user, idx) => {
                  const maxValue = reportData.charts.userConsumptionChart[0]?.total || 1
                  const percentage = (user.total / maxValue) * 100

                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {user.username}
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold">
                          {user.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No hay datos de consumo por usuario en el período seleccionado
        </div>
      )}
    </div>
  )

  // Tab 2: Análisis por Categoría
  const categoryAnalysisTab = (
    <div className="space-y-6">
      {/* Category Cards */}
      {reportData && reportData.categories.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selecciona una Categoría
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportData.categories.map((category) => (
              <button
                key={category.category}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.category ? null : category.category
                )}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedCategory === category.category
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow'
                }`}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {category.category}
                </h4>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span className="font-medium">{category.totalItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock Total:</span>
                    <span className="font-medium">{category.totalStock}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Consumido:</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {category.consumption}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock Bajo:</span>
                    <span className={`font-medium ${
                      category.lowStockCount > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {category.lowStockCount}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Detail Table */}
      {selectedCategory && reportData && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detalle de {selectedCategory}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Consumido
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Devuelto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Neto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Mínimo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData.categories
                  .find((c) => c.category === selectedCategory)
                  ?.items.map((item) => {
                    const netConsumption = item.consumptionInPeriod - item.returnsInPeriod
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.item_type.name}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {item.current_quantity}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {item.consumptionInPeriod}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 dark:text-green-400">
                          {item.returnsInPeriod}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                          {netConsumption}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.minimum_threshold}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.status === 'adequate'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : item.status === 'low'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {item.status === 'adequate' ? 'Adecuado' : item.status === 'low' ? 'Bajo' : 'Crítico'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedCategory && reportData && reportData.categories.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Selecciona una categoría para ver el detalle
        </div>
      )}
    </div>
  )

  // Tab 3: Tendencias
  const trendsTab = (
    <div className="space-y-6">
      {/* Consumption vs Returns Chart */}
      {reportData?.charts.consumptionVsReturns && reportData.charts.consumptionVsReturns.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Consumo vs Devoluciones en el Tiempo
          </h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {reportData.charts.consumptionVsReturns.slice(-14).map((data, idx) => {
              const maxValue = Math.max(
                ...reportData.charts.consumptionVsReturns.map((d) => Math.max(d.consumed, d.returned))
              )
              const consumedHeight = maxValue > 0 ? (data.consumed / maxValue) * 100 : 0
              const returnedHeight = maxValue > 0 ? (data.returned / maxValue) * 100 : 0

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1 h-48">
                    <div
                      className="w-1/2 bg-blue-500 dark:bg-blue-600 rounded-t transition-all"
                      style={{ height: `${consumedHeight}%` }}
                      title={`Consumido: ${data.consumed}`}
                    />
                    <div
                      className="w-1/2 bg-green-500 dark:bg-green-600 rounded-t transition-all"
                      style={{ height: `${returnedHeight}%` }}
                      title={`Devuelto: ${data.returned}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 rotate-45 origin-left">
                    {new Date(data.date).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Consumido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Devuelto</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Consumed */}
        {reportData?.charts.topConsumed && reportData.charts.topConsumed.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Más Consumidos
            </h3>
            <div className="space-y-3">
              {reportData.charts.topConsumed.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.itemName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} unidades
                    </div>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Returned */}
        {reportData?.charts.topReturned && reportData.charts.topReturned.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Más Devueltos
            </h3>
            <div className="space-y-3">
              {reportData.charts.topReturned.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.itemName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} unidades
                    </div>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {item.quantity}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      {reportData && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Métricas Adicionales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Consumo Diario Promedio
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.metrics.avgDailyConsumption}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Consumo Neto
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.metrics.totalConsumption - (reportData.metrics.totalReturnedItems || 0)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Tasa de Devolución
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.metrics.totalConsumption > 0
                  ? (((reportData.metrics.totalReturnedItems || 0) / reportData.metrics.totalConsumption) * 100).toFixed(1)
                  : '0.0'}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ProtectedRoute>
      <AppLayout title="Historial de Materiales">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                📦 Historial de Materiales
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis completo de consumo, devoluciones y tendencias
              </p>
            </div>
            
            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                disabled={!reportData}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 CSV
              </button>
              <button
                onClick={handleExportPDF}
                disabled={!reportData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📑 PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={!reportData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 Excel
              </button>
            </div>
          </div>

          {/* Filters */}
          <ReportFilters
            filters={filters}
            onFiltersChange={
              handleFiltersChange as (filters: import('@/types/reports').ReportFilters) => void
            }
            availableFilters={availableFilters}
            isLoading={isLoading}
          />

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Metrics - Enhanced Visual Cards */}
          {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Types */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.metrics.totalTypes}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tipos de Materiales
                </h3>
              </div>

              {/* Low Stock */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.metrics.lowStockItems}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Items con Stock Bajo
                </h3>
                {reportData.metrics.lowStockItems > 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    ⚠️ Requiere atención
                  </p>
                )}
              </div>

              {/* Total Consumption */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingDown className="w-8 h-8 text-blue-600" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.metrics.totalConsumption}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Consumido
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Promedio: {reportData.metrics.avgDailyConsumption}/día
                </p>
              </div>

              {/* Total Returned */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {reportData.metrics.totalReturnedItems || 0}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Devuelto
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Tasa: {reportData.metrics.totalConsumption > 0
                    ? (((reportData.metrics.totalReturnedItems || 0) / reportData.metrics.totalConsumption) * 100).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </div>
          )}

          {isLoading && !reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          {reportData && (
            <TabNavigation
              tabs={[
                {
                  id: 'users',
                  label: 'Consumo por Usuario',
                  icon: <Users className="w-4 h-4" />,
                  content: userConsumptionTab,
                },
                {
                  id: 'categories',
                  label: 'Por Categoría',
                  icon: <BarChart3 className="w-4 h-4" />,
                  content: categoryAnalysisTab,
                },
                {
                  id: 'trends',
                  label: 'Tendencias',
                  icon: <Activity className="w-4 h-4" />,
                  content: trendsTab,
                },
              ]}
              defaultTab="users"
            />
          )}

          {/* Loading State */}
          {isLoading && !reportData && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-4">Cargando reporte...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !reportData && !error && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No hay datos disponibles. Ajusta los filtros para ver el reporte.
              </p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
