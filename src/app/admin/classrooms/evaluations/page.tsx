'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { ErrorBoundary, ErrorMessage } from '@/components/ui/ErrorBoundary'
import { 
  Calendar, 
  FileText, 
  History, 
  BarChart3,
  ClipboardCheck,
  CheckSquare
} from 'lucide-react'

// Import evaluation components
import {
  EvaluationCalendar,
  ScheduleEvaluationModal,
  TemplatesManager,
  TemplateEditorModal,
  EvaluationHistory,
  EvaluationDetailModal,
  EvaluationReports,
  ExecuteEvaluationModal,
  PendingApprovals
} from '@/components/classrooms/evaluations'
import type { TemplateWithQuestions } from '@/components/classrooms/evaluations'
import type { SpaceType } from '@/types/evaluations'

/**
 * Tab type for the evaluations page
 * Validates: Requirements 7.2 (tabs for Calendario, Plantillas, Historial, Reportes)
 */
type TabType = 'calendario' | 'plantillas' | 'historial' | 'reportes' | 'aprobaciones'

/**
 * Tab configuration with icons and labels
 */
const TABS: Array<{ id: TabType; label: string; icon: React.ElementType }> = [
  { id: 'calendario', label: 'Calendario', icon: Calendar },
  { id: 'plantillas', label: 'Plantillas', icon: FileText },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'aprobaciones', label: 'Aprobaciones', icon: CheckSquare }
]

/**
 * Calendar event type for evaluation clicks
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
  status: 'pending' | 'completed' | 'overdue' | 'cancelled'
  created_at: string
  updated_at: string
}

/**
 * Template with count for editing
 */
interface TemplateWithCount {
  id: number
  name: string
  space_type: SpaceType
  version: number
  is_active: boolean
  created_by?: number
  created_at: string
  updated_at: string
  question_count: number
}

/**
 * EvaluationsPageContent Component
 * 
 * Main content component for the evaluations page.
 * Implements tabs for Calendario, Plantillas, Historial, and Reportes.
 * 
 * Validates: Requirements 7.1, 7.2
 * - 7.1: Show "Evaluaciones" section in admin panel
 * - 7.2: Show tabs for Calendario, Plantillas, Historial, Reportes
 */
