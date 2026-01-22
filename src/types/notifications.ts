// Notification preferences and settings types

export type NotificationType = 
  | 'loan_confirmation'
  | 'return_confirmation'
  | 'loan_reminder'
  | 'overdue_notice'
  | 'consumable_fulfilled'
  | 'consumable_backorder'
  | 'reservation_expiring'
  | 'reservation_fulfilled'
  | 'reservation_cancelled'
  | 'system_announcement'
  | 'stock_alert'
  | 'system_maintenance'
  | 'evaluation_assigned'
  | 'evaluation_pending_approval'
  | 'evaluation_approved'
  | 'evaluation_rejected'

export interface NotificationPreferences {
  id?: number
  user_id: number
  loan_confirmation: boolean
  return_confirmation: boolean
  loan_reminder: boolean
  overdue_notice: boolean
  consumable_fulfilled: boolean
  consumable_backorder: boolean
  system_announcement: boolean
  stock_alert: boolean
  system_maintenance: boolean
  sound_enabled: boolean
  created_at?: string
  updated_at?: string
}

export interface NotificationFilter {
  type?: NotificationType
  read?: boolean
  startDate?: string
  endDate?: string
}

export interface NotificationPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
