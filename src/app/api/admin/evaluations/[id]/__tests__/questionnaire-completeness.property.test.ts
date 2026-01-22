/**
 * Questionnaire Completeness - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 16: Cuestionario contiene todas las preguntas de la plantilla
 * 
 * Property Description:
 * Para cualquier evaluación iniciada, el cuestionario debe contener exactamente las mismas 
 * preguntas que la plantilla asociada, en el mismo orden.
 * 
 * **Validates: Requirements 3.1**
 */

import * as fc from 'fast-check'
import type {
  TemplateQuestion,
  QuestionCategory,
  EvaluationStatus,
} from '@/types/evaluations'

// ============================================================================
// Types for Testing
// ============================================================================

/**
 * Template with questions for testing
 */
interface TestTemplate {
  id: number
  name: string
  space_type: 'training_room' | 'warehouse' | 'external_plant'
  version: number
  is_active: boolean
  questions: TemplateQuestion[]
}

/**
 * Scheduled evaluation for testing
 */
interface TestScheduledEvaluation {
  id: number
  classroom_id: number
  template_id: number
  scheduled_date: string
  status: EvaluationStatus
}


/**
 * Question in the questionnaire response
 */
interface QuestionnaireQuestion {
  id: number
  question_text: string
  category: QuestionCategory
  is_required: boolean
  display_order: number
  existing_response?: {
    response: 'yes' | 'no' | 'not_applicable'
    observation?: string
  }
}

/**
 * Questionnaire response structure
 */
interface QuestionnaireResponse {
  evaluation: {
    id: number
    classroom_id: number
    classroom_name: string
    scheduled_date: string
    status: string
  }
  template: {
    id: number
    name: string
    space_type: string
    version: number
  }
  questions: QuestionnaireQuestion[]
}

// ============================================================================
// Questionnaire Building Logic (extracted from API route for testing)
// ============================================================================

/**
 * Builds the questionnaire response from a template and scheduled evaluation
 * This simulates the logic in GET /api/admin/evaluations/[id]/questionnaire
 * 
 * Property 16: The questionnaire must contain exactly the same questions 
 * as the associated template, in the same order.
 * 
 * @param template - The evaluation template with questions
 * @param evaluation - The scheduled evaluation
 * @returns The questionnaire response with all template questions
 */
function buildQuestionnaire(
  template: TestTemplate,
  evaluation: TestScheduledEvaluation
): QuestionnaireResponse {
  // Sort questions by display_order (as done in the API route)
  const sortedQuestions = [...template.questions]
    .sort((a, b) => a.display_order - b.display_order)
  
  // Map template questions to questionnaire questions
  const questions: QuestionnaireQuestion[] = sortedQuestions.map((question) => ({
    id: question.id,
    question_text: question.question_text,
    category: question.category,
    is_required: question.is_required,
    display_order: question.display_order,
  }))

  return {
    evaluation: {
      id: evaluation.id,
      classroom_id: evaluation.classroom_id,
      classroom_name: `Classroom ${evaluation.classroom_id}`,
      scheduled_date: evaluation.scheduled_date,
      status: evaluation.status,
    },
    template: {
      id: template.id,
      name: template.name,
      space_type: template.space_type,
      version: template.version,
    },
    questions,
  }
}


// ============================================================================
// Arbitraries (Generators) for Property-Based Testing
// ============================================================================

/**
 * Generator for question categories
 */
const categoryArb: fc.Arbitrary<QuestionCategory> = fc.constantFrom(
  'organization',
  'cleanliness',
  'maintenance'
)

/**
 * Generator for space types
 */
const spaceTypeArb: fc.Arbitrary<'training_room' | 'warehouse' | 'external_plant'> = fc.constantFrom(
  'training_room',
  'warehouse',
  'external_plant'
)

/**
 * Generator for evaluation statuses that allow questionnaire access
 * (pending or overdue - completed and cancelled cannot access questionnaire)
 */
const accessibleStatusArb: fc.Arbitrary<EvaluationStatus> = fc.constantFrom(
  'pending',
  'overdue'
)

/**
 * Creates a template question with specific parameters
 */
