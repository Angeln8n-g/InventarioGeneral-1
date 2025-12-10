'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface Reservation {
  id: number
  classroom_id: number
  classroom_name: string
  title: string
  start_datetime: string
  end_datetime: string
  status: string
}

interface ReservationsCalendarProps {
  token: string | null
}

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function ReservationsCalendar({ token }: ReservationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const fetchReservations = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const startOfMonth = new Date(year, month, 1).toISOString()
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      
      const res = await fetch(
        `/api/admin/classrooms/reservations/calendar?start=${startOfMonth}&end=${endOfMonth}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setReservations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [token, year, month])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDay(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDay(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDay(new Date().getDate())
  }

  // Calendar grid calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const calendarDays: { day: number; isCurrentMonth: boolean; date: Date }[] = []
  
  // Previous month days
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
  
  // Next month days
  const remainingDays = 42 - calendarDays.length
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    })
  }

  const getReservationsForDay = (date: Date) => {
    return reservations.filter(r => {
      const start = new Date(r.start_datetime)
      const end = new Date(r.end_datetime)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
      return start <= dayEnd && end >= dayStart
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const selectedDayReservations = selectedDay 
    ? getReservationsForDay(new Date(year, month, selectedDay))
    : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-blue-500'
    }
  }


  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-claro-red" />
          <h2 className="text-lg font-semibold">
            {MONTHS_ES[month]} {year}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Hoy
          </button>
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

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

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((dayInfo, index) => {
                  const dayReservations = dayInfo.isCurrentMonth ? getReservationsForDay(dayInfo.date) : []
                  const hasReservations = dayReservations.length > 0
                  const isSelected = selectedDay === dayInfo.day && dayInfo.isCurrentMonth
                  const isTodayDate = isToday(dayInfo.date)

                  return (
                    <button
                      key={index}
                      onClick={() => dayInfo.isCurrentMonth && setSelectedDay(dayInfo.day)}
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
                      
                      {hasReservations && dayInfo.isCurrentMonth && (
                        <div className="mt-1 space-y-1">
                          {dayReservations.slice(0, 2).map((r, i) => (
                            <div
                              key={r.id}
                              className={`text-xs px-1 py-0.5 rounded truncate text-white ${getStatusColor(r.status)}`}
                              title={`${r.classroom_name}: ${r.title}`}
                            >
                              {r.classroom_name}
                            </div>
                          ))}
                          {dayReservations.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                              +{dayReservations.length - 2} más
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

        {/* Selected day details */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full">
            <h3 className="font-semibold mb-3">
              {selectedDay 
                ? `${selectedDay} de ${MONTHS_ES[month]}`
                : 'Selecciona un día'}
            </h3>
            
            {selectedDay ? (
              selectedDayReservations.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedDayReservations.map(r => (
                    <div
                      key={r.id}
                      className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-sm">{r.classroom_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getStatusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{r.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(r.start_datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(r.end_datetime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay reservas para este día
                </p>
              )
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Haz clic en un día para ver las reservas
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Confirmada</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>Cancelada</span>
        </div>
      </div>
    </div>
  )
}
