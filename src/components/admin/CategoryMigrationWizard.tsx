'use client'

import React, { useState, useEffect } from 'react'
import { X, ArrowRight, Check, AlertTriangle, Loader2, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { DeviceCategoryWithCount } from '@/types/database'

interface MigrationAnalysis {
  sourceCategory: { id: number; name: string }
  targetCategory: { id: number; name: string }
  deviceCount: number
  compatibleFields: Array<{ name: string; type: string }>
  incompatibleFields: Array<{ name: string; type: string; reason: string }>
}

interface CategoryMigrationWizardProps {
  onClose: () => void
  onSuccess?: () => void
}

type WizardStep = 'source' | 'target' | 'analysis' | 'confirm' | 'executing' | 'complete'

export default function CategoryMigrationWizard({ onClose, onSuccess }: CategoryMigrationWizardProps) {
  const [step, setStep] = useState<WizardStep>('source')
  const [categories, setCategories] = useState<DeviceCategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceCategory, setSourceCategory] = useState<DeviceCategoryWithCount | null>(null)
  const [targetCategory, setTargetCategory] = useState<DeviceCategoryWithCount | null>(null)
  const [analysis, setAnalysis] = useState<MigrationAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{ success: boolean; migratedCount: number } | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/categories?includeCounts=true', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Error al cargar categorías')
      }
      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  const handleSourceSelect = (category: DeviceCategoryWithCount) => {
    setSourceCategory(category)
    setTargetCategory(null)
    setAnalysis(null)
    setStep('target')
  }

  const handleTargetSelect = async (category: DeviceCategoryWithCount) => {
    setTargetCategory(category)
    setStep('analysis')
    await analyzeCompatibility(sourceCategory!.id, category.id)
  }

  const analyzeCompatibility = async (sourceId: number, targetId: number) => {
    try {
      setAnalyzing(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/categories/migrate/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ sourceCategoryId: sourceId, targetCategoryId: targetId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al analizar compatibilidad')
      }

      const data = await response.json()
      setAnalysis(data.data)
    } catch (error) {
      console.error('Error analyzing compatibility:', error)
      toast.error(error instanceof Error ? error.message : 'Error al analizar')
      setStep('target')
    } finally {
      setAnalyzing(false)
    }
  }

  const executeMigration = async () => {
    if (!sourceCategory || !targetCategory) return

    try {
      setExecuting(true)
      setStep('executing')

      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/categories/migrate/execute', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          sourceCategoryId: sourceCategory.id,
          targetCategoryId: targetCategory.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al ejecutar migración')
      }

      const data = await response.json()
      setMigrationResult({ success: true, migratedCount: data.data?.migratedCount || 0 })
      setStep('complete')
      toast.success('Migración completada exitosamente')
    } catch (error) {
      console.error('Error executing migration:', error)
      toast.error(error instanceof Error ? error.message : 'Error al ejecutar migración')
      setMigrationResult({ success: false, migratedCount: 0 })
      setStep('complete')
    } finally {
      setExecuting(false)
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'target':
        setStep('source')
        setSourceCategory(null)
        break
      case 'analysis':
      case 'confirm':
        setStep('target')
        setTargetCategory(null)
        setAnalysis(null)
        break
    }
  }

  const handleComplete = () => {
    if (migrationResult?.success) {
      onSuccess?.()
    }
    onClose()
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'source', label: 'Origen' },
      { key: 'target', label: 'Destino' },
      { key: 'analysis', label: 'Análisis' },
      { key: 'confirm', label: 'Confirmar' },
    ]

    const currentIndex = steps.findIndex((s) => s.key === step) || 0

    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((s, index) => (
          <React.Fragment key={s.key}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}
            >
              {index < currentIndex ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-1 mx-1 ${
                  index < currentIndex ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderSourceStep = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Selecciona la categoría de origen
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Los dispositivos de esta categoría serán migrados a otra categoría.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {categories
          .filter((c) => c.device_count > 0)
          .map((category) => (
            <button
              key={category.id}
              onClick={() => handleSourceSelect(category)}
              className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.device_count} dispositivo(s)</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
        {categories.filter((c) => c.device_count > 0).length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No hay categorías con dispositivos para migrar
          </p>
        )}
      </div>
    </div>
  )

  const renderTargetStep = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Selecciona la categoría de destino
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Los dispositivos de <span className="font-medium">{sourceCategory?.name}</span> serán
        migrados a esta categoría.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {categories
          .filter((c) => c.id !== sourceCategory?.id)
          .map((category) => (
            <button
              key={category.id}
              onClick={() => handleTargetSelect(category)}
              className="w-full p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.device_count} dispositivo(s)</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </button>
          ))}
      </div>
    </div>
  )

  const renderAnalysisStep = () => {
    if (analyzing) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Analizando compatibilidad...</p>
        </div>
      )
    }

    if (!analysis) return null

    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Análisis de compatibilidad
        </h3>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">{analysis.deviceCount}</span> dispositivo(s) serán
            migrados de <span className="font-medium">{sourceCategory?.name}</span> a{' '}
            <span className="font-medium">{targetCategory?.name}</span>
          </p>
        </div>

        {analysis.compatibleFields.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Campos compatibles ({analysis.compatibleFields.length})
            </h4>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <ul className="space-y-1">
                {analysis.compatibleFields.map((field, index) => (
                  <li key={index} className="text-sm text-green-700 dark:text-green-300">
                    {field.name} ({field.type})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {analysis.incompatibleFields.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Campos incompatibles ({analysis.incompatibleFields.length})
            </h4>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <ul className="space-y-1">
                {analysis.incompatibleFields.map((field, index) => (
                  <li key={index} className="text-sm text-red-700 dark:text-red-300">
                    {field.name} - {field.reason}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Los valores de estos campos se perderán durante la migración.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleBack}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Atrás
          </button>
          <button
            onClick={() => setStep('confirm')}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  const renderConfirmStep = () => (
    <div>
      <div className="flex items-center justify-center mb-6">
        <AlertTriangle className="h-12 w-12 text-amber-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-4">
        ¿Confirmar migración?
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
        Esta acción migrará <span className="font-medium">{analysis?.deviceCount}</span>{' '}
        dispositivo(s) de <span className="font-medium">{sourceCategory?.name}</span> a{' '}
        <span className="font-medium">{targetCategory?.name}</span>.
        {analysis?.incompatibleFields && analysis.incompatibleFields.length > 0 && (
          <span className="text-red-600 dark:text-red-400 block mt-2">
            Se perderán los valores de {analysis.incompatibleFields.length} campo(s) incompatible(s).
          </span>
        )}
      </p>
      <div className="flex gap-3">
        <button
          onClick={handleBack}
          className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={executeMigration}
          className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
        >
          Ejecutar migración
        </button>
      </div>
    </div>
  )

  const renderExecutingStep = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Ejecutando migración...
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Por favor, no cierre esta ventana.
      </p>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="flex flex-col items-center justify-center py-8">
      {migrationResult?.success ? (
        <>
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            ¡Migración completada!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            Se migraron exitosamente {migrationResult.migratedCount} dispositivo(s).
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <X className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error en la migración
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            Ocurrió un error durante la migración. Por favor, intente nuevamente.
          </p>
        </>
      )}
      <button
        onClick={handleComplete}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        Cerrar
      </button>
    </div>
  )

  const renderContent = () => {
    switch (step) {
      case 'source':
        return renderSourceStep()
      case 'target':
        return renderTargetStep()
      case 'analysis':
        return renderAnalysisStep()
      case 'confirm':
        return renderConfirmStep()
      case 'executing':
        return renderExecutingStep()
      case 'complete':
        return renderCompleteStep()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {step !== 'source' && step !== 'executing' && step !== 'complete' && (
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Migración de Categorías
            </h2>
          </div>
          {step !== 'executing' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Step Indicator */}
        {step !== 'executing' && step !== 'complete' && (
          <div className="px-6 pt-4">{renderStepIndicator()}</div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </div>
  )
}
