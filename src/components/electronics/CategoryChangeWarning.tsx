'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface CategoryChangeWarningProps {
  incompatibleFields: string[]
  lostValues: Record<string, unknown>
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Warning modal shown when changing category will result in data loss
 */
export const CategoryChangeWarning: React.FC<CategoryChangeWarningProps> = ({
  incompatibleFields,
  lostValues,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advertencia de cambio de categoría
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Se perderán algunos datos
            </p>
          </div>
          <button
            onClick={onCancel}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Al cambiar la categoría, los siguientes campos no son compatibles y sus valores se perderán:
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
            <ul className="space-y-2">
              {incompatibleFields.map((fieldName) => (
                <li key={fieldName} className="flex items-center justify-between text-sm">
                  <span className="text-red-700 dark:text-red-400 font-medium">
                    {fieldName}
                  </span>
                  <span className="text-red-600 dark:text-red-300 text-xs bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded">
                    {formatValue(lostValues[fieldName])}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Desea continuar con el cambio de categoría?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'vacío'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value.length > 20 ? value.substring(0, 20) + '...' : value
  return String(value)
}

export default CategoryChangeWarning
