/**
 * Supabase Client & Operations Aggregator
 * 
 * Re-exports all domain repository operations and database utilities.
 * Individual repositories are modularized under `@/lib/db/`.
 */

export { supabase } from './supabase'
export type { Database } from './supabase'

export {
  // Tools and UUIDs
  isValidUUID,
  generateToolUUID,
  itemTypeOperations,
  toolInstanceOperations,

  // Users
  userOperations,

  // Consumables & Reservations
  consumableStockOperations,
  consumableRequestOperations,
  reservationOperations,

  // Loans
  loanOperations,

  // Notifications
  notificationOperations,
  notificationPreferencesOperations,

  // Audit
  auditLogOperations,

  // Electronic Devices
  electronicDeviceOperations,

  // Classrooms & Services
  classroomOperations,
  assignmentOperations,
  combinationOperations,
  classroomReservationOperations,
  internetServiceOperations,

  // Evaluations
  evaluationTemplateOperations,
  templateQuestionOperations,
  scheduledEvaluationOperations,
  evaluationResultOperations,
  evaluationResponseOperations,

  // Category & Field Operations
  categoryOperations,
  fieldOperations,
  customFieldOperations,
  migrationOperations,
} from './db'
