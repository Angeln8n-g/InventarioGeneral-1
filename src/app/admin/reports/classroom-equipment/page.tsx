'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/app/store'
import { loadFromStorage } from '@/features/auth/authSlice'
import { toastSuccess, toastError } from '@/lib/toast'
import { ErrorBoundary, ErrorMessage } from '@/components/ui/ErrorBoundary'

interface ClassroomEquipmentSummary {
  classroom_id: number
  classroom_name: string
  classroom_location: string
  classroom_status: string
  total_devices: number
  devices_by_category: Record<string, number>
  incomplete_workstations: number
  device_list: Array<{
    id: number
    name: string
    category: string
    brand?: string
    model?: string
    serial_number?: string
    has_combination: boolean
  }>
}

interface ReportData {
  data: ClassroomEquipmentSummary[]
  summary: {
    total_classrooms: number
    total_devices_assigned: number
    total_combinations: number
    classrooms_with_devices: number
    classrooms_without_devices: number
    total_incomplete_workstations: number
  }
  generated_at: string
}

function ClassroomEquipmentReportContent() {
  const dispatch = useDispatch()
  const token = useSelector((state: RootState) => state.auth.token)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedClassrooms, setExpandedClassrooms] = useState<Set<number>>(new Set())

  useEffect(() => {
    dispatch(loadFromStorage())
  }, [dispatch])

  const fetchReport = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/reports/classroom-equipment', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Error al generar el reporte')
      }

      const data = await response.json()
      setReportData(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar el reporte'
      setError(message)
      toastError('Error al cargar reporte', message)
      console.error('Error fetching report:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      fetchReport()
    }
  }, [token, fetchReport])

  const toggleClassroom = (classroomId: number) => {
    const newExpanded = new Set(expandedClassrooms)
    if (newExpanded.has(classroomId)) {
      newExpanded.delete(classroomId)
    } else {
      newExpanded.add(classroomId)
    }
    setExpandedClassrooms(newExpanded)
  }

  const exportToCSV = () => {
    if (!reportData) return

    try {
      const rows = [
        ['Aula', 'Ubicación', 'Estado', 'Total Dispositivos', 'Estaciones Incompletas', 'Categorías'],
      ]

      reportData.data.forEach(classroom => {
        const categories = Object.entries(classroom.devices_by_category)
          .map(([cat, count]) => `${cat}: ${count}`)
          .join('; ')

        rows.push([
          classroom.classroom_name,
          classroom.classroom_location,
          classroom.classroom_status,
          classroom.total_devices.toString(),
          classroom.incomplete_workstations.toString(),
          categories,
        ])
      })

      const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `classroom-equipment-report-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      toastSuccess('Reporte exportado', 'El archivo CSV ha sido descargado')
    } catch (err) {
      toastError('Error al exportar', 'No se pudo generar el archivo CSV')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Generando reporte...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-light dark:text-text-dark">No se pudo cargar el reporte</p>
          <Link
            href="/admin/dashboard"
            className="mt-4 inline-block claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                Reporte de Equipos por Aula
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Generado: {new Date(reportData.generated_at).toLocaleString()}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Exportar CSV
              </button>
              <Link
                href="/admin/dashboard"
                className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Volver
              </Link>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Total Aulas</p>
              <p className="text-2xl font-bold text-text-light dark:text-text-dark">{reportData.summary.total_classrooms}</p>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Dispositivos Asignados</p>
              <p className="text-2xl font-bold text-claro-green">{reportData.summary.total_devices_assigned}</p>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Combinaciones</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reportData.summary.total_combinations}</p>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Aulas con Equipos</p>
              <p className="text-2xl font-bold text-text-light dark:text-text-dark">{reportData.summary.classrooms_with_devices}</p>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Aulas Vacías</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{reportData.summary.classrooms_without_devices}</p>
            </div>
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Estaciones Incompletas</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{reportData.summary.total_incomplete_workstations}</p>
            </div>
          </div>
        </div>

        {/* Classroom Details */}
        <div className="space-y-4">
          {reportData.data.map(classroom => (
            <div
              key={classroom.classroom_id}
              className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Classroom Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => toggleClassroom(classroom.classroom_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-text-light dark:text-text-dark">
                        {classroom.classroom_name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        classroom.classroom_status === 'active' 
                          ? 'bg-claro-green/10 text-claro-green'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {classroom.classroom_status}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {classroom.classroom_location}
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text-light dark:text-text-dark">{classroom.total_devices}</p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Dispositivos</p>
                    </div>
                    {classroom.incomplete_workstations > 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{classroom.incomplete_workstations}</p>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Incompletas</p>
                      </div>
                    )}
                    <svg
                      className={`w-5 h-5 text-text-secondary-light dark:text-text-secondary-dark transition-transform ${
                        expandedClassrooms.has(classroom.classroom_id) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Category Summary */}
                {Object.keys(classroom.devices_by_category).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(classroom.devices_by_category).map(([category, count]) => (
                      <span
                        key={category}
                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark rounded"
                      >
                        {category}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Expanded Device List */}
              {expandedClassrooms.has(classroom.classroom_id) && classroom.device_list.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-2 text-left">Nombre</th>
                          <th className="px-4 py-2 text-left">Categoría</th>
                          <th className="px-4 py-2 text-left">Marca</th>
                          <th className="px-4 py-2 text-left">Assetag</th>
                          <th className="px-4 py-2 text-left">Serial</th>
                          <th className="px-4 py-2 text-center">Combinado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classroom.device_list.map(device => (
                          <tr key={device.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2">{device.name}</td>
                            <td className="px-4 py-2">{device.category}</td>
                            <td className="px-4 py-2">{device.brand || '—'}</td>
                            <td className="px-4 py-2">{device.model || '—'}</td>
                            <td className="px-4 py-2 font-mono text-xs">{device.serial_number || '—'}</td>
                            <td className="px-4 py-2 text-center">
                              {device.has_combination ? (
                                <span className="text-claro-green">✓</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ClassroomEquipmentReportPage() {
  return (
    <ErrorBoundary>
      <ClassroomEquipmentReportContent />
    </ErrorBoundary>
  )
}