function createTemplateQuestion(
  id: number,
  templateId: number,
  questionText: string,
  category: QuestionCategory,
  isRequired: boolean,
  displayOrder: number
): TemplateQuestion {
  return {
    id,
    template_id: templateId,
    question_text: questionText,
    category,
    is_required: isRequired,
    display_order: displayOrder,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Generator for a template with questions
 * Generates templates with 1-30 questions with unique IDs and display orders
 */
const templateWithQuestionsArb: fc.Arbitrary<TestTemplate> = fc.tuple(
  fc.integer({ min: 1, max: 10000 }), // Template ID
  fc.string({ minLength: 1, maxLength: 100 }), // Template name
  spaceTypeArb,
  fc.integer({ min: 1, max: 100 }), // Version
  fc.integer({ min: 1, max: 30 }), // Number of questions
).chain(([templateId, name, spaceType, version, numQuestions]) => {
  return fc.tuple(
    fc.array(categoryArb, { minLength: numQuestions, maxLength: numQuestions }),
    fc.array(fc.boolean(), { minLength: numQuestions, maxLength: numQuestions }),
    fc.array(
      fc.string({ minLength: 5, maxLength: 200 }),
      { minLength: numQuestions, maxLength: numQuestions }
    ),
  ).map(([categories, requiredFlags, questionTexts]) => {
    const questions: TemplateQuestion[] = []
    
    for (let i = 0; i < numQuestions; i++) {
      questions.push(createTemplateQuestion(
        i + 1, // Question ID (1-based)
        templateId,
        questionTexts[i] || `Question ${i + 1}`,
        categories[i],
        requiredFlags[i],
        i // Display order (0-based)
      ))
    }

    return {
      id: templateId,
      name: name || `Template ${templateId}`,
      space_type: spaceType,
      version,
      is_active: true,
      questions,
    }
  })
})


/**
 * Generator for a template with questions in random display order
 * This tests that the questionnaire correctly sorts by display_order
 */
const templateWithShuffledQuestionsArb: fc.Arbitrary<TestTemplate> = fc.tuple(
  fc.integer({ min: 1, max: 10000 }), // Template ID
  fc.string({ minLength: 1, maxLength: 100 }), // Template name
  spaceTypeArb,
  fc.integer({ min: 1, max: 100 }), // Version
  fc.integer({ min: 2, max: 30 }), // Number of questions (at least 2 to test ordering)
).chain(([templateId, name, spaceType, version, numQuestions]) => {
  // Generate a shuffled array of display orders
  const displayOrders = Array.from({ length: numQuestions }, (_, i) => i)
  
  return fc.tuple(
    fc.shuffledSubarray(displayOrders, { minLength: numQuestions, maxLength: numQuestions }),
    fc.array(categoryArb, { minLength: numQuestions, maxLength: numQuestions }),
    fc.array(fc.boolean(), { minLength: numQuestions, maxLength: numQuestions }),
  ).map(([shuffledOrders, categories, requiredFlags]) => {
    const questions: TemplateQuestion[] = []
    
    for (let i = 0; i < numQuestions; i++) {
      questions.push(createTemplateQuestion(
        i + 1,
        templateId,
        `Question ${i + 1}`,
        categories[i],
        requiredFlags[i],
        shuffledOrders[i] // Use shuffled display order
      ))
    }

    return {
      id: templateId,
      name: name || `Template ${templateId}`,
      space_type: spaceType,
      version,
      is_active: true,
      questions,
    }
  })
})

/**
 * Generator for a valid ISO date string
 * Uses integer-based generation to avoid invalid date issues
 */
const isoDateStringArb: fc.Arbitrary<string> = fc.tuple(
  fc.integer({ min: 2020, max: 2030 }), // year
  fc.integer({ min: 1, max: 12 }), // month
  fc.integer({ min: 1, max: 28 }), // day (use 28 to avoid month-end issues)
  fc.integer({ min: 0, max: 23 }), // hour
  fc.integer({ min: 0, max: 59 }), // minute
).map(([year, month, day, hour, minute]) => {
  const date = new Date(year, month - 1, day, hour, minute, 0, 0)
  return date.toISOString()
})

/**
 * Generator for a scheduled evaluation
 */
const scheduledEvaluationArb: fc.Arbitrary<TestScheduledEvaluation> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  classroom_id: fc.integer({ min: 1, max: 1000 }),
  template_id: fc.integer({ min: 1, max: 10000 }),
  scheduled_date: isoDateStringArb,
  status: accessibleStatusArb,
})


// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 16: Cuestionario contiene todas las preguntas de la plantilla', () => {
  /**
   * Property 16: Questionnaire Contains All Template Questions
   * For any evaluation started, the questionnaire must contain exactly the same 
   * questions as the associated template, in the same order.
   * 
   * **Validates: Requirements 3.1**
   */

  describe('Question Count Completeness', () => {
    test('questionnaire should contain exactly the same number of questions as the template', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            // Link evaluation to template
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // Property: questionnaire question count equals template question count
            expect(questionnaire.questions.length).toBe(template.questions.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should not add any extra questions', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // All questionnaire question IDs should exist in template
            const templateQuestionIds = new Set(template.questions.map(q => q.id))
            const allQuestionsFromTemplate = questionnaire.questions.every(
              q => templateQuestionIds.has(q.id)
            )

            expect(allQuestionsFromTemplate).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should not omit any template questions', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // All template question IDs should exist in questionnaire
            const questionnaireQuestionIds = new Set(questionnaire.questions.map(q => q.id))
            const allTemplateQuestionsIncluded = template.questions.every(
              q => questionnaireQuestionIds.has(q.id)
            )

            expect(allTemplateQuestionsIncluded).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Question Order Preservation', () => {
    test('questionnaire questions should be in display_order sequence', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // Verify questions are sorted by display_order
            for (let i = 1; i < questionnaire.questions.length; i++) {
              const prevOrder = questionnaire.questions[i - 1].display_order
              const currOrder = questionnaire.questions[i].display_order
              expect(currOrder).toBeGreaterThanOrEqual(prevOrder)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should match template order when sorted by display_order', () => {
      fc.assert(
        fc.property(
          templateWithShuffledQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // Sort template questions by display_order
            const sortedTemplateQuestions = [...template.questions]
              .sort((a, b) => a.display_order - b.display_order)

            // Questionnaire questions should match sorted template questions
            for (let i = 0; i < questionnaire.questions.length; i++) {
              expect(questionnaire.questions[i].id).toBe(sortedTemplateQuestions[i].id)
              expect(questionnaire.questions[i].display_order).toBe(sortedTemplateQuestions[i].display_order)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire order should be deterministic for same template', () => {
      fc.assert(
        fc.property(
          templateWithShuffledQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            // Build questionnaire twice
            const questionnaire1 = buildQuestionnaire(template, linkedEvaluation)
            const questionnaire2 = buildQuestionnaire(template, linkedEvaluation)

            // Order should be identical
            expect(questionnaire1.questions.map(q => q.id))
              .toEqual(questionnaire2.questions.map(q => q.id))
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Question Content Preservation', () => {
    test('questionnaire should preserve question text exactly', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // Create a map of template questions by ID
            const templateQuestionsById = new Map(
              template.questions.map(q => [q.id, q])
            )

            // Each questionnaire question should have matching text
            questionnaire.questions.forEach(qq => {
              const templateQuestion = templateQuestionsById.get(qq.id)
              expect(templateQuestion).toBeDefined()
              expect(qq.question_text).toBe(templateQuestion!.question_text)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should preserve question category exactly', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            const templateQuestionsById = new Map(
              template.questions.map(q => [q.id, q])
            )

            questionnaire.questions.forEach(qq => {
              const templateQuestion = templateQuestionsById.get(qq.id)
              expect(templateQuestion).toBeDefined()
              expect(qq.category).toBe(templateQuestion!.category)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should preserve is_required flag exactly', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            const templateQuestionsById = new Map(
              template.questions.map(q => [q.id, q])
            )

            questionnaire.questions.forEach(qq => {
              const templateQuestion = templateQuestionsById.get(qq.id)
              expect(templateQuestion).toBeDefined()
              expect(qq.is_required).toBe(templateQuestion!.is_required)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should preserve display_order exactly', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            const templateQuestionsById = new Map(
              template.questions.map(q => [q.id, q])
            )

            questionnaire.questions.forEach(qq => {
              const templateQuestion = templateQuestionsById.get(qq.id)
              expect(templateQuestion).toBeDefined()
              expect(qq.display_order).toBe(templateQuestion!.display_order)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Template Metadata Preservation', () => {
    test('questionnaire should include correct template ID', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.template.id).toBe(template.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should include correct template name', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.template.name).toBe(template.name)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should include correct template space_type', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.template.space_type).toBe(template.space_type)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should include correct template version', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.template.version).toBe(template.version)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Evaluation Metadata Preservation', () => {
    test('questionnaire should include correct evaluation ID', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.evaluation.id).toBe(linkedEvaluation.id)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should include correct classroom_id', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.evaluation.classroom_id).toBe(linkedEvaluation.classroom_id)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should include correct scheduled_date', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.evaluation.scheduled_date).toBe(linkedEvaluation.scheduled_date)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should include correct status', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.evaluation.status).toBe(linkedEvaluation.status)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Category Distribution', () => {
    test('questionnaire should preserve category distribution from template', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // Count categories in template
            const templateCategoryCounts = {
              organization: template.questions.filter(q => q.category === 'organization').length,
              cleanliness: template.questions.filter(q => q.category === 'cleanliness').length,
              maintenance: template.questions.filter(q => q.category === 'maintenance').length,
            }

            // Count categories in questionnaire
            const questionnaireCategoryCounts = {
              organization: questionnaire.questions.filter(q => q.category === 'organization').length,
              cleanliness: questionnaire.questions.filter(q => q.category === 'cleanliness').length,
              maintenance: questionnaire.questions.filter(q => q.category === 'maintenance').length,
            }

            expect(questionnaireCategoryCounts).toEqual(templateCategoryCounts)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('questionnaire should preserve required/optional distribution from template', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            const templateRequiredCount = template.questions.filter(q => q.is_required).length
            const templateOptionalCount = template.questions.filter(q => !q.is_required).length

            const questionnaireRequiredCount = questionnaire.questions.filter(q => q.is_required).length
            const questionnaireOptionalCount = questionnaire.questions.filter(q => !q.is_required).length

            expect(questionnaireRequiredCount).toBe(templateRequiredCount)
            expect(questionnaireOptionalCount).toBe(templateOptionalCount)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Edge Cases', () => {
    test('should handle template with single question', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          categoryArb,
          fc.boolean(),
          scheduledEvaluationArb,
          (templateId, category, isRequired, evaluation) => {
            const template: TestTemplate = {
              id: templateId,
              name: `Single Question Template`,
              space_type: 'training_room',
              version: 1,
              is_active: true,
              questions: [
                createTemplateQuestion(1, templateId, 'Single question', category, isRequired, 0)
              ],
            }

            const linkedEvaluation = { ...evaluation, template_id: template.id }
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.questions.length).toBe(1)
            expect(questionnaire.questions[0].id).toBe(1)
            expect(questionnaire.questions[0].category).toBe(category)
            expect(questionnaire.questions[0].is_required).toBe(isRequired)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle template with many questions (stress test)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 50, max: 100 }), // Large number of questions
          scheduledEvaluationArb,
          (templateId, numQuestions, evaluation) => {
            const questions: TemplateQuestion[] = []
            for (let i = 0; i < numQuestions; i++) {
              questions.push(createTemplateQuestion(
                i + 1,
                templateId,
                `Question ${i + 1}`,
                'organization',
                true,
                i
              ))
            }

            const template: TestTemplate = {
              id: templateId,
              name: `Large Template`,
              space_type: 'warehouse',
              version: 1,
              is_active: true,
              questions,
            }

            const linkedEvaluation = { ...evaluation, template_id: template.id }
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            expect(questionnaire.questions.length).toBe(numQuestions)
            
            // Verify all questions are present and in order
            for (let i = 0; i < numQuestions; i++) {
              expect(questionnaire.questions[i].id).toBe(i + 1)
              expect(questionnaire.questions[i].display_order).toBe(i)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle all questions being required', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb.map(t => ({
            ...t,
            questions: t.questions.map(q => ({ ...q, is_required: true }))
          })),
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // All questions should be required
            expect(questionnaire.questions.every(q => q.is_required)).toBe(true)
            expect(questionnaire.questions.length).toBe(template.questions.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle all questions being optional', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb.map(t => ({
            ...t,
            questions: t.questions.map(q => ({ ...q, is_required: false }))
          })),
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // All questions should be optional
            expect(questionnaire.questions.every(q => !q.is_required)).toBe(true)
            expect(questionnaire.questions.length).toBe(template.questions.length)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle questions with same display_order (stable sort)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 2, max: 10 }),
          scheduledEvaluationArb,
          (templateId, numQuestions, evaluation) => {
            // Create questions with same display_order
            const questions: TemplateQuestion[] = []
            for (let i = 0; i < numQuestions; i++) {
              questions.push(createTemplateQuestion(
                i + 1,
                templateId,
                `Question ${i + 1}`,
                'cleanliness',
                true,
                0 // All same display_order
              ))
            }

            const template: TestTemplate = {
              id: templateId,
              name: `Same Order Template`,
              space_type: 'external_plant',
              version: 1,
              is_active: true,
              questions,
            }

            const linkedEvaluation = { ...evaluation, template_id: template.id }
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // All questions should be present
            expect(questionnaire.questions.length).toBe(numQuestions)
            
            // All should have same display_order
            expect(questionnaire.questions.every(q => q.display_order === 0)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })


  describe('Bijection Property (One-to-One Correspondence)', () => {
    test('there should be a bijection between template questions and questionnaire questions', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            const questionnaire = buildQuestionnaire(template, linkedEvaluation)

            // Same count (surjective)
            expect(questionnaire.questions.length).toBe(template.questions.length)

            // All template IDs appear exactly once in questionnaire (injective)
            const questionnaireIds = questionnaire.questions.map(q => q.id)
            const templateIds = template.questions.map(q => q.id)

            // Check no duplicates in questionnaire
            const uniqueQuestionnaireIds = new Set(questionnaireIds)
            expect(uniqueQuestionnaireIds.size).toBe(questionnaireIds.length)

            // Check all template IDs are present
            templateIds.forEach(id => {
              expect(questionnaireIds).toContain(id)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Idempotency', () => {
    test('building questionnaire multiple times should produce identical results', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          fc.integer({ min: 2, max: 5 }), // Number of times to build
          (template, evaluation, times) => {
            const linkedEvaluation = { ...evaluation, template_id: template.id }
            
            const questionnaires = Array.from({ length: times }, () => 
              buildQuestionnaire(template, linkedEvaluation)
            )

            // All questionnaires should be identical
            const firstQuestionnaire = questionnaires[0]
            questionnaires.slice(1).forEach(q => {
              expect(q.questions.length).toBe(firstQuestionnaire.questions.length)
              expect(q.questions.map(qq => qq.id)).toEqual(firstQuestionnaire.questions.map(qq => qq.id))
              expect(q.template).toEqual(firstQuestionnaire.template)
              expect(q.evaluation).toEqual(firstQuestionnaire.evaluation)
            })
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Status Independence', () => {
    test('questionnaire content should be the same regardless of evaluation status', () => {
      fc.assert(
        fc.property(
          templateWithQuestionsArb,
          scheduledEvaluationArb,
          (template, evaluation) => {
            // Create evaluations with different statuses
            const pendingEval = { ...evaluation, template_id: template.id, status: 'pending' as EvaluationStatus }
            const overdueEval = { ...evaluation, template_id: template.id, status: 'overdue' as EvaluationStatus }

            const pendingQuestionnaire = buildQuestionnaire(template, pendingEval)
            const overdueQuestionnaire = buildQuestionnaire(template, overdueEval)

            // Questions should be identical regardless of status
            expect(pendingQuestionnaire.questions.length).toBe(overdueQuestionnaire.questions.length)
            expect(pendingQuestionnaire.questions.map(q => q.id))
              .toEqual(overdueQuestionnaire.questions.map(q => q.id))
            
            // Template info should be identical
            expect(pendingQuestionnaire.template).toEqual(overdueQuestionnaire.template)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
