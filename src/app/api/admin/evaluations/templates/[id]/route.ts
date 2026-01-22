import { NextRequest, NextResponse } from 'next/server'
import { evaluationTemplateOperations, auditLogOperations } from '@/lib/supabase-client'
import { withPermission } from '@/lib/auth-middleware'
import { PERMISSIONS } from '@/lib/permissions'
import { ERROR_CODES, ERROR_MESSAGES } from '@/utils/constants'
import type { UpdateTemplateInput, SpaceType, QuestionCategory } from '@/types/evaluations'

/**
 * Validates the input for updating an evaluation template
 * @param body - The request body to validate
 * @returns Validation result with isValid flag and errors array
 */
function validateUpdateTemplateInput(body: unknown): { 
  isValid: boolean
  errors: string[]
  data?: UpdateTemplateInput 
} {
  const errors: string[] = []
  
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] }
  }
  
  const input = body as Record<string, unknown>
  const data: UpdateTemplateInput = {}
  
  // Validate name (optional)
  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      errors.push('Template name must be a non-empty string')
    } else if (input.name.length > 255) {
      errors.push('Template name must be 255 characters or less')
    } else {
      data.name = input.name.trim()
    }
  }
  
  // Validate space_type (optional)
  const validSpaceTypes: SpaceType[] = ['training_room', 'warehouse', 'external_plant']
  if (input.space_type !== undefined) {
    if (!validSpaceTypes.includes(input.space_type as SpaceType)) {
      errors.push('Valid space_type is required (training_room, warehouse, or external_plant)')
    } else {
      data.space_type = input.space_type as SpaceType
    }
  }
  
  // Validate is_active (optional)
  if (input.is_active !== undefined) {
    if (typeof input.is_active !== 'boolean') {
      errors.push('is_active must be a boolean')
    } else {
      data.is_active = input.is_active
    }
  }
  
  // Validate questions (optional)
  if (input.questions !== undefined) {
    if (!Array.isArray(input.questions)) {
      errors.push('Questions must be an array')
    } else if (input.questions.length === 0) {
      errors.push('At least one question is required when updating questions')
    } else {
      const validCategories: QuestionCategory[] = ['organization', 'cleanliness', 'maintenance']
      const validatedQuestions: UpdateTemplateInput['questions'] = []
      
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
        
        if (errors.length === 0) {
          validatedQuestions.push({
            id: typeof q.id === 'number' ? q.id : undefined,
            question_text: (q.question_text as string).trim(),
            category: q.category as QuestionCategory,
            is_required: q.is_required as boolean,
            display_order: typeof q.display_order === 'number' ? q.display_order : index,
          })
        }
      })
      
      if (errors.length === 0) {
        data.questions = validatedQuestions
      }
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors }
  }
  
  // Check that at least one field is being updated
  if (Object.keys(data).length === 0) {
    return { isValid: false, errors: ['At least one field must be provided for update'] }
  }
  
  return { isValid: true, errors: [], data }
}

