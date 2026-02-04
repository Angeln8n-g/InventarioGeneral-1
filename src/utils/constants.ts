// Application constants

// Tool statuses
export const TOOL_STATUSES = {
  AVAILABLE: 'available',
  LOANED: 'loaned',
  OUT_OF_SERVICE: 'out-of-service',
  LOST: 'lost',
  DAMAGED: 'damaged',
} as const

export const TOOL_STATUS_LABELS = {
  [TOOL_STATUSES.AVAILABLE]: 'Available',
  [TOOL_STATUSES.LOANED]: 'Loaned',
  [TOOL_STATUSES.OUT_OF_SERVICE]: 'Out of Service',
  [TOOL_STATUSES.LOST]: 'Lost',
  [TOOL_STATUSES.DAMAGED]: 'Damaged',
} as const

export const TOOL_STATUS_COLORS = {
  [TOOL_STATUSES.AVAILABLE]: 'green',
  [TOOL_STATUSES.LOANED]: 'blue',
  [TOOL_STATUSES.OUT_OF_SERVICE]: 'yellow',
  [TOOL_STATUSES.LOST]: 'red',
  [TOOL_STATUSES.DAMAGED]: 'orange',
} as const

// Loan statuses
export const LOAN_STATUSES = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
  LOST: 'lost',
} as const

export const LOAN_STATUS_LABELS = {
  [LOAN_STATUSES.ACTIVE]: 'Active',
  [LOAN_STATUSES.RETURNED]: 'Returned',
  [LOAN_STATUSES.OVERDUE]: 'Overdue',
  [LOAN_STATUSES.LOST]: 'Lost',
} as const

export const LOAN_STATUS_COLORS = {
  [LOAN_STATUSES.ACTIVE]: 'green',
  [LOAN_STATUSES.RETURNED]: 'gray',
  [LOAN_STATUSES.OVERDUE]: 'red',
  [LOAN_STATUSES.LOST]: 'red',
} as const

// Consumable request statuses
export const REQUEST_STATUSES = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled',
} as const

export const REQUEST_STATUS_LABELS = {
  [REQUEST_STATUSES.PENDING]: 'Pending',
  [REQUEST_STATUSES.FULFILLED]: 'Fulfilled',
  [REQUEST_STATUSES.PARTIAL]: 'Partially Fulfilled',
  [REQUEST_STATUSES.CANCELLED]: 'Cancelled',
} as const

export const REQUEST_STATUS_COLORS = {
  [REQUEST_STATUSES.PENDING]: 'yellow',
  [REQUEST_STATUSES.FULFILLED]: 'green',
  [REQUEST_STATUSES.PARTIAL]: 'blue',
  [REQUEST_STATUSES.CANCELLED]: 'gray',
} as const

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  ANALYST: 'analyst',
  SUPERVISOR: 'supervisor',
  MANAGER: 'manager',
} as const

export const USER_ROLE_LABELS = {
  [USER_ROLES.USER]: 'Usuario',
  [USER_ROLES.ADMIN]: 'Administrador',
  [USER_ROLES.ANALYST]: 'Analista',
  [USER_ROLES.SUPERVISOR]: 'Supervisor',
  [USER_ROLES.MANAGER]: 'Gerente',
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  LOAN_REMINDER: 'loan_reminder',
  OVERDUE_NOTICE: 'overdue_notice',
  RETURN_CONFIRMATION: 'return_confirmation',
  BACKORDER_FULFILLED: 'backorder_fulfilled',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  STOCK_ALERT: 'stock_alert',
} as const

export const NOTIFICATION_TYPE_LABELS = {
  [NOTIFICATION_TYPES.LOAN_REMINDER]: 'Loan Reminder',
  [NOTIFICATION_TYPES.OVERDUE_NOTICE]: 'Overdue Notice',
  [NOTIFICATION_TYPES.RETURN_CONFIRMATION]: 'Return Confirmation',
  [NOTIFICATION_TYPES.BACKORDER_FULFILLED]: 'Backorder Fulfilled',
  [NOTIFICATION_TYPES.SYSTEM_MAINTENANCE]: 'System Maintenance',
  [NOTIFICATION_TYPES.STOCK_ALERT]: 'Stock Alert',
} as const

