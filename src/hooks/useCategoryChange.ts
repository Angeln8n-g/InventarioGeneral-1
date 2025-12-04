import { useState, useCallback } from 'react'
import type { CategoryField } from '@/types/database'

interface CategoryChangeResult {
  compatibleFields: string[]
  incompatibleFields: string[]
  preservedValues: Record<string, unknown>
  lostValues: Record<string, unknown>
}

/**
 * Hook for handling category changes and preserving compatible field values
 */
export function useCategoryChange() {
  const [showWarning, setShowWarning] = useState(false)
  const [changeResult, setChangeResult] = useState<CategoryChangeResult | null>(null)

  const analyzeChange = useCallback(
    async (
      currentCategoryId: number | null,
      newCategoryId: number,
      currentValues: Record<string, unknown>
    ): Promise<CategoryChangeResult> => {
      // If no current category, all values are new
      if (!currentCategoryId) {
        return {
          compatibleFields: [],
          incompatibleFields: [],
          preservedValues: {},
          lostValues: {},
        }
      }

      try {
        // Fetch fields for both categories
        const [currentFieldsRes, newFieldsRes] = await Promise.all([
          fetch(`/api/admin/categories/${currentCategoryId}/fields`),
          fetch(`/api/admin/categories/${newCategoryId}/fields`),
        ])

        if (!currentFieldsRes.ok || !newFieldsRes.ok) {
          throw new Error('Error fetching category fields')
        }

        const currentFieldsData = await currentFieldsRes.json()
        const newFieldsData = await newFieldsRes.json()

        const currentFields: CategoryField[] = currentFieldsData.data || []
        const newFields: CategoryField[] = newFieldsData.data || []

        // Find compatible fields (same name and type)
        const compatibleFields: string[] = []
        const incompatibleFields: string[] = []
        const preservedValues: Record<string, unknown> = {}
        const lostValues: Record<string, unknown> = {}

        for (const currentField of currentFields) {
          const matchingNewField = newFields.find(
            (f) =>
              f.field_name === currentField.field_name &&
              f.field_type === currentField.field_type
          )

          const value = currentValues[currentField.field_name]
          if (value !== undefined && value !== null && value !== '') {
            if (matchingNewField) {
              compatibleFields.push(currentField.field_name)
              preservedValues[currentField.field_name] = value
            } else {
              incompatibleFields.push(currentField.field_name)
              lostValues[currentField.field_name] = value
            }
          }
        }

        const result: CategoryChangeResult = {
          compatibleFields,
          incompatibleFields,
          preservedValues,
          lostValues,
        }

        setChangeResult(result)
        setShowWarning(incompatibleFields.length > 0)

        return result
      } catch (error) {
        console.error('Error analyzing category change:', error)
        return {
          compatibleFields: [],
          incompatibleFields: Object.keys(currentValues),
          preservedValues: {},
          lostValues: currentValues,
        }
      }
    },
    []
  )

  const confirmChange = useCallback(() => {
    setShowWarning(false)
    return changeResult?.preservedValues || {}
  }, [changeResult])

  const cancelChange = useCallback(() => {
    setShowWarning(false)
    setChangeResult(null)
  }, [])

  const resetWarning = useCallback(() => {
    setShowWarning(false)
    setChangeResult(null)
  }, [])

  return {
    showWarning,
    changeResult,
    analyzeChange,
    confirmChange,
    cancelChange,
    resetWarning,
  }
}

export default useCategoryChange
