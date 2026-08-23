/**
 * Database operations index
 * Exports all database operation modules and repositories
 */

// Category and device field operations
export { categoryOperations } from './categoryOperations'
export { fieldOperations } from './fieldOperations'
export { customFieldOperations } from './customFieldOperations'
export { migrationOperations } from './migrationOperations'

// Domain Repositories
export { userOperations } from './users.repository'
export { itemTypeOperations, toolInstanceOperations, isValidUUID, generateToolUUID } from './tools.repository'
export { consumableStockOperations, consumableRequestOperations, reservationOperations } from './consumables.repository'
export { loanOperations } from './loans.repository'
export { notificationOperations, notificationPreferencesOperations } from './notifications.repository'
export { auditLogOperations } from './audit.repository'
export { electronicDeviceOperations } from './electronics.repository'
export {
  classroomOperations,
  assignmentOperations,
  combinationOperations,
  classroomReservationOperations,
  internetServiceOperations,
} from './classrooms.repository'
export {
  evaluationTemplateOperations,
  templateQuestionOperations,
  scheduledEvaluationOperations,
  evaluationResultOperations,
  evaluationResponseOperations,
} from './evaluations.repository'

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
