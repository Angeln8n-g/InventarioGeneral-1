'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react'
import type { EvaluationStatus, SpaceType } from '@/types/evaluations'

/**
 * Calendar event representation for evaluations
 * Matches the CalendarEvent interface from the calendar API
 */
interface CalendarEvent {
  id: number
  classroom_id: number
  classroom_name: string
  classroom_location: string
  responsible_person?: string
  template_id: number
  template_name: string
  space_type: SpaceType
  scheduled_date: string
  status: EvaluationStatus
  created_at: string
  updated_at: string
}

/**
 * Props for the EvaluationCalendar component
 */
interface EvaluationCalendarProps {
  /** JWT token for API authentication */
  token: string | null
  /** Callback when user clicks on a day to schedule a new evaluation */
  onScheduleClick: (date: Date) => void
  /** Callback when user clicks on an existing evaluation */
  onEvaluationClick: (evaluation: CalendarEvent) => void
}

// Spanish day names
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Spanish month names
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Space type labels in Spanish
const SPACE_TYPE_LABELS: Record<SpaceType | 'all', string> = {
  all: 'Todos los espacios',
  training_room: 'Aula de entrenamiento',
  warehouse: 'Almacén',
  external_plant: 'Planta externa'
}

/**
 * Returns the appropriate background color class for an evaluation status
 * - pending: blue (pendiente)
 * - completed: green (completada)
 * - overdue: red (vencida)
 * - cancelled: gray (cancelada)
 * 
 * @param status - The evaluation status
 * @returns Tailwind CSS background color class
 * 
 * Validates: Requirements 1.4 (visual indicators for status)
 */
function getStatusColor(status: EvaluationStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'overdue':
      return 'bg-red-500'
    case 'cancelled':
      return 'bg-gray-400'
    default:
      return 'bg-gray-500'
  }
}

/**
 * Returns the Spanish label for an evaluation status
 * @param status - The evaluation status
 * @returns Spanish status label
 */
function getStatusLabel(status: EvaluationStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente'
    case 'completed':
      return 'Completada'
    case 'overdue':
      return 'Vencida'
    case 'cancelled':
      return 'Cancelada'
    default:
      return status
  }
}

/**
 * EvaluationCalendar Component
 * 
 * A calendar view for displaying and managing scheduled evaluations.
 * Follows the visual pattern of ReservationsCalendar for consistency.
 * 
 * Features:
 * - Month navigation (previous/next)
 * - Filter by space type (training_room, warehouse, external_plant)
 * - Visual status indicators (pending=blue, completed=green, overdue=red)
 * - Click on day to schedule new evaluation
 * - Click on evaluation to view details
 * - Responsive design for mobile
 * 
 * Validates: Requirements 1.1, 1.4, 1.5, 7.3
 */
