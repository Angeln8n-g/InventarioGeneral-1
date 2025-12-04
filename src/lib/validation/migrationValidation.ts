import { DeviceCategory, CategoryField, MigrationAnalysis } from '@/types/database'

/**
 * Analyzes compatibility between source and target categories for migration
 * @param sourceCategory - The source category
 * @param targetCategory - The target category
 * @param sourceFields - Fields configured for the source category
 * @param targetFields - Fields configured for the target category
 * @returns MigrationAnalysis with compatible/incompatible fields and device count
 */
export function analyzeCategoryMigration(
  sourceCategory: DeviceCategory,
  targetCategory: DeviceCategory,
  sourceFields: CategoryField[],
  targetFields: CategoryField[]
): MigrationAnalysis {
  const sourceFieldNames = new Set(sourceFields.map(f => f.field_name))
  const targetFieldNames = new Set(targetFields.map(f => f.field_name))
  
  const compatibleFields = sourceFields
    .filter(f => targetFieldNames.has(f.field_name))
    .map(f => f.field_name)
  
  const incompatibleFields = sourceFields
    .filter(f => !targetFieldNames.has(f.field_name))
    .map(f => f.field_name)
  
  return {
    compatibleFields,
    incompatibleFields,
    devicesToMigrate: 0 // Will be populated from database query
  }
}

/**
 * Validates if a migration is safe to perform
 * @param analysis - The migration analysis result
 * @param requireAllFieldsCompatible - Whether all fields must be compatible
 * @returns true if migration is safe, false otherwise
 */
export function isMigrationSafe(
  analysis: MigrationAnalysis,
  requireAllFieldsCompatible: boolean = false
): boolean {
  if (requireAllFieldsCompatible) {
    return analysis.incompatibleFields.length === 0
  }
  
  // Migration is safe if there are no devices to migrate or if there are some compatible fields
  return analysis.devicesToMigrate === 0 || analysis.compatibleFields.length > 0
}

/**
 * Generates a warning message for incompatible fields
 * @param incompatibleFields - List of incompatible field names
 * @returns Warning message string
 */
export function generateMigrationWarning(incompatibleFields: string[]): string {
  if (incompatibleFields.length === 0) {
    return ''
  }
  
  const fieldList = incompatibleFields.join(', ')
  return `Los siguientes campos se perderán durante la migración: ${fieldList}. ¿Desea continuar?`
}
