import { z } from 'zod'
import { NextResponse } from 'next/server'
import { ERROR_CODES } from '@/utils/constants'

// ============================================================================
// Consumables Schemas
// ============================================================================

export const ConsumeConsumableSchema = z
  .object({
    qr_code: z.string().min(1, 'QR code is required'),
    quantity: z.number().positive('Quantity must be greater than 0').optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
    start_marker: z.number().int().nonnegative('Start marker must be a non-negative integer').optional(),
    end_marker: z.number().int().nonnegative('End marker must be a non-negative integer').optional(),
  })
  .refine(
    (data) => {
      // If start_marker or end_marker is provided, both must be provided and end > start
      if (data.start_marker !== undefined || data.end_marker !== undefined) {
        if (data.start_marker === undefined || data.end_marker === undefined) return false
        return data.end_marker > data.start_marker
      }
      // If no markers, quantity must be provided
      return data.quantity !== undefined && data.quantity > 0
    },
    {
      message: 'Must provide either a positive quantity or a valid marker range (where end > start)',
      path: ['quantity'],
    }
  )

export type ConsumeConsumableInput = z.infer<typeof ConsumeConsumableSchema>

export const ReturnConsumableItemSchema = z.object({
  item_type_id: z.number().int().positive(),
  consumable_stock_id: z.number().int().positive().optional(),
  returned_quantity: z.number().positive('Returned quantity must be greater than 0'),
  consumption_date: z.string().min(1, 'Consumption date is required'),
  notes: z.string().max(500).optional(),
  segment_start: z.number().int().nonnegative().optional(),
  segment_end: z.number().int().nonnegative().optional(),
})

export const ReturnConsumableRequestSchema = z.object({
  returns: z.array(ReturnConsumableItemSchema).min(1, 'At least one return item is required'),
})

export type ReturnConsumableRequestInput = z.infer<typeof ReturnConsumableRequestSchema>

// ============================================================================
// Loans Schemas
// ============================================================================

export const CreateLoanSchema = z.object({
  toolInstanceId: z.number().int().positive('Tool instance ID must be a positive integer'),
  dueDate: z.string().refine((dateStr) => !isNaN(Date.parse(dateStr)), {
    message: 'Invalid due date format',
  }),
  notes: z.string().max(500).optional(),
})

export type CreateLoanInput = z.infer<typeof CreateLoanSchema>

export const BatchLoanSchema = z.object({
  tool_instance_ids: z
    .array(z.number().int().positive())
    .min(1, 'tool_instance_ids array is required and must not be empty')
    .max(20, 'Cannot loan more than 20 tools in a single batch'),
  notes: z.string().max(500).optional(),
  due_date: z.string().optional(),
})

export type BatchLoanInput = z.infer<typeof BatchLoanSchema>

export const ReturnToolSchema = z.object({
  condition_notes: z.string().max(500).optional(),
  tool_status: z.enum(['available', 'out-of-service', 'damaged', 'lost']).default('available'),
})

export type ReturnToolInput = z.infer<typeof ReturnToolSchema>

// ============================================================================
// Classrooms Schemas
// ============================================================================

export const CreateClassroomSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  building: z.string().max(100).optional().nullable(),
  floor: z.string().max(50).optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  responsible_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
})

export type CreateClassroomInput = z.infer<typeof CreateClassroomSchema>

// ============================================================================
// Electronic Devices Schemas
// ============================================================================

export const CreateElectronicDeviceSchema = z.object({
  item_type_id: z.number().int().positive('Item type ID is required'),
  category_id: z.number().int().positive('Category ID is required'),
  qr_code: z.string().min(1, 'QR code is required'),
  serial_number: z.string().max(100).optional().nullable(),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  mac_address: z.string().max(50).optional().nullable(),
  ip_address: z.string().max(50).optional().nullable(),
  status: z.enum(['available', 'assigned', 'maintenance', 'retired', 'lost']).default('available'),
  condition_notes: z.string().max(500).optional().nullable(),
  specifications: z.record(z.string(), z.unknown()).optional().nullable(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
})

export type CreateElectronicDeviceInput = z.infer<typeof CreateElectronicDeviceSchema>

// ============================================================================
// Helper: Validate Request Body with Zod
// ============================================================================

export async function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  request: Request
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Invalid JSON body in request',
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    const result = schema.safeParse(json)
    if (!result.success) {
      const issues = result.error.issues || []
      const formattedErrors = issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }))

      return {
        success: false,
        response: NextResponse.json(
          {
            error: {
              code: ERROR_CODES.VALIDATION_ERROR,
              message: 'Validation failed',
              details: formattedErrors,
              timestamp: new Date().toISOString(),
            },
          },
          { status: 400 }
        ),
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: error instanceof Error ? error.message : 'Unknown validation error',
            timestamp: new Date().toISOString(),
          },
        },
        { status: 400 }
      ),
    }
  }
}
