import React, { useState, useEffect } from 'react'
import { Package, Users, History } from 'lucide-react'

interface ReservationButtonsProps {
  onMyReservationsClick: () => void
  onAllReservationsClick: () => void
  onHistoryClick: () => void
  userId: number
}

export const ReservationButtons: React.FC<ReservationButtonsProps> = ({
  onMyReservationsClick,
  onAllReservationsClick,
  onHistoryClick,
  userId,
}) => {
  const [stats, setStats] = useState({
    my_active: 0,
    total_active: 0,
    expiring_soon: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [userId])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/reservations/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-text-light dark:text-text-dark">Gestión de Reservas</h2>
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Administra tus reservas y consulta el estado del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* My Reservations */}
        <button
          onClick={onMyReservationsClick}
          className="relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">Mis Reservas</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Ver mis reservas activas</p>
          {stats.my_active > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {stats.my_active}
            </div>
          )}
        </button>

        {/* All Active Reservations */}
        <button
          onClick={onAllReservationsClick}
          className="relative flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 dark:group-hover:bg-green-900/60 transition-colors">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">Reservas Activas</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Ver todas las reservas</p>
          {stats.total_active > 0 && (
            <div className="absolute -top-2 -right-2 bg-white text-green-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
              {stats.total_active}
            </div>
          )}
          {stats.expiring_soon > 0 && (
            <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white text-xs font-bold rounded-full px-2 py-0.5 shadow-lg">
              ⚠️ {stats.expiring_soon}
            </div>
          )}
        </button>

        {/* History */}
        <button
          onClick={onHistoryClick}
          className="flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
        >
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/60 transition-colors">
            <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">Historial</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Ver historial completo</p>
        </button>
      </div>
    </div>
  )
}
