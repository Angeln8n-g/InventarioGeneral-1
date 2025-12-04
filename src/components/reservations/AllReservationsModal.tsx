'use client'

import React, { useState, useEffect } from 'react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'
import { Users, Package, Clock, AlertTriangle, Search } from 'lucide-react'
import type { ReservationDetails } from '@/types/database'

interface AllReservationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AllReservationsModal({ isOpen, onClose }: AllReservationsModalProps) {
  const [reservations, setReservations] = useState<ReservationDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      fetchReservations()
    }
  }, [isOpen])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/reservations?status=active', {
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

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(reservations.map(r => r.item_category).filter(Boolean)))] as string[]

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    const matchesSearch = 
      r.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.username.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'all' || r.item_category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Group by item
  const groupedByItem = filteredReservations.reduce((acc, reservation) => {
    const key = reservation.item_type_id
    if (!acc[key]) {
      acc[key] = {
        item_name: reservation.item_name,
        item_category: reservation.item_category,
        unit_of_measure: reservation.unit_of_measure,
        reservations: [],
        total_reserved: 0,
      }
    }
    acc[key].reservations.push(reservation)
    acc[key].total_reserved += reservation.reserved_quantity
    return acc
  }, {} as Record<number, {
    item_name: string
    item_category: string | null
    unit_of_measure: string | null
    reservations: ReservationDetails[]
    total_reserved: number
  }>)

  const getExpirationBadge = (daysUntilExpiration: number) => {
    if (daysUntilExpiration <= 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expira en {Math.ceil(daysUntilExpiration)} día{Math.ceil(daysUntilExpiration) !== 1 ? 's' : ''}
        </span>
      )
    }
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {Math.ceil(daysUntilExpiration)} días restantes
      </span>
    )
  }

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="scale"
      speed="normal"
      enableHaptics={true}
      className="!max-w-4xl"
      title="👥 Reservas Activas del Sistema"
    >

      <div className="p-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-300 font-medium">Total Reservas</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{reservations.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-300 font-medium">Usuarios</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                  {new Set(reservations.map(r => r.user_id)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 font-medium">Por Expirar</p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
                  {reservations.filter(r => r.days_until_expiration <= 1).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
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

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  categoryFilter === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? 'Todas las categorías' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Reservations List - Grouped by Item */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando reservas...</p>
            </div>
          ) : Object.keys(groupedByItem).length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay reservas activas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No se encontraron reservas que coincidan con los filtros
              </p>
            </div>
          ) : (
            Object.entries(groupedByItem).map(([itemId, group]) => (
              <div
                key={itemId}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {group.item_name}
                    </h3>
                    {group.item_category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.item_category}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {group.total_reserved}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {group.unit_of_measure || 'unidades'} reservadas
                    </div>
                  </div>
                </div>

                {/* Reservations for this item */}
                <div className="space-y-2">
                  {group.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {reservation.username}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            • {reservation.reserved_quantity} {reservation.unit_of_measure || 'unidades'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Reservado: {new Date(reservation.reservation_date).toLocaleDateString('es-ES')}
                          </span>
                          <span>
                            Expira: {new Date(reservation.expiration_date).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        {reservation.purpose && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                            "{reservation.purpose}"
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {getExpirationBadge(reservation.days_until_expiration)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </TransitionDialog>
  )
}
