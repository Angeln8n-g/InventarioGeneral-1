import * as yup from 'yup'

// UUID validation schema
export const uuidSchema = yup
  .string()
  .matches(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid UUID format'
  )

// User validation schemas
export const createUserSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  full_name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  // Support both legacy role (string) and new role_id (number) for backward compatibility
  role: yup
    .string()
    .oneOf(['user', 'admin'], 'Role must be user or admin')
    .optional(),
  role_id: yup
    .number()
    .positive('Role ID must be a positive number')
    .integer('Role ID must be an integer')
    .optional(),
}).test('role-or-role-id', 'Either role or role_id must be provided', function(value) {
  return !!(value.role || value.role_id);
})

export const updateUserSchema = yup.object({
  username: yup
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  full_name: yup
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  role: yup
    .string()
    .oneOf(['user', 'admin'], 'Role must be user or admin'),
})

// Login validation schema
export const loginSchema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
})

// Item type validation schemas
export const createItemTypeSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .max(100, 'Name must be less than 100 characters'),
  description: yup
    .string()
    .max(1000, 'Description must be less than 1000 characters'),
  category: yup
    .string()
    .max(50, 'Category must be less than 50 characters'),
  is_consumable: yup
    .boolean()
    .default(false),
  default_loan_duration_days: yup
    .number()
    .integer('Loan duration must be a whole number')
    .min(1, 'Loan duration must be at least 1 day')
    .max(365, 'Loan duration cannot exceed 365 days')
    .default(7),
})

export const updateItemTypeSchema = createItemTypeSchema.partial()

// Tool instance validation schemas
export const createToolInstanceSchema = yup.object({
  item_type_id: yup
    .number()
    .integer('Item type ID must be a whole number')
    .positive('Item type ID must be positive')
    .required('Item type is required'),
  qr_code: uuidSchema.optional(), // Will be auto-generated if not provided
  serial_number: yup
    .string()
    .max(100, 'Serial number must be less than 100 characters'),
  status: yup
    .string()
    .oneOf(['available', 'loaned', 'out-of-service', 'lost', 'damaged'], 'Invalid status')
    .default('available'),
  condition_notes: yup
    .string()
    .max(1000, 'Condition notes must be less than 1000 characters'),
})

export const updateToolInstanceSchema = createToolInstanceSchema.partial()

// Loan validation schemas
export const createLoanSchema = yup.object({
  user_id: yup
    .number()
    .integer('User ID must be a whole number')
    .positive('User ID must be positive')
    .required('User is required'),
  tool_instance_id: yup
    .number()
    .integer('Tool instance ID must be a whole number')
    .positive('Tool instance ID must be positive')
    .required('Tool instance is required'),
  due_date: yup
    .string()
    .optional(),
  notes: yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters'),
})

export const updateLoanSchema = yup.object({
  return_date: yup.date(),
  status: yup
    .string()
    .oneOf(['active', 'returned', 'overdue', 'lost'], 'Invalid status'),
  notes: yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters'),
})

// Consumable request validation schemas
export const createConsumableRequestSchema = yup.object({
  user_id: yup
    .number()
    .integer('User ID must be a whole number')
    .positive('User ID must be positive')
    .required('User is required'),
  item_type_id: yup
    .number()
    .integer('Item type ID must be a whole number')
    .positive('Item type ID must be positive')
    .required('Item type is required'),
  requested_quantity: yup
    .number()
    .integer('Requested quantity must be a whole number')
    .positive('Requested quantity must be positive')
    .required('Requested quantity is required'),
  notes: yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters'),
})

export const updateConsumableRequestSchema = yup.object({
  fulfilled_quantity: yup
    .number()
    .integer('Fulfilled quantity must be a whole number')
    .min(0, 'Fulfilled quantity cannot be negative'),
  status: yup
    .string()
    .oneOf(['pending', 'fulfilled', 'partial', 'cancelled'], 'Invalid status'),
  fulfilled_date: yup.date(),
  notes: yup
    .string()
    .max(1000, 'Notes must be less than 1000 characters'),
})

