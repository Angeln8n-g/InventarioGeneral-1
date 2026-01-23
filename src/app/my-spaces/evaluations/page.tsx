'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  ClipboardCheck, 
  MessageSquare, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { EvaluationFeedbackModal } from '@/components/classrooms/evaluations'

interface Classroom {
  id: number
  name: string
  location: string
  responsible_person: string
}

interface EvaluationItem {
  id: number
  completed_at: string
  score_percentage: number
  total_score: number
  max_possible_score: number
  classification: 'requires_attention' | 'acceptable' | 'excellent'
  approval_status: string
  classroom: {
    id: number
    name: string
    location: string
  }
  template: {
    id: number
    name: string
    space_type: string
  }
  evaluator: {
    id: number
    name: string
  }
  scheduled_date: string
  has_feedback: boolean
  feedback: {
    agrees_with_result: boolean
    created_at: string
  } | null
}

interface Summary {
  total_evaluations: number
  pending_feedback: number
  average_score: number
}

const CLASSIFICATION_CONFIG = {
  requires_attention: {
    label: 'Requiere Atención',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: TrendingDown,
  },
  acceptable: {
    label: 'Aceptable',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: Minus,
  },
  excellent: {
    label: 'Excelente',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
    icon: TrendingUp,
  },
}

export default function MySpacesEvaluationsPage() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null)
  const [filterClassroom, setFilterClassroom] = useState<number | 'all'>('all')

  // Get token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/login')
      return
    }
    setToken(storedToken)
  }, [router])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/evaluations/my-spaces', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'Error al cargar los datos')
      }

      const { data } = await res.json()
      setClassrooms(data.classrooms || [])
      setEvaluations(data.evaluations || [])
      setSummary(data.summary || null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter evaluations by classroom
  const filteredEvaluations = filterClassroom === 'all'
    ? evaluations
    : evaluations.filter(e => e.classroom.id === filterClassroom)

  // Handle feedback modal close
  const handleFeedbackClose = () => {
    setSelectedEvaluationId(null)
  }

  // Handle feedback success
  const handleFeedbackSuccess = () => {
    setSelectedEvaluationId(null)
    fetchData() // Refresh data
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-claro-red animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Cargando evaluaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Error al cargar
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Evaluaciones de Mis Espacios
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Revisa las evaluaciones de los espacios bajo tu responsabilidad
              </p>
            </div>
          </div>

          {/* Empty state */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tienes espacios asignados
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Actualmente no eres responsable de ningún espacio. Contacta al administrador si crees que esto es un error.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Evaluaciones de Mis Espacios
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Revisa las evaluaciones y proporciona tu retroalimentación
            </p>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Evaluaciones</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.total_evaluations}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes de Feedback</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.pending_feedback}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Promedio General</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.average_score.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        {classrooms.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por espacio
            </label>
            <select
              value={filterClassroom}
              onChange={(e) => setFilterClassroom(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent"
            >
              <option value="all">Todos los espacios</option>
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Evaluations list */}
        <div className="space-y-4">
          {filteredEvaluations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay evaluaciones
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Aún no se han realizado evaluaciones para tus espacios
              </p>
            </div>
          ) : (
            filteredEvaluations.map(evaluation => {
              const config = CLASSIFICATION_CONFIG[evaluation.classification]
              const Icon = config.icon

              return (
                <button
                  key={evaluation.id}
                  onClick={() => setSelectedEvaluationId(evaluation.id)}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-claro-red transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Classroom name */}
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                        {evaluation.classroom.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {evaluation.classroom.location}
                      </p>

                      {/* Score and classification */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${config.bg} ${config.color}`}>
                          <Icon className="w-4 h-4" />
                          {evaluation.score_percentage.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {config.label}
                        </span>
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Evaluado: {formatDate(evaluation.completed_at)}</span>
                        <span>Por: {evaluation.evaluator.name}</span>
                        <span>Plantilla: {evaluation.template.name}</span>
                      </div>
                    </div>

                    {/* Right side - feedback status */}
                    <div className="flex flex-col items-end gap-2">
                      {evaluation.has_feedback ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          <CheckCircle className="w-3 h-3" />
                          Feedback enviado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          <MessageSquare className="w-3 h-3" />
                          Pendiente
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {selectedEvaluationId && (
        <EvaluationFeedbackModal
          isOpen={true}
          onClose={handleFeedbackClose}
          evaluationResultId={selectedEvaluationId}
          token={token}
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  )
}
