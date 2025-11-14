'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { History, Package, Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { ReservationDetails } from '@/types/database'

interface ReservationsHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReservationsHistoryModal({ isOpen, onClose }: ReservationsHistoryModalProps) {
  const [reservations, setReservations] = useState<ReservationDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'fulfilled' | 'cancelled' | 'expired'>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    if (isOpen) {
      fetchReservations()
    }
  }, [isOpen])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reservations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReservations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    // Exclude active reservations
    if (r.status === 'active') return false

    // Search filter
    const matchesSearch = 
      r.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter

    // Date range filter
    let matchesDate = true
    if (dateRange !== 'all') {
      const reservationDate = new Date(r.reservation_date)
      const now = new Date()
      const daysAgo = dateRange === 'week' ? 7 : 30
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      matchesDate = reservationDate >= cutoffDate
    }

    return matchesSearch && matchesStatus && matchesDate
  })

  // Calculate stats
  const stats = {
    total: filteredReservations.length,
    fulfilled: filteredReservations.filter(r => r.status === 'fulfilled').length,
    cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
    expired: filteredReservations.filter(r => r.status === 'expired').length,
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recogida
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            <Clock className="w-3 h-3 mr-1" />
            Expirada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
      <ModalHeader title="📜 Historial de Reservas" onClose={onClose} />

      <div className="p-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-600 dark:text-blue-300 font-medium mb-1">Total</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{stats.total}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-xs text-green-600 dark:text-green-300 font-medium mb-1">Recogidas</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-200">{stats.fulfilled}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mb-1">Canceladas</p>
            <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{stats.cancelled}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-xs text-red-600 dark:text-red-300 font-medium mb-1">Expiradas</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-200">{stats.expired}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por material o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status and Date Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'fulfilled', label: 'Recogidas' },
                { value: 'cancelled', label: 'Canceladas' },
                { value: 'expired', label: 'Expiradas' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === f.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Período:</span>
              {[
                { value: 'week', label: 'Última semana' },
                { value: 'month', label: 'Último mes' },
                { value: 'all', label: 'Todo' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setDateRange(f.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    dateRange === f.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando historial...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay registros
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron reservas que coincidan con los filtros
              </p>
            </div>
          ) : (
            filteredReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {reservation.item_name}
                      </h3>
                      {getStatusBadge(reservation.status)}
                    </div>
                    {reservation.item_category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {reservation.item_category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Usuario:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {reservation.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cantidad:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {reservation.reserved_quantity} {reservation.unit_of_measure || 'unidades'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Reservado:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(reservation.reservation_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">
                      {reservation.status === 'fulfilled' ? 'Recogido:' : 
                       reservation.status === 'expired' ? 'Expiró:' : 'Actualizado:'}
                    </span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(
                        reservation.pickup_date || reservation.updated_at
                      ).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                {reservation.purpose && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Propósito:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{reservation.purpose}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  )
}
