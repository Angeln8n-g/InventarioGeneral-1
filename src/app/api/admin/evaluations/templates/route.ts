import { NextRequest, NextResponse } from 'next/server'
import { evaluationTemplateOperations, templateQuestionOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { CreateTemplateInput, SpaceType, QuestionCategory } from '@/types/evaluations'

/**
 * Validates the input for creating a new evaluation template
 * @param body - The request body to validate
 * @returns Validation result with isValid flag and errors array
 */
function validateCreateTemplateInput(body: unknown): { 
  isValid: boolean
  errors: string[]
  data?: CreateTemplateInput 
} {
  const errors: string[] = []
  
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] }
  }
  
  const input = body as Record<string, unknown>
  
  // Validate name
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push('Template name is required')
  } else if (input.name.length > 255) {
    errors.push('Template name must be 255 characters or less')
  }
  
  // Validate space_type
  const validSpaceTypes: SpaceType[] = ['training_room', 'warehouse', 'external_plant']
  if (!input.space_type || !validSpaceTypes.includes(input.space_type as SpaceType)) {
    errors.push('Valid space_type is required (training_room, warehouse, or external_plant)')
  }
  
  // Validate questions
  if (!input.questions || !Array.isArray(input.questions)) {
    errors.push('Questions array is required')
  } else if (input.questions.length === 0) {
    errors.push('At least one question is required')
  } else {
    const validCategories: QuestionCategory[] = ['organization', 'cleanliness', 'maintenance']
    
    input.questions.forEach((question: unknown, index: number) => {
      if (!question || typeof question !== 'object') {
        errors.push(`Question at index ${index} is invalid`)
        return
      }
      
      const q = question as Record<string, unknown>
      
      if (!q.question_text || typeof q.question_text !== 'string' || q.question_text.trim().length === 0) {
        errors.push(`Question at index ${index}: question_text is required`)
      }
      
      if (!q.category || !validCategories.includes(q.category as QuestionCategory)) {
        errors.push(`Question at index ${index}: valid category is required (organization, cleanliness, or maintenance)`)
      }
      
      if (typeof q.is_required !== 'boolean') {
        errors.push(`Question at index ${index}: is_required must be a boolean`)
      }
    })
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors }
  }
  
  // Build validated input
  const questions = (input.questions as Array<Record<string, unknown>>).map((q, index) => ({
    question_text: (q.question_text as string).trim(),
    category: q.category as QuestionCategory,
    is_required: q.is_required as boolean,
    display_order: typeof q.display_order === 'number' ? q.display_order : index,
  }))
  
  return {
    isValid: true,
    errors: [],
    data: {
      name: (input.name as string).trim(),
      space_type: input.space_type as SpaceType,
      questions,
    },
  }
}

/**
 * GET /api/admin/evaluations/templates
 * Lists all active evaluation templates with question count
 * Requires admin role
 * 
 * @returns Array of templates with question_count field
 * Validates: Requirements 2.1, 8.3, 8.4
 */
export async function GET(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      // Get all active templates
      const templates = await evaluationTemplateOperations.getAll()
      
      // Get question counts for each template
      const templatesWithCounts = await Promise.all(
        templates.map(async (template) => {
          const questions = await templateQuestionOperations.getByTemplateId(template.id)
          return {
            ...template,
            question_count: questions.length,
          }
        })
      )
      
      return NextResponse.json({
        data: templatesWithCounts,
        total: templatesWithCounts.length,
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Templates API] GET error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        }, { status: 401 })
      }
      
      if (error.name === 'AuthorizationError') {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        }, { status: 403 })
      }
    }
    
    return NextResponse.json({
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: ERROR_MESSAGES.GENERIC_ERROR,
        timestamp: new Date().toISOString(),
      },
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/evaluations/templates
 * Creates a new evaluation template with questions
 * Requires admin role
 * 
 * @body CreateTemplateInput - Template data with questions
 * @returns Created template with questions
 * Validates: Requirements 2.2, 8.3, 8.4
 */
export async function POST(request: NextRequest) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      console.log('[Evaluation Templates API] POST request received')
      
      const body = await request.json()
      console.log('[Evaluation Templates API] Request body:', JSON.stringify(body, null, 2))
      
      // Validate input
      const validation = validateCreateTemplateInput(body)
      console.log('[Evaluation Templates API] Validation result:', validation)
      
      if (!validation.isValid || !validation.data) {
        console.log('[Evaluation Templates API] Validation failed:', validation.errors)
        return NextResponse.json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validation.errors,
            timestamp: new Date().toISOString(),
          },
        }, { status: 400 })
      }
      
      console.log('[Evaluation Templates API] Creating template...')
      const template = await evaluationTemplateOperations.create(validation.data, auth.user.id)
      console.log('[Evaluation Templates API] Template created:', template)
      
      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'evaluation_template_create',
          entity_type: 'evaluation_template',
          entity_id: template.id,
          new_values: validation.data as unknown as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Evaluation Templates API] Audit log error (non-critical):', auditError)
      }
      
      return NextResponse.json({
        data: template,
        message: 'Plantilla de evaluación creada exitosamente',
      }, { status: 201 })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Templates API] POST error:', error)
    
    if (error instanceof Error) {
      if (error.name === 'AuthenticationError') {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.AUTHENTICATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        }, { status: 401 })
      }
      
      if (error.name === 'AuthorizationError') {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.AUTHORIZATION_ERROR,
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        }, { status: 403 })
      }
      
      // Handle specific validation errors from the operations layer
      if (error.message === 'Template must have at least one question') {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'La plantilla debe tener al menos una pregunta',
            timestamp: new Date().toISOString(),
          },
        }, { status: 400 })
      }
    }
    
    return NextResponse.json({
      error: {
        code: ERROR_CODES.DATABASE_ERROR,
        message: (error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC_ERROR),
        timestamp: new Date().toISOString(),
      },
    }, { status: 500 })
  }
}
