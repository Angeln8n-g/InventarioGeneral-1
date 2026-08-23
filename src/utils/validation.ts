import { z } from 'zod'

// Helper to provide validateSync compatibility on Zod schemas
function withValidateSync<T extends z.ZodTypeAny>(schema: T): T & { validateSync: (data: unknown) => z.infer<T> } {
  const wrapped = schema as T & { validateSync: (data: unknown) => z.infer<T> }
  wrapped.validateSync = (data: unknown) => {
    return schema.parse(data)
  }
  return wrapped
}

// UUID validation schema
export const uuidSchema = withValidateSync(
  z.string().regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    'Invalid UUID format'
  )
)

// User validation schemas
export const createUserSchema = withValidateSync(
  z
    .object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
      email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters'),
      role: z.enum(['user', 'admin']).optional(),
      role_id: z.number().int().positive().optional(),
    })
    .refine((val) => !!(val.role || val.role_id), {
      message: 'Either role or role_id must be provided',
    })
)

export const updateUserSchema = withValidateSync(
  z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be less than 50 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters').optional(),
    full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters').optional(),
    role: z.enum(['user', 'admin']).optional(),
  })
)

// Login validation schema
export const loginSchema = withValidateSync(
  z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
  })
)

// Item type validation schemas
export const createItemTypeSchema = withValidateSync(
  z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    category: z.string().max(50, 'Category must be less than 50 characters').optional(),
    is_consumable: z.boolean().default(false),
    default_loan_duration_days: z
      .number()
      .int('Loan duration must be a whole number')
      .min(1, 'Loan duration must be at least 1 day')
      .max(365, 'Loan duration cannot exceed 365 days')
      .default(7),
  })
)

export const updateItemTypeSchema = withValidateSync(createItemTypeSchema.partial())

// Tool instance validation schemas
export const createToolInstanceSchema = withValidateSync(
  z.object({
    item_type_id: z.number().int('Item type ID must be a whole number').positive('Item type ID must be positive'),
    qr_code: z.string().optional(),
    serial_number: z.string().max(100, 'Serial number must be less than 100 characters').optional(),
    status: z.enum(['available', 'loaned', 'out-of-service', 'lost', 'damaged']).default('available'),
    condition_notes: z.string().max(1000, 'Condition notes must be less than 1000 characters').optional(),
  })
)

export const updateToolInstanceSchema = withValidateSync(createToolInstanceSchema.partial())

// Loan validation schemas
export const createLoanSchema = withValidateSync(
  z.object({
    user_id: z.number().int('User ID must be a whole number').positive('User ID must be positive'),
    tool_instance_id: z.number().int('Tool instance ID must be a whole number').positive('Tool instance ID must be positive'),
    due_date: z.string().optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  })
)

export const updateLoanSchema = withValidateSync(
  z.object({
    return_date: z.union([z.string(), z.date()]).optional(),
    status: z.enum(['active', 'returned', 'overdue', 'lost']).optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  })
)

// Consumable request validation schemas
export const createConsumableRequestSchema = withValidateSync(
  z.object({
    user_id: z.number().int('User ID must be a whole number').positive('User ID must be positive'),
    item_type_id: z.number().int('Item type ID must be a whole number').positive('Item type ID must be positive'),
    requested_quantity: z.number().int('Requested quantity must be a whole number').positive('Requested quantity must be positive'),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  })
)

export const updateConsumableRequestSchema = withValidateSync(
  z.object({
    fulfilled_quantity: z.number().int().min(0, 'Fulfilled quantity cannot be negative').optional(),
    status: z.enum(['pending', 'fulfilled', 'partial', 'cancelled']).optional(),
    fulfilled_date: z.union([z.string(), z.date()]).optional().nullable(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  })
)

// Notification validation schemas
export const createNotificationSchema = withValidateSync(
  z.object({
    user_id: z.number().int('User ID must be a whole number').positive('User ID must be positive'),
    type: z.string().min(1, 'Type is required').max(50, 'Type must be less than 50 characters'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    message: z.string().min(1, 'Message is required').max(1000, 'Message must be less than 1000 characters'),
  })
)

// Audit log validation schema
export const createAuditLogSchema = withValidateSync(
  z.object({
    user_id: z.number().int().positive().optional().nullable(),
    action: z.string().min(1, 'Action is required').max(50, 'Action must be less than 50 characters'),
    entity_type: z.string().min(1, 'Entity type is required').max(50, 'Entity type must be less than 50 characters'),
    entity_id: z.number().int().positive(),
    old_values: z.unknown().optional().nullable(),
    new_values: z.unknown().optional().nullable(),
    ip_address: z
      .string()
      .regex(
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        'Invalid IP address format'
      )
      .optional()
      .nullable(),
    user_agent: z.string().max(500, 'User agent must be less than 500 characters').optional().nullable(),
  })
)

// Data integrity validation functions
export const validateUUID = (uuid: string): boolean => {
  const result = uuidSchema.safeParse(uuid)
  return result.success
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