// Delivery statuses
export const DELIVERY_STATUSES = {
  PENDING: 'pending',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const

// Audit actions
export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LOGIN: 'login',
  LOGOUT: 'logout',
  LOAN_CREATE: 'loan_create',
  LOAN_RETURN: 'loan_return',
  STATUS_CHANGE: 'status_change',
  STOCK_ADJUSTMENT: 'stock_adjustment',
} as const

// Entity types for audit logs
export const ENTITY_TYPES = {
  USER: 'user',
  ITEM_TYPE: 'item_type',
  TOOL_INSTANCE: 'tool_instance',
  LOAN: 'loan',
  CONSUMABLE_STOCK: 'consumable_stock',
  CONSUMABLE_REQUEST: 'consumable_request',
  NOTIFICATION: 'notification',
} as const

// Business rules
export const BUSINESS_RULES = {
  MAX_LOANS_PER_USER: 150,
  DEFAULT_LOAN_DURATION_DAYS: 1,
  MAX_LOAN_DURATION_DAYS: 7,
  OVERDUE_CHECK_INTERVAL_HOURS: 24,
  NOTIFICATION_RETRY_ATTEMPTS: 3,
  MIN_STOCK_THRESHOLD: 5,
  QR_CODE_EXPIRY_DAYS: 0, // QR codes don't expire
} as const

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  ISO_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  TOOLS: {
    BASE: '/api/tools',
    BY_QR: (qrCode: string) => `/api/tools/qr/${qrCode}`,
  },
  LOANS: {
    BASE: '/api/loans',
    MY: '/api/loans/my',
    RETURN: (id: number) => `/api/loans/${id}/return`,
  },
  CONSUMABLES: {
    BASE: '/api/consumables',
    REQUEST: '/api/consumables/request',
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    MARK_READ: (id: number) => `/api/notifications/${id}/read`,
  },
  ADMIN: {
    TOOLS: {
      BASE: '/api/admin/tools',
      QR_IMAGE: (id: number) => `/api/admin/tools/${id}/qr-image`,
      ADJUST: (id: number) => `/api/admin/tools/${id}/adjust`,
    },
    USERS: '/api/admin/users',
    AUDIT: '/api/admin/audit',
    REPORTS: '/api/admin/reports',
  },
} as const

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TOOL_NOT_AVAILABLE: 'TOOL_NOT_AVAILABLE',
  TOOL_ALREADY_LOANED: 'TOOL_ALREADY_LOANED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_QR_CODE: 'INVALID_QR_CODE',
  LOAN_NOT_FOUND: 'LOAN_NOT_FOUND',
  UNAUTHORIZED_RETURN: 'UNAUTHORIZED_RETURN',
  CONCURRENCY_CONFLICT: 'CONCURRENCY_CONFLICT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGOUT_SUCCESS: 'Successfully logged out',
  LOAN_CREATED: 'Tool loaned successfully',
  TOOL_RETURNED: 'Tool returned successfully',
  CONSUMABLE_REQUESTED: 'Consumable request submitted successfully',
  NOTIFICATION_READ: 'Notification marked as read',
  PROFILE_UPDATED: 'Profile updated successfully',
  TOOL_STATUS_UPDATED: 'Tool status updated successfully',
  STOCK_ADJUSTED: 'Stock quantity adjusted successfully',
} as const

// Error messages
export const ERROR_MESSAGES = {
  GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid username or password',
  ACCESS_DENIED: 'You do not have permission to perform this action',
  TOOL_NOT_FOUND: 'Tool not found or invalid QR code',
  TOOL_UNAVAILABLE: 'This tool is not available for loan',
  INSUFFICIENT_STOCK: 'Insufficient stock to fulfill this request',
  INVALID_QR_FORMAT: 'Invalid QR code format',
  LOAN_LIMIT_EXCEEDED: 'You have reached the maximum number of active loans',
  UNAUTHORIZED_RETURN: 'You can only return tools that you have borrowed',
  VALIDATION_FAILED: 'Please check your input and try again',
  CONCURRENCY_ERROR: 'This item was modified by another user. Please refresh and try again.',
} as const

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference',
} as const

// Theme colors (Tailwind CSS classes)
export const THEME_COLORS = {
  PRIMARY: 'blue',
  SECONDARY: 'gray',
  SUCCESS: 'green',
  WARNING: 'yellow',
  DANGER: 'red',
  INFO: 'blue',
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// File upload limits
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
} as const