// Notification validation schemas
export const createNotificationSchema = yup.object({
  user_id: yup
    .number()
    .integer('User ID must be a whole number')
    .positive('User ID must be positive')
    .required('User is required'),
  type: yup
    .string()
    .required('Type is required')
    .max(50, 'Type must be less than 50 characters'),
  title: yup
    .string()
    .required('Title is required')
    .max(200, 'Title must be less than 200 characters'),
  message: yup
    .string()
    .required('Message is required')
    .max(1000, 'Message must be less than 1000 characters'),
})

// Audit log validation schema
export const createAuditLogSchema = yup.object({
  user_id: yup
    .number()
    .integer('User ID must be a whole number')
    .positive('User ID must be positive'),
  action: yup
    .string()
    .required('Action is required')
    .max(50, 'Action must be less than 50 characters'),
  entity_type: yup
    .string()
    .required('Entity type is required')
    .max(50, 'Entity type must be less than 50 characters'),
  entity_id: yup
    .number()
    .integer('Entity ID must be a whole number')
    .positive('Entity ID must be positive')
    .required('Entity ID is required'),
  old_values: yup.mixed(),
  new_values: yup.mixed(),
  ip_address: yup
    .string()
    .matches(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      'Invalid IP address format'
    ),
  user_agent: yup
    .string()
    .max(500, 'User agent must be less than 500 characters'),
})

// Data integrity validation functions
export const validateUUID = (uuid: string): boolean => {
  try {
    uuidSchema.validateSync(uuid)
    return true
  } catch {
    return false
  }
}

export const validateQuantity = (quantity: number, available: number): boolean => {
  return quantity > 0 && quantity <= available
}

export const validateLoanDuration = (dueDate: Date): boolean => {
  const now = new Date()
  const maxDuration = new Date()
  maxDuration.setFullYear(now.getFullYear() + 1) // Max 1 year loan
  
  return dueDate > now && dueDate <= maxDuration
}

export const validateToolStatus = (
  currentStatus: string,
  newStatus: string
): boolean => {
  const validTransitions: Record<string, string[]> = {
    available: ['loaned', 'out-of-service', 'lost', 'damaged'],
    loaned: ['available', 'lost', 'damaged'],
    'out-of-service': ['available', 'lost', 'damaged'],
    lost: ['available'], // Can be found
    damaged: ['available', 'out-of-service'], // Can be repaired
  }
  
  return validTransitions[currentStatus]?.includes(newStatus) || false
}

// Business rule validation
export const validateLoanEligibility = (
  toolStatus: string,
  userActiveLoans: number,
  maxLoansPerUser: number = 5
): { isEligible: boolean; reason?: string } => {
  if (toolStatus !== 'available') {
    return {
      isEligible: false,
      reason: `Tool is currently ${toolStatus} and cannot be loaned`,
    }
  }
  
  if (userActiveLoans >= maxLoansPerUser) {
    return {
      isEligible: false,
      reason: `User has reached the maximum number of active loans (${maxLoansPerUser})`,
    }
  }
  
  return { isEligible: true }
}

export const validateConsumableRequest = (
  requestedQuantity: number,
  availableQuantity: number
): { isValid: boolean; canFulfill: boolean; reason?: string } => {
  if (requestedQuantity <= 0) {
    return {
      isValid: false,
      canFulfill: false,
      reason: 'Requested quantity must be greater than 0',
    }
  }
  
  if (requestedQuantity > availableQuantity) {
    return {
      isValid: true,
      canFulfill: false,
      reason: `Insufficient stock. Available: ${availableQuantity}, Requested: ${requestedQuantity}`,
    }
  }
  
  return {
    isValid: true,
    canFulfill: true,
  }
}