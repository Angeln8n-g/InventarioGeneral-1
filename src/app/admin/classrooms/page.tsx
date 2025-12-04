'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { toastError, toastSuccess } from '@/lib/toast'
import { ErrorBoundary, ErrorMessage } from '@/components/ui/ErrorBoundary'

interface ClassroomItem {
  id: number
  name: string
  location: string
  status: string
  device_count: number
  responsible_person?: string
}

function ClassroomsPageContent() {
  const [items, setItems] = useState<ClassroomItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [location, setLocation] = useState('')
  const [responsible, setResponsible] = useState('')
  const token = useSelector((state: RootState) => state.auth.token)

  const fetchData = useCallback(async (showToast = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `Error ${res.status}: ${res.statusText}`)
      }
      const json = await res.json()
      setItems(json.data || [])
      if (showToast) {
        toastSuccess('Datos actualizados')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar las aulas'
      setError(message)
      toastError('Error al cargar aulas', message)
      console.error('Error fetching classrooms:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  const handleRetry = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  const handleRefresh = useCallback(() => {
    fetchData(true)
  }, [fetchData])

  useEffect(() => { 
    if (token) {
      fetchData() 
    }
  }, [token, fetchData])

  const filtered = items.filter(i => (
    (!status || i.status === status) &&
    (!location || i.location.toLowerCase().includes(location.toLowerCase())) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase())) &&
    (!responsible || (i.responsible_person && i.responsible_person.toLowerCase().includes(responsible.toLowerCase())))
  ))

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-claro-red dark:hover:border-claro-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-gray-700 dark:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Volver</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Aulas</h1>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Gestión de aulas y equipos asignados</p>
            </div>
          </div>
          <Link href="/admin/classrooms/new" className="claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium">Crear Aula</Link>
        </div>

        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar por nombre" className="border border-gray-300 dark:border-gray-600 bg-card-light dark:bg-card-dark rounded-lg px-3 py-2 text-sm" />
            <input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="Filtrar por localidad" className="border border-gray-300 dark:border-gray-600 bg-card-light dark:bg-card-dark rounded-lg px-3 py-2 text-sm" />
            <input value={responsible} onChange={(e)=>setResponsible(e.target.value)} placeholder="Filtrar por responsable" className="border border-gray-300 dark:border-gray-600 bg-card-light dark:bg-card-dark rounded-lg px-3 py-2 text-sm" />
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border border-gray-300 dark:border-gray-600 bg-card-light dark:bg-card-dark rounded-lg px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="maintenance">maintenance</option>
            </select>
            <button onClick={handleRefresh} className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium">Refrescar</button>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <ErrorMessage 
            message={error} 
            onRetry={handleRetry}
            className="mb-4"
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mb-4"></div>
              <p className="text-text-secondary-light dark:text-text-secondary-dark">Cargando aulas...</p>
            </div>
          </div>
        ) : (
          <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Localidad</th>
                  <th className="px-4 py-2 text-left">Responsable</th>
                  <th className="px-4 py-2 text-left">Estatus</th>
                  <th className="px-4 py-2 text-left">Dispositivos</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark">
                      {items.length === 0 ? 'No hay aulas registradas' : 'No se encontraron aulas con los filtros aplicados'}
                    </td>
                  </tr>
                ) : (
                  filtered.map(i => (
                    <tr key={i.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-4 py-2">{i.name}</td>
                      <td className="px-4 py-2">{i.location}</td>
                      <td className="px-4 py-2">{i.responsible_person || '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          i.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : i.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">{i.device_count}</td>
                      <td className="px-4 py-2">
                        <Link href={`/admin/classrooms/${i.id}`} className="text-primary hover:underline">Ver</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClassroomsPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <ClassroomsPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
