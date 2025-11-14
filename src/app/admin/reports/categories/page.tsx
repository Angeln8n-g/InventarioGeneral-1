'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { 
  Layers, 
  Wrench, 
  Package, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface CategoryData {
  category: string
  tools: {
    total: number
    available: number
    loaned: number
    maintenance: number
    utilizationRate: number
  }
  consumables: {
    total: number
    lowStock: number
    totalStock: number
  }
  loans: {
    active: number
    totalLoans: number
  }
  itemTypes: number
}

interface ReportData {
  categories: CategoryData[]
  metrics: {
    totalCategories: number
    totalTools: number
    totalConsumables: number
    totalActiveLoans: number
    avgUtilization: number
  }
  charts: {
    toolsByCategory: Array<{ category: string; count: number }>
    consumablesByCategory: Array<{ category: string; count: number }>
    utilizationByCategory: Array<{ category: string; rate: number }>
    loansByCategory: Array<{ category: string; count: number }>
  }
}

export default function CategoriesReportPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)

  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchReportData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/reports/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al cargar el reporte')
      }

      const data = await response.json()
      setReportData(data.data)
    } catch (err) {
      console.error('Error fetching report:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchReportData()
    }
  }, [isAuthenticated, isAdmin, fetchReportData])

  const selectedCategoryData = selectedCategory
    ? reportData?.categories.find(c => c.category === selectedCategory)
    : null

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Reportes por Categoría">
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

  return (
    <ProtectedRoute>
      <AppLayout title="Reportes por Categoría">
        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard de Categorías
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis completo del inventario organizado por categorías
              </p>
            </div>
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Actualizar
            </button>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando datos...</p>
            </div>
          )}

          {/* Overall Metrics */}
          {reportData && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 mr-4">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Categorías</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.metrics.totalCategories}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mr-4">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Herramientas</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.metrics.totalTools}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 mr-4">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Materiales</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.metrics.totalConsumables}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 mr-4">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Préstamos</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.metrics.totalActiveLoans}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 mr-4">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Utilización</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.metrics.avgUtilization.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Grid */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Categorías Detalladas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reportData.categories.map((category) => (
                    <div
                      key={category.category}
                      onClick={() => setSelectedCategory(
                        selectedCategory === category.category ? null : category.category
                      )}
                      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                        selectedCategory === category.category
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                      } p-6`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {category.category}
                        </h3>
                        <ArrowRight className={`w-5 h-5 transition-transform ${
                          selectedCategory === category.category ? 'rotate-90' : ''
                        } text-gray-400`} />
                      </div>

                      <div className="space-y-3">
                        {/* Tools */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Herramientas</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.tools.total}
                          </span>
                        </div>

                        {/* Materials */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Materiales</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.consumables.total}
                          </span>
                        </div>

                        {/* Active Loans */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Préstamos</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {category.loans.active}
                          </span>
                        </div>

                        {/* Utilization */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Utilización</span>
                          </div>
                          <span className={`font-medium ${
                            category.tools.utilizationRate > 70
                              ? 'text-green-600 dark:text-green-400'
                              : category.tools.utilizationRate > 40
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {category.tools.utilizationRate.toFixed(1)}%
                          </span>
                        </div>

                        {/* Warnings */}
                        {category.consumables.lowStock > 0 && (
                          <div className="flex items-center text-xs text-red-600 dark:text-red-400 pt-2">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {category.consumables.lowStock} material{category.consumables.lowStock > 1 ? 'es' : ''} con stock bajo
                          </div>
                        )}

                        {category.tools.maintenance > 0 && (
                          <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {category.tools.maintenance} herramienta{category.tools.maintenance > 1 ? 's' : ''} en mantenimiento
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Category Detail */}
              {selectedCategoryData && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Detalle de {selectedCategoryData.category}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tools Detail */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <Wrench className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Herramientas
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Total:</span>
                          <span className="font-medium">{selectedCategoryData.tools.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Disponibles:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {selectedCategoryData.tools.available}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Prestadas:</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">
                            {selectedCategoryData.tools.loaned}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Mantenimiento:</span>
                          <span className="font-medium text-yellow-600 dark:text-yellow-400">
                            {selectedCategoryData.tools.maintenance}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Materials Detail */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <Package className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
                        Materiales
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tipos:</span>
                          <span className="font-medium">{selectedCategoryData.consumables.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Stock Total:</span>
                          <span className="font-medium">{selectedCategoryData.consumables.totalStock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Stock Bajo:</span>
                          <span className={`font-medium ${
                            selectedCategoryData.consumables.lowStock > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {selectedCategoryData.consumables.lowStock}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Loans Detail */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                        Préstamos
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Activos:</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {selectedCategoryData.loans.active}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tipos de Items:</span>
                          <span className="font-medium">{selectedCategoryData.itemTypes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Tasa Utilización:</span>
                          <span className={`font-medium ${
                            selectedCategoryData.tools.utilizationRate > 70
                              ? 'text-green-600 dark:text-green-400'
                              : selectedCategoryData.tools.utilizationRate > 40
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {selectedCategoryData.tools.utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2">
                      {selectedCategoryData.tools.available > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {selectedCategoryData.tools.available} disponibles
                        </span>
                      )}
                      {selectedCategoryData.consumables.lowStock > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {selectedCategoryData.consumables.lowStock} con stock bajo
                        </span>
                      )}
                      {selectedCategoryData.tools.maintenance > 0 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {selectedCategoryData.tools.maintenance} en mantenimiento
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
