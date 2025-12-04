/**
 * Database operations index
 * Exports all database operation modules for device categories
 */

export { categoryOperations } from './categoryOperations'
export { fieldOperations } from './fieldOperations'
export { customFieldOperations } from './customFieldOperations'
export { migrationOperations } from './migrationOperations'

// Re-export validation functions
export {
  validateCategoryInput,
  isCategoryNameUnique,
} from '../validation/categoryValidation'

export {
  validateFieldConfiguration,
  isFieldNameUnique,
} from '../validation/fieldValidation'

export {
  analyzeCategoryMigration,
  isMigrationSafe,
  generateMigrationWarning,
} from '../validation/migrationValidation'
