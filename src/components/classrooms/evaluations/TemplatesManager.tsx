'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, FileText, AlertCircle, RefreshCw, Download } from 'lucide-react'
import type { EvaluationTemplate, SpaceType } from '@/types/evaluations'

/**
 * Template with question count for list display
 */
interface TemplateWithCount extends EvaluationTemplate {
  /** Number of questions in the template */
  question_count: number
}

/**
 * Props for the TemplatesManager component
 */
interface TemplatesManagerProps {
  /** JWT token for API authentication */
  token: string | null
  /** Callback when user clicks to create a new template */
  onCreateTemplate: () => void
  /** Callback when user clicks to edit a template */
  onEditTemplate: (template: TemplateWithCount) => void
}

/**
 * Space type labels in Spanish
 * Validates: Requirements 2.1 (show space type)
 */
const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  training_room: 'Aula de entrenamiento',
  warehouse: 'Almacén',
  external_plant: 'Planta externa'
}

/**
 * TemplatesManager Component
 * 
 * Displays a list of evaluation templates with management actions.
 * Allows administrators to view, create, edit, and delete templates.
 * 
 * Features:
 * - Table/list view showing templates with name, space_type, question_count, version, is_active
 * - "Nueva Plantilla" button to trigger creation
 * - Edit button per row (opens TemplateEditorModal in edit mode)
 * - Delete button per row with confirmation
 * - Loading and error states
 * - Empty state when no templates exist
 * 
 * Validates: Requirements 2.1
 */
export function TemplatesManager({
  token,
  onCreateTemplate,
  onEditTemplate
}: TemplatesManagerProps) {
  // Templates fetched from API
  const [templates, setTemplates] = useState<TemplateWithCount[]>([])
  // Loading state
  const [isLoading, setIsLoading] = useState(false)
  // Error state
  const [error, setError] = useState<string | null>(null)
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  // Deleting state
  const [isDeleting, setIsDeleting] = useState(false)
  // Downloading state
  const [isDownloading, setIsDownloading] = useState<number | 'all' | null>(null)

  /**
   * Fetches templates from the API
   * Validates: Requirements 2.1 (show list of templates)
   */
  const fetchTemplates = useCallback(async () => {
    if (!token) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/admin/evaluations/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data || [])
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.error?.message || 'Error al cargar las plantillas')
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError('Error de conexión al cargar las plantillas')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  // Fetch templates on mount and when token changes
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  /**
   * Handles template deletion with confirmation
   * Validates: Requirements 2.7 (delete template with confirmation)
   */
  const handleDelete = async (templateId: number) => {
    if (!token) return
    
    setIsDeleting(true)
    
    try {
      const res = await fetch(`/api/admin/evaluations/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        // Remove template from list
        setTemplates(prev => prev.filter(t => t.id !== templateId))
        setDeleteConfirm(null)
      } else {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error?.message || 'Error al eliminar la plantilla'
        setError(errorMessage)
        setDeleteConfirm(null)
      }
    } catch (err) {
      console.error('Error deleting template:', err)
      setError('Error de conexión al eliminar la plantilla')
      setDeleteConfirm(null)
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handles template download (single or all)
   */
  const handleDownload = async (templateId?: number) => {
    if (!token) return
    
    setIsDownloading(templateId || 'all')
    
    try {
      const url = templateId 
        ? `/api/admin/evaluations/templates/export?template_id=${templateId}`
        : '/api/admin/evaluations/templates/export'
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const blob = await res.blob()
        const contentDisposition = res.headers.get('Content-Disposition')
        let filename = templateId 
          ? `plantilla-${templateId}.xlsx`
          : 'plantillas-evaluacion.xlsx'
        
        // Extract filename from Content-Disposition header if available
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/)
          if (match) {
            filename = match[1]
          }
        }
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      } else {
        const errorData = await res.json().catch(() => ({}))
        setError(errorData.error?.message || 'Error al descargar la plantilla')
      }
    } catch (err) {
      console.error('Error downloading template:', err)
      setError('Error de conexión al descargar la plantilla')
    } finally {
      setIsDownloading(null)
    }
  }

  /**
   * Renders the loading state
   */
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando plantillas...</span>
    </div>
  )

  /**
   * Renders the error state
   * Validates: Requirements 7.7 (descriptive error messages in Spanish)
   */
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
      <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
      <button
        onClick={() => {
          setError(null)
          fetchTemplates()
        }}
        className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  )

  /**
   * Renders the empty state when no templates exist
   */
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No hay plantillas
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
        Aún no se han creado plantillas de evaluación. Crea una nueva plantilla para comenzar a programar evaluaciones.
      </p>
      <button
        onClick={onCreateTemplate}
        className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Crear primera plantilla
      </button>
    </div>
  )

  /**
   * Renders the delete confirmation dialog
   */
  const renderDeleteConfirmation = (templateId: number) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return null

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Confirmar eliminación
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            ¿Estás seguro de que deseas eliminar la plantilla <strong>&quot;{template.name}&quot;</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleDelete(templateId)}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              Eliminar
            </button>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Renders the templates table
   * Validates: Requirements 2.1 (show name, space type, question count)
   */
  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Nombre
            </th>
            <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Tipo de espacio
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Preguntas
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Versión
            </th>
            <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Estado
            </th>
            <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr 
              key={template.id}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {template.name}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                {SPACE_TYPE_LABELS[template.space_type]}
              </td>
              <td className="py-3 px-4 text-center">
                <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                  {template.question_count}
                </span>
              </td>
              <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">
                v{template.version}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  template.is_active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {template.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleDownload(template.id)}
                    disabled={isDownloading === template.id}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Descargar plantilla"
                    aria-label={`Descargar plantilla ${template.name}`}
                  >
                    {isDownloading === template.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onEditTemplate(template)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-claro-red hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Editar plantilla"
                    aria-label={`Editar plantilla ${template.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(template.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Eliminar plantilla"
                    aria-label={`Eliminar plantilla ${template.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-claro-red" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Plantillas de Evaluación
          </h2>
          {!isLoading && templates.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({templates.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {templates.length > 0 && (
            <button
              onClick={() => handleDownload()}
              disabled={isDownloading === 'all'}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
              title="Descargar todas las plantillas"
            >
              {isDownloading === 'all' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exportar Todas
            </button>
          )}
          <button
            onClick={onCreateTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva Plantilla
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading && renderLoading()}
        {!isLoading && error && renderError()}
        {!isLoading && !error && templates.length === 0 && renderEmpty()}
        {!isLoading && !error && templates.length > 0 && renderTable()}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm !== null && renderDeleteConfirmation(deleteConfirm)}
    </div>
  )
}
