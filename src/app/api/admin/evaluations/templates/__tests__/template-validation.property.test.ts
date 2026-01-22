/**
 * Evaluation Templates - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 6: Plantilla requiere al menos una pregunta
 * Validates: Requirements 2.2
 * 
 * Property Description:
 * Para cualquier intento de crear o actualizar una plantilla, el sistema debe rechazar 
 * la operación si la lista de preguntas está vacía.
 */

import * as fc from 'fast-check'
import type { CreateTemplateInput, UpdateTemplateInput, SpaceType, QuestionCategory } from '@/types/evaluations'

// ============================================================================
// Validation Functions (extracted from API routes for testing)
// ============================================================================

const validSpaceTypes: SpaceType[] = ['training_room', 'warehouse', 'external_plant']
const validCategories: QuestionCategory[] = ['organization', 'cleanliness', 'maintenance']

/**
 * Validates the input for creating a new evaluation template
 * Extracted from src/app/api/admin/evaluations/templates/route.ts
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
  if (!input.space_type || !validSpaceTypes.includes(input.space_type as SpaceType)) {
    errors.push('Valid space_type is required (training_room, warehouse, or external_plant)')
  }
  
  // Validate questions
  if (!input.questions || !Array.isArray(input.questions)) {
    errors.push('Questions array is required')
  } else if (input.questions.length === 0) {
    errors.push('At least one question is required')
  } else {
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
 * Validates the input for updating an evaluation template
 * Extracted from src/app/api/admin/evaluations/templates/[id]/route.ts
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

// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for valid space types
 */
const spaceTypeArb = fc.constantFrom<SpaceType>('training_room', 'warehouse', 'external_plant')

/**
 * Generator for valid question categories
 */
const categoryArb = fc.constantFrom<QuestionCategory>('organization', 'cleanliness', 'maintenance')

/**
 * Generator for valid template names (non-empty, max 255 chars)
 */
const templateNameArb = fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0)

/**
 * Generator for valid question text (non-empty)
 */
const questionTextArb = fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0)

/**
 * Generator for a single valid question
 */
const validQuestionArb = fc.record({
  question_text: questionTextArb,
  category: categoryArb,
  is_required: fc.boolean(),
  display_order: fc.integer({ min: 0, max: 100 }),
})

/**
 * Generator for a non-empty array of valid questions
 */
const validQuestionsArrayArb = fc.array(validQuestionArb, { minLength: 1, maxLength: 20 })

/**
 * Generator for a valid CreateTemplateInput
 */
const validCreateTemplateInputArb = fc.record({
  name: templateNameArb,
  space_type: spaceTypeArb,
  questions: validQuestionsArrayArb,
})

/**
 * Generator for a template input with empty questions array
 */
const templateWithEmptyQuestionsArb = fc.record({
  name: templateNameArb,
  space_type: spaceTypeArb,
  questions: fc.constant([]),
})

/**
 * Generator for a template input without questions field
 */
