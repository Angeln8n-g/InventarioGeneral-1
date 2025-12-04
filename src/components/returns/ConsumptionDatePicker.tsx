'use client'

import React from 'react'
import { useGetMyConsumptionsQuery } from '@/services/api'

interface ConsumptionDate {
  consumption_date: string
  total_items: number
  total_consumed: number
  total_returnable: number
}

interface ConsumptionDatePickerProps {
  onDateSelect: (date: string) => void
  selectedDate: string | null
}

export function ConsumptionDatePicker({ onDateSelect, selectedDate }: ConsumptionDatePickerProps) {
  const { data, isLoading, error, refetch } = useGetMyConsumptionsQuery()
  const dates: ConsumptionDate[] = data?.data || []

  const getErrorMessage = (): string | null => {
    if (!error) return null
    // RTK Query error object can be FetchBaseQueryError or SerializedError
    if ('status' in error) {
      const apiMessage = (error.data as any)?.error?.message
      return apiMessage || 'Failed to fetch consumption history'
    }
    return error.message || 'Failed to fetch consumption history'
  }

  const errorMessage = getErrorMessage()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateOnly = date.toISOString().split('T')[0]
    const todayOnly = today.toISOString().split('T')[0]
    const yesterdayOnly = yesterday.toISOString().split('T')[0]

    if (dateOnly === todayOnly) return 'Hoy'
    if (dateOnly === yesterdayOnly) return 'Ayer'

    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  if (isLoading) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
          <span className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">
            Cargando historial...
          </span>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center text-claro-red">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
        <button
          onClick={() => refetch()}
          className="mt-4 claro-button-secondary px-4 py-2 rounded-lg text-sm"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (dates.length === 0) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <svg 
            className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
            No hay consumos recientes
          </h3>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            No tienes consumos en los últimos 30 días para devolver.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
          Selecciona Fecha de Consumo
        </h3>
        <button
          onClick={() => refetch()}
          className="text-claro-red hover:text-red-700 transition-colors"
          aria-label="Actualizar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {dates.map((dateInfo) => (
          <button
            key={dateInfo.consumption_date}
            onClick={() => onDateSelect(dateInfo.consumption_date)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedDate === dateInfo.consumption_date
                ? 'border-claro-red bg-claro-red/10 dark:bg-claro-red/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-claro-red/50 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-text-light dark:text-text-dark">
                {formatDate(dateInfo.consumption_date)}
              </span>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {dateInfo.consumption_date}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Items:</span>
                <span className="ml-1 font-semibold text-text-light dark:text-text-dark">
                  {dateInfo.total_items}
                </span>
              </div>
              <div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Consumido:</span>
                <span className="ml-1 font-semibold text-text-light dark:text-text-dark">
                  {dateInfo.total_consumed}
                </span>
              </div>
              <div>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">Devolvible:</span>
                <span className="ml-1 font-semibold text-claro-red">
                  {dateInfo.total_returnable}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
