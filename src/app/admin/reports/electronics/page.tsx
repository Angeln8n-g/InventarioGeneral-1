'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { Monitor, CheckCircle, TrendingUp, AlertTriangle, Download } from 'lucide-react'
import { generateElectronicsReport, exportElectronicsReportToCSV, type ElectronicsReportData } from '@/lib/reports/electronics-reports'

export default function ElectronicsReportsPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)

  const [reportData, setReportData] = useState<ElectronicsReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    brand: '',
  })

  useEffect(() => {
    if (token) {
      loadReport()
    }
  }, [token, filters])

  const loadReport = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const filterParams: any = {}
      if (filters.status) filterParams.status = filters.status
      if (filters.category) filterParams.category = filters.category
      if (filters.brand) filterParams.brand = filters.brand

      const data = await generateElectronicsReport(filterParams)
      setReportData(data)
    } catch (err) {
      console.error('Error loading report:', err)
      setError(err instanceof Error ? err.message : 'Failed to load report')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!reportData) return

    const csv = exportElectronicsReportToCSV(reportData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `electronics-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Electronics Report">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  const metrics = reportData
    ? [
        {
          label: 'Total Devices',
          value: reportData.totalDevices,
          icon: <Monitor className="w-6 h-6" />,
          color: 'blue',
          change: null,
        },
        {
          label: 'Available',
          value: reportData.availableDevices,
          icon: <CheckCircle className="w-6 h-6" />,
          color: 'green',
          percentage: reportData.totalDevices > 0 ? (reportData.availableDevices / reportData.totalDevices) * 100 : 0,
        },
        {
          label: 'Utilization Rate',
          value: `${reportData.utilizationRate.toFixed(1)}%`,
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'purple',
          change: null,
        },
        {
          label: 'Maintenance',
          value: reportData.maintenanceDevices,
          icon: <AlertTriangle className="w-6 h-6" />,
          color: 'orange',
          percentage: reportData.totalDevices > 0 ? (reportData.maintenanceDevices / reportData.totalDevices) * 100 : 0,
        },
      ]
    : []

  return (
    <ProtectedRoute>
      <AppLayout title="Electronics Report">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Electronics Inventory Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive analysis of electronic devices inventory
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="loaned">Loaned</option>
                  <option value="out-of-service">Out of Service</option>
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Tablets">Tablets</option>
                  <option value="Smartphones">Smartphones</option>
                  <option value="Periféricos">Periféricos</option>
                  <option value="Digitales">Digitales</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="md:col-span-2 flex items-end">
                <button
                  onClick={handleExportCSV}
                  disabled={!reportData}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading report...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Metrics */}
          {reportData && !isLoading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {metrics.map((metric, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                      <div className={`text-${metric.color}-600 dark:text-${metric.color}-400`}>
                        {metric.icon}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </div>
                    {metric.percentage !== undefined && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {metric.percentage.toFixed(1)}% of total
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* By Status */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Devices by Status
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(reportData.byStatus).map(([status, count]) => (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {status.replace('-', ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / reportData.totalDevices) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Category */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Devices by Category
                  </h3>
                  <div className="space-y-3">
                    {reportData.topCategories.map((item) => (
                      <div key={item.category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.category}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.count}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(item.count / reportData.totalDevices) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Brands */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Brands
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {reportData.topBrands.map((brand, index) => (
                    <div
                      key={brand.brand}
                      className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        #{index + 1}
                      </div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {brand.brand}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {brand.count} devices
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