export function EvaluationCalendar({ 
  token, 
  onScheduleClick, 
  onEvaluationClick 
}: EvaluationCalendarProps) {
  // Current displayed month/year
  const [currentDate, setCurrentDate] = useState(new Date())
  // Evaluations fetched from API
  const [evaluations, setEvaluations] = useState<CalendarEvent[]>([])
  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  // Selected day for detail view
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  // Space type filter
  const [spaceTypeFilter, setSpaceTypeFilter] = useState<SpaceType | 'all'>('all')
  // Filter dropdown visibility
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  /**
   * Fetches evaluations for the current month from the API
   * Validates: Requirements 1.1 (show calendar with evaluations)
   */
  const fetchEvaluations = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const startOfMonth = new Date(year, month, 1).toISOString()
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      
      let url = `/api/admin/evaluations/calendar?start_date=${startOfMonth}&end_date=${endOfMonth}`
      
      // Apply space type filter if not 'all'
      // Validates: Requirements 1.5 (filter by space type)
      if (spaceTypeFilter !== 'all') {
        url += `&space_type=${spaceTypeFilter}`
      }
      
      const res = await fetch(url, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      
      if (res.ok) {
        const data = await res.json()
        setEvaluations(data.data || [])
      } else {
        console.error('Error fetching evaluations:', res.status)
        setEvaluations([])
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      setEvaluations([])
    } finally {
      setIsLoading(false)
    }
  }, [token, year, month, spaceTypeFilter])

  // Fetch evaluations when dependencies change
  useEffect(() => {
    fetchEvaluations()
  }, [fetchEvaluations])

  /**
   * Navigate to previous month
   * Validates: Requirements 1.1 (month navigation)
   */
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  /**
   * Navigate to next month
   * Validates: Requirements 1.1 (month navigation)
   */
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  /**
   * Navigate to current month and select today
   */
  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDay(new Date().getDate())
  }

  // Calendar grid calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarDays: { day: number; isCurrentMonth: boolean; date: Date }[] = []
  
  // Previous month days (grayed out)
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, daysInPrevMonth - i)
    })
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    })
  }
  
  // Next month days (grayed out) - fill to 42 cells (6 weeks)
  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    })
  }

  /**
   * Gets evaluations scheduled for a specific day
   * @param date - The date to check
   * @returns Array of evaluations for that day
   */
  const getEvaluationsForDay = (date: Date): CalendarEvent[] => {
    return evaluations.filter(e => {
      const evalDate = new Date(e.scheduled_date)
      return evalDate.getDate() === date.getDate() &&
             evalDate.getMonth() === date.getMonth() &&
             evalDate.getFullYear() === date.getFullYear()
    })
  }

  /**
   * Checks if a date is today
   * @param date - The date to check
   * @returns true if the date is today
   */
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  // Get evaluations for the selected day
  const selectedDayEvaluations = selectedDay 
    ? getEvaluationsForDay(new Date(year, month, selectedDay))
    : []

  /**
   * Handles click on a day cell
   * @param dayInfo - Information about the clicked day
   */
  const handleDayClick = (dayInfo: { day: number; isCurrentMonth: boolean; date: Date }) => {
    if (!dayInfo.isCurrentMonth) return
    setSelectedDay(dayInfo.day)
  }

  /**
   * Handles click on "Schedule New" button
   * Validates: Requirements 1.2 (click on day to schedule)
   */
  const handleScheduleNewClick = () => {
    if (selectedDay) {
      onScheduleClick(new Date(year, month, selectedDay))
    }
  }

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-claro-red" />
          <h2 className="text-lg font-semibold">
            {MONTHS_ES[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Space Type Filter - Validates: Requirements 1.5 */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{SPACE_TYPE_LABELS[spaceTypeFilter]}</span>
              <span className="sm:hidden">Filtrar</span>
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                {(Object.keys(SPACE_TYPE_LABELS) as Array<SpaceType | 'all'>).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSpaceTypeFilter(type)
                      setShowFilterDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      spaceTypeFilter === type ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''
                    }`}
                  >
                    {SPACE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Navigation buttons */}
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hoy
          </button>
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Close filter dropdown when clicking outside */}
      {showFilterDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowFilterDropdown(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
            </div>
          ) : (
            <>
              {/* Days header */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_ES.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayInfo, index) => {
                  const dayEvaluations = dayInfo.isCurrentMonth ? getEvaluationsForDay(dayInfo.date) : []
                  const hasEvaluations = dayEvaluations.length > 0
                  const isSelected = selectedDay === dayInfo.day && dayInfo.isCurrentMonth
                  const isTodayDate = isToday(dayInfo.date)

                  return (
                    <button
                      key={index}
                      onClick={() => handleDayClick(dayInfo)}
                      disabled={!dayInfo.isCurrentMonth}
                      className={`
                        relative min-h-[80px] p-1 rounded-lg border transition-all text-left
                        ${dayInfo.isCurrentMonth 
                          ? 'bg-white dark:bg-gray-800 hover:border-claro-red cursor-pointer' 
                          : 'bg-gray-50 dark:bg-gray-900 opacity-40 cursor-default'}
                        ${isSelected 
                          ? 'border-claro-red ring-2 ring-claro-red/30' 
                          : 'border-gray-200 dark:border-gray-700'}
                        ${isTodayDate && dayInfo.isCurrentMonth ? 'ring-2 ring-blue-400' : ''}
                      `}
                    >
                      <span className={`
                        text-sm font-medium
                        ${isTodayDate && dayInfo.isCurrentMonth 
                          ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                          : ''}
                      `}>
                        {dayInfo.day}
                      </span>
                      
                      {/* Evaluation indicators - Validates: Requirements 1.4 */}
                      {hasEvaluations && dayInfo.isCurrentMonth && (
                        <div className="mt-1 space-y-1">
                          {dayEvaluations.slice(0, 2).map((e) => (
                            <div
                              key={e.id}
                              className={`text-xs px-1 py-0.5 rounded truncate text-white ${getStatusColor(e.status)}`}
                              title={`${e.classroom_name}: ${getStatusLabel(e.status)}`}
                            >
                              {e.classroom_name}
                            </div>
                          ))}
                          {dayEvaluations.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                              +{dayEvaluations.length - 2} más
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Selected day details panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full">
            <h3 className="font-semibold mb-3">
              {selectedDay 
                ? `${selectedDay} de ${MONTHS_ES[month]}`
                : 'Selecciona un día'}
            </h3>
            
            {selectedDay ? (
              <>
                {/* Schedule new evaluation button - Validates: Requirements 1.2 */}
                <button
                  onClick={handleScheduleNewClick}
                  className="w-full mb-4 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  + Programar evaluación
                </button>

                {selectedDayEvaluations.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {selectedDayEvaluations.map(e => (
                      <button
                        key={e.id}
                        onClick={() => onEvaluationClick(e)}
                        className="w-full text-left bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 hover:border-claro-red transition-colors"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium text-sm">{e.classroom_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(e.status)}`}>
                            {getStatusLabel(e.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {e.template_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(e.scheduled_date).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {e.responsible_person && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Responsable: {e.responsible_person}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay evaluaciones programadas para este día
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Haz clic en un día para ver las evaluaciones o programar una nueva
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Legend - Validates: Requirements 1.4 (visual indicators) */}
      <div className="flex flex-wrap items-center gap-4 px-4 pb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Completada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>Vencida</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  )
}
