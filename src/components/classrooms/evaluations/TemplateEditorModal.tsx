'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  AlertCircle, 
  CheckCircle,
  Eye,
  Edit3,
  FileText
} from 'lucide-react'
import type { 
  SpaceType, 
  QuestionCategory, 
  EvaluationTemplateWithQuestions,
  TemplateQuestion
} from '@/types/evaluations'

/**
 * Template with questions for editing
 */
export type TemplateWithQuestions = EvaluationTemplateWithQuestions

/**
 * Props for the TemplateEditorModal component
 */
interface TemplateEditorModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** JWT token for API authentication */
  token: string | null
  /** Template to edit (null/undefined for create mode) */
  template?: TemplateWithQuestions | null
  /** Callback when template is successfully saved */
  onSuccess?: () => void
}

/**
 * Question being edited (may not have an ID yet)
 */
interface EditableQuestion {
  /** Temporary ID for tracking in the UI */
  tempId: string
  /** Database ID (only for existing questions) */
  id?: number
  /** Question text */
  question_text: string
  /** Question category */
  category: QuestionCategory
  /** Whether the question is required */
  is_required: boolean
  /** Display order */
  display_order: number
}

// Space type labels in Spanish
const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  training_room: 'Aula de entrenamiento',
  warehouse: 'Almacén',
  external_plant: 'Planta externa'
}

// Category labels in Spanish
const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  organization: 'Organización',
  cleanliness: 'Limpieza',
  maintenance: 'Mantenimiento'
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  organization: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  cleanliness: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  maintenance: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
}

/**
 * Generates a unique temporary ID for new questions
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Converts a TemplateQuestion to an EditableQuestion
 */
function toEditableQuestion(question: TemplateQuestion): EditableQuestion {
  return {
    tempId: generateTempId(),
    id: question.id,
    question_text: question.question_text,
    category: question.category,
    is_required: question.is_required,
    display_order: question.display_order
  }
}

/**
 * Creates a new empty question
 */
function createEmptyQuestion(displayOrder: number): EditableQuestion {
  return {
    tempId: generateTempId(),
    question_text: '',
    category: 'organization',
    is_required: true,
    display_order: displayOrder
  }
}

/**
 * TemplateEditorModal Component
 * 
 * Modal for creating and editing evaluation templates.
 * Supports both create mode (no template prop) and edit mode (template prop provided).
 * 
 * Features:
 * - Form for template name and space_type selector
 * - Questions editor with add/remove/reorder functionality
 * - Category selector per question (organización, limpieza, mantenimiento)
 * - Toggle for required questions
 * - Preview tab showing how the questionnaire will look
 * - Validation: name required, at least one question required
 * 
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.8
 */