function EvaluationsPageContent() {
  const token = useSelector((state: RootState) => state.auth.token)
  const searchParams = useSearchParams()
  
  // Active tab state
  const [activeTab, setActiveTab] = useState<TabType>('calendario')
  
  // Read tab from URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['calendario', 'plantillas', 'historial', 'reportes', 'aprobaciones'].includes(tabParam)) {
      setActiveTab(tabParam as TabType)
    }
  }, [searchParams])
  
  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [scheduleInitialDate, setScheduleInitialDate] = useState<Date | undefined>()
  
  // Template editor modal state
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithQuestions | null>(null)
  
  // Evaluation detail modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null)
  
  // Execute evaluation modal state
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false)
  const [executeEvaluationId, setExecuteEvaluationId] = useState<number | null>(null)
  
  // Selected classroom for history tab
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null)
  
  // Refresh triggers
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0)
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0)

  /**
   * Handles clicking on a day in the calendar to schedule a new evaluation
   * Validates: Requirements 1.2 (click on day to schedule)
   */
  const handleScheduleClick = useCallback((date: Date) => {
    setScheduleInitialDate(date)
    setIsScheduleModalOpen(true)
  }, [])

  /**
   * Handles clicking on an evaluation in the calendar
   * - For completed evaluations: switch to history tab
   * - For pending/overdue evaluations: open execute modal
   * Validates: Requirements 3.1 (initiate evaluation)
   */
  const handleEvaluationClick = useCallback((evaluation: CalendarEvent) => {
    if (evaluation.status === 'completed') {
      // For completed evaluations, switch to history tab and select the classroom
      setSelectedClassroomId(evaluation.classroom_id)
      setActiveTab('historial')
    } else if (evaluation.status === 'pending' || evaluation.status === 'overdue') {
      // For pending/overdue evaluations, open the execute modal
      setExecuteEvaluationId(evaluation.id)
      setIsExecuteModalOpen(true)
    }
    // Cancelled evaluations are not clickable for execution
  }, [])

  /**
   * Handles successful scheduling of an evaluation
   */
  const handleScheduleSuccess = useCallback(() => {
    setIsScheduleModalOpen(false)
    setScheduleInitialDate(undefined)
    // Trigger calendar refresh
    setCalendarRefreshKey(prev => prev + 1)
  }, [])

  /**
   * Handles successful execution of an evaluation
   * Validates: Requirements 3.7 (update status to completed)
   */
  const handleExecuteSuccess = useCallback(() => {
    setIsExecuteModalOpen(false)
    setExecuteEvaluationId(null)
    // Trigger calendar refresh to show updated status
    setCalendarRefreshKey(prev => prev + 1)
  }, [])

  /**
   * Handles clicking to create a new template
   */
  const handleCreateTemplate = useCallback(() => {
    setEditingTemplate(null)
    setIsTemplateEditorOpen(true)
  }, [])

  /**
   * Handles clicking to edit a template
   */
  const handleEditTemplate = useCallback(async (template: TemplateWithCount) => {
    // Fetch full template with questions
    if (!token) return
    
    try {
      const res = await fetch(`/api/admin/evaluations/templates/${template.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setEditingTemplate(data.data)
        setIsTemplateEditorOpen(true)
      } else {
        console.error('Error fetching template:', res.status)
      }
    } catch (err) {
      console.error('Error fetching template:', err)
    }
  }, [token])

  /**
   * Handles successful template save
   */
  const handleTemplateSuccess = useCallback(() => {
    setIsTemplateEditorOpen(false)
    setEditingTemplate(null)
    // Trigger templates refresh
    setTemplatesRefreshKey(prev => prev + 1)
  }, [])

  /**
   * Handles clicking on an evaluation in history to view details
   * Validates: Requirements 5.3 (click to view detail)
   */
  const handleViewEvaluationDetail = useCallback((evaluationId: number) => {
    setSelectedEvaluationId(evaluationId)
    setIsDetailModalOpen(true)
  }, [])

  /**
   * Renders the tab navigation
   * Validates: Requirements 7.2 (tabs for Calendario, Plantillas, Historial, Reportes)
   */
  const renderTabs = () => (
    <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === id
              ? 'bg-white dark:bg-gray-700 text-claro-red shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
          `}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )

  /**
   * Renders the active tab content
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'calendario':
        return (
          <EvaluationCalendar
            key={calendarRefreshKey}
            token={token}
            onScheduleClick={handleScheduleClick}
            onEvaluationClick={handleEvaluationClick}
          />
        )
      
      case 'plantillas':
        return (
          <TemplatesManager
            key={templatesRefreshKey}
            token={token}
            onCreateTemplate={handleCreateTemplate}
            onEditTemplate={handleEditTemplate}
          />
        )
      
      case 'historial':
        return (
          <div className="space-y-4">
            {/* Classroom selector for history */}
            <ClassroomSelector
              token={token}
              selectedClassroomId={selectedClassroomId}
              onSelectClassroom={setSelectedClassroomId}
            />
            
            {selectedClassroomId ? (
              <EvaluationHistory
                classroomId={selectedClassroomId}
                token={token}
                onViewDetail={handleViewEvaluationDetail}
              />
            ) : (
              <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Selecciona un espacio
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Selecciona un espacio del menú desplegable para ver su historial de evaluaciones.
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      
      case 'reportes':
        return (
          <EvaluationReports token={token} />
        )
      
      case 'aprobaciones':
        return (
          <PendingApprovals
            token={token}
            myApprovalsOnly={false}
            onApprovalComplete={() => setCalendarRefreshKey(prev => prev + 1)}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
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
            <div className="flex items-center gap-3">
              <div className="p-2 bg-claro-red/10 rounded-lg">
                <ClipboardCheck className="w-6 h-6 text-claro-red" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Evaluaciones
                </h1>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Sistema de evaluación de condiciones de espacios
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          {renderTabs()}
        </div>

        {/* Tab Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>

      {/* Schedule Evaluation Modal */}
      <ScheduleEvaluationModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false)
          setScheduleInitialDate(undefined)
        }}
        token={token}
        initialDate={scheduleInitialDate}
        onSuccess={handleScheduleSuccess}
      />

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={isTemplateEditorOpen}
        onClose={() => {
          setIsTemplateEditorOpen(false)
          setEditingTemplate(null)
        }}
        token={token}
        template={editingTemplate}
        onSuccess={handleTemplateSuccess}
      />

      {/* Evaluation Detail Modal */}
      <EvaluationDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedEvaluationId(null)
        }}
        token={token}
        evaluationId={selectedEvaluationId}
      />

      {/* Execute Evaluation Modal */}
      <ExecuteEvaluationModal
        isOpen={isExecuteModalOpen}
        onClose={() => {
          setIsExecuteModalOpen(false)
          setExecuteEvaluationId(null)
        }}
        token={token}
        evaluationId={executeEvaluationId}
        onSuccess={handleExecuteSuccess}
      />
    </div>
  )
}

/**
 * ClassroomSelector Component
 * 
 * Dropdown selector for choosing a classroom to view history.
 */
interface ClassroomSelectorProps {
  token: string | null
  selectedClassroomId: number | null
  onSelectClassroom: (id: number | null) => void
}

function ClassroomSelector({ token, selectedClassroomId, onSelectClassroom }: ClassroomSelectorProps) {
  const [classrooms, setClassrooms] = React.useState<Array<{ id: number; name: string; location: string }>>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (!token) return

    const fetchClassrooms = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/admin/classrooms', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setClassrooms(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching classrooms:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClassrooms()
  }, [token])

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <label 
        htmlFor="classroom-select" 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Seleccionar espacio para ver historial
      </label>
      <select
        id="classroom-select"
        value={selectedClassroomId ?? ''}
        onChange={(e) => onSelectClassroom(e.target.value ? Number(e.target.value) : null)}
        disabled={isLoading}
        className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50"
      >
        <option value="">
          {isLoading ? 'Cargando espacios...' : 'Seleccione un espacio'}
        </option>
        {classrooms.map((classroom) => (
          <option key={classroom.id} value={classroom.id}>
            {classroom.name} - {classroom.location}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * EvaluationsPage Component
 * 
 * Main page component wrapped with ProtectedRoute and ErrorBoundary.
 * 
 * Validates: Requirements 7.1 (show "Evaluaciones" section in admin panel)
 */
export default function EvaluationsPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <EvaluationsPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
