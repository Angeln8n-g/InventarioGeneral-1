'use client'

import React from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { ReservationsCalendar } from '@/components/classrooms/ReservationsCalendar'

export default function ClassroomsCalendarPage() {
  const token = useSelector((state: RootState) => state.auth.token)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/classrooms"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-claro-red dark:hover:border-claro-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-gray-700 dark:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Volver</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Calendario de Reservas</h1>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Vista mensual de todas las reservas de aulas
                </p>
              </div>
            </div>
          </div>

          <ReservationsCalendar token={token} />
        </div>
      </div>
    </ProtectedRoute>
  )
}