export function TemplateEditorModal({
  isOpen,
  onClose,
  token,
  template,
  onSuccess
}: TemplateEditorModalProps) {
  // Determine if we're in edit mode
  const isEditMode = !!template

  // Form state
  const [name, setName] = useState('')
  const [spaceType, setSpaceType] = useState<SpaceType>('training_room')
  const [questions, setQuestions] = useState<EditableQuestion[]>([])
  
  // UI state
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Validation state
  const [touched, setTouched] = useState({
    name: false,
    questions: false
  })

  /**
   * Initializes form state when modal opens or template changes
   */
  useEffect(() => {
    if (isOpen) {
      if (template) {
        // Edit mode: populate form with template data
        setName(template.name)
        setSpaceType(template.space_type)
        setQuestions(template.questions.map(toEditableQuestion))
      } else {
        // Create mode: reset form
        setName('')
        setSpaceType('training_room')
        setQuestions([createEmptyQuestion(0)])
      }
      setActiveTab('editor')
      setError(null)
      setSuccess(false)
      setTouched({ name: false, questions: false })
    }
  }, [isOpen, template])

  /**
   * Validates the form
   * Validates: Requirements 2.2 (name required, at least one question)
   */
  const validateForm = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!name.trim()) {
      errors.push('El nombre de la plantilla es requerido')
    }
    
    if (questions.length === 0) {
      errors.push('Se requiere al menos una pregunta')
    }
    
    // Check for empty question texts
    const emptyQuestions = questions.filter(q => !q.question_text.trim())
    if (emptyQuestions.length > 0) {
      errors.push('Todas las preguntas deben tener texto')
    }
    
    return { isValid: errors.length === 0, errors }
  }, [name, questions])

  /**
   * Adds a new question to the list
   */
  const handleAddQuestion = () => {
    const newOrder = questions.length > 0 
      ? Math.max(...questions.map(q => q.display_order)) + 1 
      : 0
    setQuestions([...questions, createEmptyQuestion(newOrder)])
    setTouched(prev => ({ ...prev, questions: true }))
  }

  /**
   * Removes a question from the list
   */
  const handleRemoveQuestion = (tempId: string) => {
    setQuestions(questions.filter(q => q.tempId !== tempId))
    setTouched(prev => ({ ...prev, questions: true }))
  }

  /**
   * Updates a question's field
   */
  const handleUpdateQuestion = (
    tempId: string, 
    field: keyof EditableQuestion, 
    value: string | boolean | QuestionCategory
  ) => {
    setQuestions(questions.map(q => 
      q.tempId === tempId ? { ...q, [field]: value } : q
    ))
  }

  /**
   * Moves a question up in the list
   */
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newQuestions = [...questions]
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[index - 1]
    newQuestions[index - 1] = temp
    // Update display orders
    newQuestions.forEach((q, i) => { q.display_order = i })
    setQuestions(newQuestions)
  }

  /**
   * Moves a question down in the list
   */
  const handleMoveDown = (index: number) => {
    if (index === questions.length - 1) return
    const newQuestions = [...questions]
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[index + 1]
    newQuestions[index + 1] = temp
    // Update display orders
    newQuestions.forEach((q, i) => { q.display_order = i })
    setQuestions(newQuestions)
  }

  /**
   * Handles form submission
   * Validates: Requirements 2.2 (create), 2.5 (edit)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({ name: true, questions: true })
    
    // Validate form
    const validation = validateForm()
    if (!validation.isValid) {
      setError(validation.errors.join('. '))
      return
    }
    
    if (!token) {
      setError('No hay sesión activa')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Prepare questions data
      const questionsData = questions.map((q, index) => ({
        ...(q.id ? { id: q.id } : {}),
        question_text: q.question_text.trim(),
        category: q.category,
        is_required: q.is_required,
        display_order: index
      }))
      
      const payload = {
        name: name.trim(),
        space_type: spaceType,
        questions: questionsData
      }
      
      const url = isEditMode 
        ? `/api/admin/evaluations/templates/${template!.id}`
        : '/api/admin/evaluations/templates'
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        setSuccess(true)
        // Wait a moment to show success message, then close
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        const data = await res.json()
        const errorMessage = data.error?.message || 
          (data.error?.details ? data.error.details.join('. ') : 'Error al guardar la plantilla')
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Error saving template:', err)
      setError('Error al guardar la plantilla')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Renders the editor tab content
   */
  const renderEditor = () => (
    <div className="space-y-6">
      {/* Template name */}
      <div>
        <label 
          htmlFor="templateName" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Nombre de la plantilla *
        </label>
        <input
          type="text"
          id="templateName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
          disabled={isSubmitting}
          placeholder="Ej: Evaluación de Aula de Entrenamiento"
          className={`
            w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 
            text-gray-900 dark:text-white
            focus:ring-2 focus:ring-claro-red focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${touched.name && !name.trim() 
              ? 'border-red-500 dark:border-red-500' 
              : 'border-gray-300 dark:border-gray-600'}
          `}
        />
        {touched.name && !name.trim() && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            El nombre es requerido
          </p>
        )}
      </div>

      {/* Space type selector */}
      <div>
        <label 
          htmlFor="spaceType" 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          Tipo de espacio *
        </label>
        <select
          id="spaceType"
          value={spaceType}
          onChange={(e) => setSpaceType(e.target.value as SpaceType)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {Object.entries(SPACE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Questions section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Preguntas *
          </label>
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={isSubmitting}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Agregar pregunta
          </button>
        </div>
        
        {touched.questions && questions.length === 0 && (
          <p className="mb-3 text-sm text-red-600 dark:text-red-400">
            Se requiere al menos una pregunta
          </p>
        )}

        {/* Questions list */}
        <div className="space-y-3">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.tempId}
              question={question}
              index={index}
              totalQuestions={questions.length}
              disabled={isSubmitting}
              onUpdate={(field, value) => handleUpdateQuestion(question.tempId, field, value)}
              onRemove={() => handleRemoveQuestion(question.tempId)}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
            />
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              No hay preguntas en esta plantilla
            </p>
            <button
              type="button"
              onClick={handleAddQuestion}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-claro-red text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar primera pregunta
            </button>
          </div>
        )}
      </div>
    </div>
  )

  /**
   * Renders the preview tab content
   * Validates: Requirements 2.8 (preview questionnaire before saving)
   */
  const renderPreview = () => {
    // Group questions by category
    const questionsByCategory = questions.reduce((acc, q) => {
      if (!acc[q.category]) {
        acc[q.category] = []
      }
      acc[q.category].push(q)
      return acc
    }, {} as Record<QuestionCategory, EditableQuestion[]>)

    const categories: QuestionCategory[] = ['organization', 'cleanliness', 'maintenance']
    const hasQuestions = questions.length > 0

    return (
      <div className="space-y-6">
        {/* Template info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {name || 'Sin nombre'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tipo: {SPACE_TYPE_LABELS[spaceType]}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total de preguntas: {questions.length}
          </p>
        </div>

        {!hasQuestions ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Agregue preguntas para ver la vista previa
            </p>
          </div>
        ) : (
          /* Questions grouped by category */
          <div className="space-y-6">
            {categories.map(category => {
              const categoryQuestions = questionsByCategory[category] || []
              if (categoryQuestions.length === 0) return null

              return (
                <div key={category}>
                  <h4 className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${CATEGORY_COLORS[category]}`}>
                    {CATEGORY_LABELS[category]} ({categoryQuestions.length})
                  </h4>
                  <div className="space-y-3">
                    {categoryQuestions.map((question, idx) => (
                      <PreviewQuestion 
                        key={question.tempId} 
                        question={question} 
                        number={idx + 1}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Response options info */}
        {hasQuestions && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Opciones de respuesta:</strong> Sí, No, No aplica
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Las preguntas marcadas con * son obligatorias
            </p>
          </div>
        )}
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla'}
        size="lg"
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isEditMode ? '¡Plantilla Actualizada!' : '¡Plantilla Creada!'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {isEditMode 
              ? 'La plantilla ha sido actualizada exitosamente'
              : 'La plantilla ha sido creada exitosamente'}
          </p>
        </div>
      </Dialog>
    )
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-claro-red text-claro-red'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-claro-red text-claro-red'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            Vista previa
          </button>
        </div>

        {/* Tab content */}
        <div className="min-h-[400px] max-h-[60vh] overflow-y-auto">
          {activeTab === 'editor' ? renderEditor() : renderPreview()}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-claro-red rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-claro-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isEditMode ? 'Guardar cambios' : 'Crear plantilla'}
              </>
            )}
          </button>
        </div>
      </form>
    </Dialog>
  )
}


/**
 * QuestionEditor Component
 * 
 * Individual question editor with text input, category selector,
 * required toggle, and reorder/delete buttons.
 * 
 * Validates: Requirements 2.3 (question text, category, is_required)
 */
interface QuestionEditorProps {
  question: EditableQuestion
  index: number
  totalQuestions: number
  disabled: boolean
  onUpdate: (field: keyof EditableQuestion, value: string | boolean | QuestionCategory) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function QuestionEditor({
  question,
  index,
  totalQuestions,
  disabled,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown
}: QuestionEditorProps) {
  const hasEmptyText = !question.question_text.trim()

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1 pt-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disabled || index === 0}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mover arriba"
            aria-label="Mover pregunta arriba"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disabled || index === totalQuestions - 1}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Mover abajo"
            aria-label="Mover pregunta abajo"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Question content */}
        <div className="flex-1 space-y-3">
          {/* Question number and text */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Pregunta {index + 1}
            </label>
            <input
              type="text"
              value={question.question_text}
              onChange={(e) => onUpdate('question_text', e.target.value)}
              disabled={disabled}
              placeholder="Escriba el texto de la pregunta..."
              className={`
                w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-claro-red focus:border-transparent
                disabled:opacity-50 disabled:cursor-not-allowed
                ${hasEmptyText 
                  ? 'border-red-300 dark:border-red-700' 
                  : 'border-gray-300 dark:border-gray-600'}
              `}
            />
          </div>

          {/* Category and required toggle */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 dark:text-gray-400">
                Categoría:
              </label>
              <select
                value={question.category}
                onChange={(e) => onUpdate('category', e.target.value as QuestionCategory)}
                disabled={disabled}
                className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-claro-red focus:border-transparent disabled:opacity-50"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Required toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={question.is_required}
                onChange={(e) => onUpdate('is_required', e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-claro-red border-gray-300 rounded focus:ring-claro-red disabled:opacity-50"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Obligatoria
              </span>
            </label>
          </div>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Eliminar pregunta"
          aria-label={`Eliminar pregunta ${index + 1}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}


/**
 * PreviewQuestion Component
 * 
 * Displays a question as it will appear in the actual questionnaire.
 * Shows the question text, required indicator, and response options.
 * 
 * Validates: Requirements 2.4 (response options: Sí, No, No aplica), 2.8 (preview)
 */
interface PreviewQuestionProps {
  question: EditableQuestion
  number: number
}

function PreviewQuestion({ question, number }: PreviewQuestionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
          {number}
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-900 dark:text-white mb-3">
            {question.question_text || <span className="italic text-gray-400">Sin texto</span>}
            {question.is_required && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </p>
          
          {/* Response options preview */}
          <div className="flex flex-wrap gap-3">
            {['Sí', 'No', 'No aplica'].map((option) => (
              <label key={option} className="flex items-center gap-2 cursor-not-allowed opacity-70">
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