const templateWithoutQuestionsArb = fc.record({
  name: templateNameArb,
  space_type: spaceTypeArb,
})

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 6: Plantilla requiere al menos una pregunta', () => {
  /**
   * Property 6: Template Requires At Least One Question
   * For any attempt to create or update a template, the system must reject 
   * the operation if the questions list is empty.
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Create Template Validation', () => {
    test('should reject templates with empty questions array', () => {
      fc.assert(
        fc.property(
          templateWithEmptyQuestionsArb,
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('At least one question is required')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject templates without questions field', () => {
      fc.assert(
        fc.property(
          templateWithoutQuestionsArb,
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Questions array is required')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept templates with at least one valid question', () => {
      fc.assert(
        fc.property(
          validCreateTemplateInputArb,
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            // Should be valid since we have at least one question
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
            expect(result.data).toBeDefined()
            expect(result.data!.questions.length).toBeGreaterThanOrEqual(1)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should preserve all questions when valid', () => {
      fc.assert(
        fc.property(
          validCreateTemplateInputArb,
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            if (result.isValid && result.data) {
              // The number of questions in output should match input
              expect(result.data.questions.length).toBe(input.questions.length)
            }
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Update Template Validation', () => {
    test('should reject updates with empty questions array', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.option(templateNameArb, { nil: undefined }),
            questions: fc.constant([]),
          }),
          (input) => {
            const result = validateUpdateTemplateInput(input)
            
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('At least one question is required when updating questions')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept updates with at least one valid question', () => {
      fc.assert(
        fc.property(
          fc.record({
            questions: validQuestionsArrayArb,
          }),
          (input) => {
            const result = validateUpdateTemplateInput(input)
            
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
            expect(result.data).toBeDefined()
            expect(result.data!.questions!.length).toBeGreaterThanOrEqual(1)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept updates without questions field (updating other fields only)', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: templateNameArb,
          }),
          (input) => {
            const result = validateUpdateTemplateInput(input)
            
            // Should be valid - updating name only, not touching questions
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
            expect(result.data).toBeDefined()
            expect(result.data!.questions).toBeUndefined()
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept updates with space_type only', () => {
      fc.assert(
        fc.property(
          fc.record({
            space_type: spaceTypeArb,
          }),
          (input) => {
            const result = validateUpdateTemplateInput(input)
            
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should accept updates with is_active only', () => {
      fc.assert(
        fc.property(
          fc.record({
            is_active: fc.boolean(),
          }),
          (input) => {
            const result = validateUpdateTemplateInput(input)
            
            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Question Count Invariants', () => {
    test('valid templates always have questions.length >= 1', () => {
      fc.assert(
        fc.property(
          validCreateTemplateInputArb,
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            if (result.isValid && result.data) {
              expect(result.data.questions.length).toBeGreaterThanOrEqual(1)
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    test('invalid templates with empty questions always fail validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: templateNameArb,
            space_type: spaceTypeArb,
            questions: fc.constant([]),
          }),
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            // Must always be invalid
            expect(result.isValid).toBe(false)
            // Must have the specific error about questions
            const hasQuestionError = result.errors.some(
              e => e.includes('question') || e.includes('Questions')
            )
            expect(hasQuestionError).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('questions array with null/undefined elements is rejected', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: templateNameArb,
            space_type: spaceTypeArb,
            questions: fc.array(fc.constantFrom(null, undefined), { minLength: 1, maxLength: 5 }),
          }),
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            expect(result.isValid).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })
  })

  describe('Edge Cases', () => {
    test('should reject null body', () => {
      const result = validateCreateTemplateInput(null)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Request body is required')
    })

    test('should reject undefined body', () => {
      const result = validateCreateTemplateInput(undefined)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Request body is required')
    })

    test('should reject non-object body', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.integer(), fc.boolean()),
          (input) => {
            const result = validateCreateTemplateInput(input)
            expect(result.isValid).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject questions that is not an array', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: templateNameArb,
            space_type: spaceTypeArb,
            questions: fc.oneof(fc.string(), fc.integer(), fc.object()),
          }),
          (input) => {
            const result = validateCreateTemplateInput(input)
            expect(result.isValid).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('single question template is valid', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: templateNameArb,
            space_type: spaceTypeArb,
            questions: fc.array(validQuestionArb, { minLength: 1, maxLength: 1 }),
          }),
          (input) => {
            const result = validateCreateTemplateInput(input)
            
            expect(result.isValid).toBe(true)
            expect(result.data!.questions.length).toBe(1)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})


// ============================================================================
// Property 13: Modificar plantilla en uso crea nueva versión
// ============================================================================

/**
 * Feature: classroom-evaluation-system, Property 13: Modificar plantilla en uso crea nueva versión
 * Validates: Requirements 2.6
 * 
 * Property Description:
 * Para cualquier plantilla que tenga evaluaciones completadas asociadas, al modificarla 
 * el sistema debe crear una nueva versión preservando la versión anterior.
 */

/**
 * Mock function to simulate template versioning logic
 * In the real implementation, this is handled by evaluationTemplateOperations.update
 */
interface TemplateWithEvaluations {
  id: number
  name: string
  space_type: SpaceType
  version: number
  is_active: boolean
  hasCompletedEvaluations: boolean
}

interface VersioningResult {
  template: TemplateWithEvaluations
  newVersionCreated: boolean
  originalPreserved: boolean
}

/**
 * Simulates the versioning logic from the update operation
 * When a template has completed evaluations, modifications create a new version
 */
function simulateTemplateVersioning(
  existingTemplate: TemplateWithEvaluations,
  updates: UpdateTemplateInput
): VersioningResult {
  // If template has completed evaluations and we're modifying questions or name
  const isModifyingContent = updates.questions !== undefined || updates.name !== undefined
  
  if (existingTemplate.hasCompletedEvaluations && isModifyingContent) {
    // Create new version
    return {
      template: {
        ...existingTemplate,
        id: existingTemplate.id + 1000, // New ID for new version
        name: updates.name || existingTemplate.name,
        space_type: updates.space_type || existingTemplate.space_type,
        version: existingTemplate.version + 1,
        is_active: updates.is_active !== undefined ? updates.is_active : true,
        hasCompletedEvaluations: false, // New version has no evaluations yet
      },
      newVersionCreated: true,
      originalPreserved: true,
    }
  }
  
  // No versioning needed - update in place
  return {
    template: {
      ...existingTemplate,
      name: updates.name || existingTemplate.name,
      space_type: updates.space_type || existingTemplate.space_type,
      is_active: updates.is_active !== undefined ? updates.is_active : existingTemplate.is_active,
    },
    newVersionCreated: false,
    originalPreserved: false,
  }
}