/**
 * GET /api/admin/evaluations/templates/[id]
 * Gets a single evaluation template by ID with all its questions
 * Requires admin role
 * 
 * @returns Template with questions
 * Validates: Requirements 2.5, 8.3, 8.4
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async () => {
      const { id } = await params
      const templateId = parseInt(id, 10)
      
      if (isNaN(templateId) || templateId <= 0) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid template ID',
            timestamp: new Date().toISOString(),
          },
        }, { status: 400 })
      }
      
      const template = await evaluationTemplateOperations.getById(templateId)
      
      if (!template) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Plantilla no encontrada',
            timestamp: new Date().toISOString(),
          },
        }, { status: 404 })
      }
      
      return NextResponse.json({
        data: template,
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Templates API] GET [id] error:', error)
    
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
 * PUT /api/admin/evaluations/templates/[id]
 * Updates an existing evaluation template
 * If template has completed evaluations, creates a new version preserving history
 * Requires admin role
 * 
 * @body UpdateTemplateInput - Template data to update
 * @returns Updated template with questions (or new version if versioning triggered)
 * Validates: Requirements 2.5, 2.6, 8.3, 8.4
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const templateId = parseInt(id, 10)
      
      if (isNaN(templateId) || templateId <= 0) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid template ID',
            timestamp: new Date().toISOString(),
          },
        }, { status: 400 })
      }
      
      // Check if template exists
      const existingTemplate = await evaluationTemplateOperations.getById(templateId)
      
      if (!existingTemplate) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Plantilla no encontrada',
            timestamp: new Date().toISOString(),
          },
        }, { status: 404 })
      }
      
      const body = await request.json()
      
      // Validate input
      const validation = validateUpdateTemplateInput(body)
      
      if (!validation.isValid || !validation.data) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Validation failed',
            details: validation.errors,
            timestamp: new Date().toISOString(),
          },
        }, { status: 400 })
      }
      
      // Store old values for audit log
      const oldValues = {
        name: existingTemplate.name,
        space_type: existingTemplate.space_type,
        is_active: existingTemplate.is_active,
        questions_count: existingTemplate.questions.length,
      }
      
      // Update template (versioning is handled in the operations layer)
      const updatedTemplate = await evaluationTemplateOperations.update(
        templateId,
        validation.data,
        auth.user.id
      )
      
      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'evaluation_template_update',
          entity_type: 'evaluation_template',
          entity_id: updatedTemplate.id,
          old_values: oldValues as unknown as Record<string, unknown>,
          new_values: validation.data as unknown as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Evaluation Templates API] Audit log error (non-critical):', auditError)
      }
      
      // Check if a new version was created
      const isNewVersion = updatedTemplate.id !== templateId
      
      return NextResponse.json({
        data: updatedTemplate,
        message: isNewVersion 
          ? 'Se creó una nueva versión de la plantilla para preservar el historial'
          : 'Plantilla de evaluación actualizada exitosamente',
        new_version_created: isNewVersion,
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Templates API] PUT [id] error:', error)
    
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

/**
 * DELETE /api/admin/evaluations/templates/[id]
 * Deletes an evaluation template
 * Only allowed if template has no pending evaluations
 * Requires admin role
 * 
 * @returns Success message
 * Validates: Requirements 2.7, 8.3, 8.4
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return await withPermission(request, PERMISSIONS.ADMIN_MANAGE_TOOLS, async (auth) => {
      const { id } = await params
      const templateId = parseInt(id, 10)
      
      if (isNaN(templateId) || templateId <= 0) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Invalid template ID',
            timestamp: new Date().toISOString(),
          },
        }, { status: 400 })
      }
      
      // Check if template exists
      const existingTemplate = await evaluationTemplateOperations.getById(templateId)
      
      if (!existingTemplate) {
        return NextResponse.json({
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'Plantilla no encontrada',
            timestamp: new Date().toISOString(),
          },
        }, { status: 404 })
      }
      
      // Store template info for audit log before deletion
      const deletedTemplateInfo = {
        id: existingTemplate.id,
        name: existingTemplate.name,
        space_type: existingTemplate.space_type,
        version: existingTemplate.version,
        questions_count: existingTemplate.questions.length,
      }
      
      // Delete template (will throw if has pending evaluations)
      await evaluationTemplateOperations.delete(templateId)
      
      // Create audit log
      try {
        await auditLogOperations.create({
          user_id: auth.user.id,
          action: 'evaluation_template_delete',
          entity_type: 'evaluation_template',
          entity_id: templateId,
          old_values: deletedTemplateInfo as unknown as Record<string, unknown>,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        })
      } catch (auditError) {
        console.error('[Evaluation Templates API] Audit log error (non-critical):', auditError)
      }
      
      return NextResponse.json({
        message: 'Plantilla de evaluación eliminada exitosamente',
      })
    })
  } catch (error: unknown) {
    console.error('[Evaluation Templates API] DELETE [id] error:', error)
    
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
      
      // Handle specific error for pending evaluations
      if (error.message === 'Cannot delete template with pending evaluations') {
        return NextResponse.json({
          error: {
            code: 'TEMPLATE_HAS_PENDING_EVALUATIONS',
            message: 'No se puede eliminar una plantilla con evaluaciones pendientes',
            timestamp: new Date().toISOString(),
          },
        }, { status: 409 })
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
