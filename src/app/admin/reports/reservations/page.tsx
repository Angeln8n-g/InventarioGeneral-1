'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { useRequireAdmin } from '@/hooks/useAuth'
import { Package, Users, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import type { ReservationDetails } from '@/types/database'

// Lazy load AppLayout to avoid SSR issues
const AppLayout = dynamic(() => import('@/components/layout/AppLayout'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
})

// Export functions will be implemented inline

interface ReservationStats {
  total: number
  active: number
  fulfilled: number
  cancelled: number
  expired: number
  expiring_soon: number
  total_users: number
  avg_duration_days: number
  fulfillment_rate: number
}

interface ItemReservationStats {
  item_name: string
  item_category: string
  total_reservations: number
  total_quantity_reserved: number
  active_reservations: number
  fulfillment_rate: number
}

export default function ReservationsReportPage() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const token = useSelector((state: RootState) => state.auth.token)

  const [reservations, setReservations] = useState<ReservationDetails[]>([])
  const [stats, setStats] = useState<ReservationStats | null>(null)
  const [itemStats, setItemStats] = useState<ItemReservationStats[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'fulfilled' | 'cancelled' | 'expired'>('all')

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchReservations()
    }
  }, [isAuthenticated, isAdmin, dateRange, statusFilter])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      let url = '/api/reservations'
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        let allReservations = data.data || []

        // Apply date range filter
        if (dateRange !== 'all') {
          const now = new Date()
          const cutoffDate = new Date()

          switch (dateRange) {
            case 'week':
              cutoffDate.setDate(now.getDate() - 7)
              break
            case 'month':
              cutoffDate.setMonth(now.getMonth() - 1)
              break
            case 'quarter':
              cutoffDate.setMonth(now.getMonth() - 3)
              break
            case 'year':
              cutoffDate.setFullYear(now.getFullYear() - 1)
              break
          }

          allReservations = allReservations.filter((r: ReservationDetails) =>
            new Date(r.reservation_date) >= cutoffDate
          )
        }

        setReservations(allReservations)
        calculateStats(allReservations)
        calculateItemStats(allReservations)
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (data: ReservationDetails[]) => {
    const total = data.length
    const active = data.filter(r => r.status === 'active').length
    const fulfilled = data.filter(r => r.status === 'fulfilled').length
    const cancelled = data.filter(r => r.status === 'cancelled').length
    const expired = data.filter(r => r.status === 'expired').length
    const expiring_soon = data.filter(r =>
      r.status === 'active' && r.days_until_expiration <= 1
    ).length

    const total_users = new Set(data.map(r => r.user_id)).size

    // Calculate average duration
    const completedReservations = data.filter(r => r.status === 'fulfilled' && r.pickup_date)
    const avg_duration_days = completedReservations.length > 0
      ? completedReservations.reduce((sum, r) => {
        const reservationDate = new Date(r.reservation_date)
        const pickupDate = new Date(r.pickup_date!)
        const days = (pickupDate.getTime() - reservationDate.getTime()) / (1000 * 60 * 60 * 24)
        return sum + days
      }, 0) / completedReservations.length
      : 0

    // Calculate fulfillment rate
    const totalCompleted = fulfilled + cancelled + expired
    const fulfillment_rate = totalCompleted > 0 ? (fulfilled / totalCompleted) * 100 : 0

    setStats({
      total,
      active,
      fulfilled,
      cancelled,
      expired,
      expiring_soon,
      total_users,
      avg_duration_days,
      fulfillment_rate,
    })
  }

  const calculateItemStats = (data: ReservationDetails[]) => {
    const itemMap = new Map<number, ItemReservationStats>()

    data.forEach(reservation => {
      const existing = itemMap.get(reservation.item_type_id)

      if (existing) {
        existing.total_reservations++
        existing.total_quantity_reserved += reservation.reserved_quantity
        if (reservation.status === 'active') {
          existing.active_reservations++
        }
        if (reservation.status === 'fulfilled') {
          existing.fulfillment_rate =
            ((existing.fulfillment_rate * (existing.total_reservations - 1)) + 100) / existing.total_reservations
        }
      } else {
        itemMap.set(reservation.item_type_id, {
          item_name: reservation.item_name,
          item_category: reservation.item_category || 'Sin categoría',
          total_reservations: 1,
          total_quantity_reserved: reservation.reserved_quantity,
          active_reservations: reservation.status === 'active' ? 1 : 0,
          fulfillment_rate: reservation.status === 'fulfilled' ? 100 : 0,
        })
      }
    })

    const sorted = Array.from(itemMap.values()).sort(
      (a, b) => b.total_reservations - a.total_reservations
    )

    setItemStats(sorted)
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Usuario', 'Email', 'Material', 'Categoría', 'Cantidad', 'Unidad', 'Estado', 'Fecha Reserva', 'Fecha Expiración', 'Fecha Recogida', 'Propósito', 'Notas']
    const rows = reservations.map(r => [
      r.id,
      r.username,
      r.email,
      r.item_name,
      r.item_category || 'N/A',
      r.reserved_quantity,
      r.unit_of_measure || 'unidades',
      r.status,
      new Date(r.reservation_date).toLocaleDateString('es-ES'),
      new Date(r.expiration_date).toLocaleDateString('es-ES'),
      r.pickup_date ? new Date(r.pickup_date).toLocaleDateString('es-ES') : 'N/A',
      r.purpose || 'N/A',
      r.notes || 'N/A',
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reservations-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleExportPDF = () => {
    alert('Exportación a PDF disponible próximamente')
  }

  const handleExportExcel = () => {
    alert('Exportación a Excel disponible próximamente')
  }

  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <AppLayout title="Reservations Report">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Reservations Report">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 Reporte de Reservas
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Análisis completo del sistema de reservas
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📄 CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📑 PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              📊 Excel
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'week', label: 'Semana' },
                  { value: 'month', label: 'Mes' },
                  { value: 'quarter', label: 'Trimestre' },
                  { value: 'year', label: 'Año' },
                  { value: 'all', label: 'Todo' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateRange(option.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${dateRange === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'active', label: 'Activas' },
                  { value: 'fulfilled', label: 'Recogidas' },
                  { value: 'cancelled', label: 'Canceladas' },
                  { value: 'expired', label: 'Expiradas' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Reservas
              </h3>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.active}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Activas
              </h3>
              {stats.expiring_soon > 0 && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                  ⚠️ {stats.expiring_soon} expiran pronto
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.fulfillment_rate.toFixed(1)}%
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tasa de Cumplimiento
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stats.fulfilled} recogidas / {stats.fulfilled + stats.cancelled + stats.expired} completadas
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.total_users}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Usuarios Activos
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Promedio: {(stats.total / stats.total_users).toFixed(1)} reservas/usuario
              </p>
            </div>
          </div>
        )}

        {/* Additional Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Duración Promedio
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.avg_duration_days.toFixed(1)} días
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Desde reserva hasta recogida
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <XCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Canceladas/Expiradas
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.cancelled + stats.expired}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {stats.cancelled} canceladas, {stats.expired} expiradas
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Requieren Atención
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.expiring_soon}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Expiran en menos de 24 horas
              </p>
            </div>
          </div>
        )}

        {/* Top Reserved Items */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Materiales Más Reservados
              </h2>
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : itemStats.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No hay datos disponibles
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Material
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Reservas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cantidad Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Activas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tasa Cumplimiento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {itemStats.slice(0, 10).map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.item_category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          {item.total_reservations}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          {item.total_quantity_reserved}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            {item.active_reservations}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.fulfillment_rate >= 80
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : item.fulfillment_rate >= 50
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                            }`}>
                            {item.fulfillment_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