describe('Feature: classroom-evaluation-system, Property 13: Modificar plantilla en uso crea nueva versión', () => {
  /**
   * Property 13: Template Versioning
   * For any template that has completed evaluations associated, when modifying it
   * the system must create a new version preserving the previous version.
   * 
   * **Validates: Requirements 2.6**
   */
  
  // Generator for existing template with evaluations
  const templateWithEvaluationsArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: templateNameArb,
    space_type: spaceTypeArb,
    version: fc.integer({ min: 1, max: 10 }),
    is_active: fc.boolean(),
    hasCompletedEvaluations: fc.constant(true),
  })
  
  // Generator for existing template without evaluations
  const templateWithoutEvaluationsArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: templateNameArb,
    space_type: spaceTypeArb,
    version: fc.integer({ min: 1, max: 10 }),
    is_active: fc.boolean(),
    hasCompletedEvaluations: fc.constant(false),
  })
  
  // Generator for content updates (name or questions)
  const contentUpdateArb = fc.oneof(
    fc.record({ name: templateNameArb }),
    fc.record({ questions: validQuestionsArrayArb }),
    fc.record({ name: templateNameArb, questions: validQuestionsArrayArb }),
  )
  
  // Generator for non-content updates (only is_active or space_type)
  const nonContentUpdateArb = fc.oneof(
    fc.record({ is_active: fc.boolean() }),
    fc.record({ space_type: spaceTypeArb }),
  )

  describe('Template Versioning', () => {
    test('modifying template with completed evaluations creates new version', () => {
      fc.assert(
        fc.property(
          templateWithEvaluationsArb,
          contentUpdateArb,
          (template, updates) => {
            const result = simulateTemplateVersioning(template, updates)
            
            // New version should be created
            expect(result.newVersionCreated).toBe(true)
            // Original should be preserved
            expect(result.originalPreserved).toBe(true)
            // Version number should increment
            expect(result.template.version).toBe(template.version + 1)
            // New template should have different ID
            expect(result.template.id).not.toBe(template.id)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('modifying template without completed evaluations updates in place', () => {
      fc.assert(
        fc.property(
          templateWithoutEvaluationsArb,
          contentUpdateArb,
          (template, updates) => {
            const result = simulateTemplateVersioning(template, updates)
            
            // No new version should be created
            expect(result.newVersionCreated).toBe(false)
            // Original not preserved (updated in place)
            expect(result.originalPreserved).toBe(false)
            // Same ID
            expect(result.template.id).toBe(template.id)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('non-content updates do not trigger versioning even with completed evaluations', () => {
      fc.assert(
        fc.property(
          templateWithEvaluationsArb,
          nonContentUpdateArb,
          (template, updates) => {
            const result = simulateTemplateVersioning(template, updates)
            
            // Non-content updates (is_active, space_type only) don't trigger versioning
            expect(result.newVersionCreated).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('new version has incremented version number', () => {
      fc.assert(
        fc.property(
          templateWithEvaluationsArb,
          contentUpdateArb,
          (template, updates) => {
            const result = simulateTemplateVersioning(template, updates)
            
            if (result.newVersionCreated) {
              expect(result.template.version).toBe(template.version + 1)
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    test('new version starts with no completed evaluations', () => {
      fc.assert(
        fc.property(
          templateWithEvaluationsArb,
          contentUpdateArb,
          (template, updates) => {
            const result = simulateTemplateVersioning(template, updates)
            
            if (result.newVersionCreated) {
              expect(result.template.hasCompletedEvaluations).toBe(false)
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    test('version number is always positive', () => {
      fc.assert(
        fc.property(
          fc.oneof(templateWithEvaluationsArb, templateWithoutEvaluationsArb),
          fc.oneof(contentUpdateArb, nonContentUpdateArb),
          (template, updates) => {
            const result = simulateTemplateVersioning(template, updates)
            expect(result.template.version).toBeGreaterThan(0)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})

// ============================================================================
// Property 12: Plantillas con evaluaciones pendientes no pueden eliminarse
// ============================================================================

/**
 * Feature: classroom-evaluation-system, Property 12: Plantillas con evaluaciones pendientes no pueden eliminarse
 * Validates: Requirements 2.7
 * 
 * Property Description:
 * Para cualquier intento de eliminar una plantilla, el sistema debe rechazar la eliminación 
 * si existen evaluaciones programadas con estado 'pending' que usen esa plantilla.
 */

interface TemplateForDeletion {
  id: number
  name: string
  hasPendingEvaluations: boolean
  hasCompletedEvaluations: boolean
}

interface DeletionResult {
  success: boolean
  error?: string
  errorCode?: string
}

/**
 * Simulates the deletion logic from the delete operation
 * Templates with pending evaluations cannot be deleted
 */
function simulateTemplateDeletion(template: TemplateForDeletion): DeletionResult {
  if (template.hasPendingEvaluations) {
    return {
      success: false,
      error: 'No se puede eliminar una plantilla con evaluaciones pendientes',
      errorCode: 'TEMPLATE_HAS_PENDING_EVALUATIONS',
    }
  }
  
  // Template can be deleted (even if it has completed evaluations)
  return {
    success: true,
  }
}

describe('Feature: classroom-evaluation-system, Property 12: Plantillas con evaluaciones pendientes no pueden eliminarse', () => {
  /**
   * Property 12: Template Deletion Restriction
   * For any attempt to delete a template, the system must reject the deletion
   * if there are scheduled evaluations with 'pending' status using that template.
   * 
   * **Validates: Requirements 2.7**
   */
  
  // Generator for template with pending evaluations
  const templateWithPendingArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: templateNameArb,
    hasPendingEvaluations: fc.constant(true),
    hasCompletedEvaluations: fc.boolean(),
  })
  
  // Generator for template without pending evaluations
  const templateWithoutPendingArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: templateNameArb,
    hasPendingEvaluations: fc.constant(false),
    hasCompletedEvaluations: fc.boolean(),
  })
  
  // Generator for any template
  const anyTemplateArb = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    name: templateNameArb,
    hasPendingEvaluations: fc.boolean(),
    hasCompletedEvaluations: fc.boolean(),
  })

  describe('Template Deletion', () => {
    test('templates with pending evaluations cannot be deleted', () => {
      fc.assert(
        fc.property(
          templateWithPendingArb,
          (template) => {
            const result = simulateTemplateDeletion(template)
            
            expect(result.success).toBe(false)
            expect(result.errorCode).toBe('TEMPLATE_HAS_PENDING_EVALUATIONS')
          }
        ),
        { numRuns: 25 }
      )
    })

    test('templates without pending evaluations can be deleted', () => {
      fc.assert(
        fc.property(
          templateWithoutPendingArb,
          (template) => {
            const result = simulateTemplateDeletion(template)
            
            expect(result.success).toBe(true)
            expect(result.error).toBeUndefined()
          }
        ),
        { numRuns: 25 }
      )
    })

    test('deletion result is deterministic based on pending evaluations', () => {
      fc.assert(
        fc.property(
          anyTemplateArb,
          (template) => {
            const result1 = simulateTemplateDeletion(template)
            const result2 = simulateTemplateDeletion(template)
            
            expect(result1.success).toBe(result2.success)
            expect(result1.errorCode).toBe(result2.errorCode)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('completed evaluations do not block deletion', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            name: templateNameArb,
            hasPendingEvaluations: fc.constant(false),
            hasCompletedEvaluations: fc.constant(true),
          }),
          (template) => {
            const result = simulateTemplateDeletion(template)
            
            // Having completed evaluations should not block deletion
            expect(result.success).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('deletion success is solely determined by pending evaluations status', () => {
      fc.assert(
        fc.property(
          anyTemplateArb,
          (template) => {
            const result = simulateTemplateDeletion(template)
            
            // Success should be the inverse of hasPendingEvaluations
            expect(result.success).toBe(!template.hasPendingEvaluations)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('error message is in Spanish when deletion fails', () => {
      fc.assert(
        fc.property(
          templateWithPendingArb,
          (template) => {
            const result = simulateTemplateDeletion(template)
            
            if (!result.success) {
              expect(result.error).toContain('evaluaciones pendientes')
            }
          }
        ),
        { numRuns: 25 }
      )
    })

    test('no error when deletion succeeds', () => {
      fc.assert(
        fc.property(
          templateWithoutPendingArb,
          (template) => {
            const result = simulateTemplateDeletion(template)
            
            if (result.success) {
              expect(result.error).toBeUndefined()
              expect(result.errorCode).toBeUndefined()
            }
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})
