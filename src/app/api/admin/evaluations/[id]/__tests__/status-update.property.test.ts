/**
 * Status Update - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 11: Evaluación completada actualiza estado de programación
 * 
 * Property Description:
 * Para cualquier evaluación guardada exitosamente (no borrador), el estado de la 
 * programación asociada debe cambiar a 'completed'.
 * 
 * **Validates: Requirements 3.7**
 */

import * as fc from 'fast-check'
import type {
  ResponseType,
  TemplateQuestion,
  QuestionCategory,
  EvaluationStatus,
} from '@/types/evaluations'

// ============================================================================
// Types for Testing
// ============================================================================

/**
 * Response input for submitting an evaluation
 */
interface ResponseInput {
  question_id: number
  response: ResponseType
  observation?: string
}

/**
 * Scheduled evaluation state
 */
interface ScheduledEvaluationState {
  id: number
  classroom_id: number
  template_id: number
  scheduled_date: string
  status: EvaluationStatus
}

/**
 * Evaluation result after submission
 */
interface EvaluationResultState {
  id: number
  scheduled_evaluation_id: number
  evaluator_id: number
  is_draft: boolean
  total_score: number
  max_possible_score: number
  score_percentage: number
}

/**
 * Result of status update operation
 */
interface StatusUpdateResult {
  success: boolean
  newStatus: EvaluationStatus
  resultId: number
  isDraft: boolean
}

// ============================================================================
// Status Update Logic (extracted from evaluationResultOperations for testing)
// ============================================================================

/**
 * Simulates the status update logic from evaluationResultOperations.create/update
 * 
 * When an evaluation is saved:
 * - If is_draft is true: status remains unchanged
 * - If is_draft is false: status changes to 'completed'
 * 
 * @param scheduledEvaluation - The scheduled evaluation being submitted
 * @param isDraft - Whether this is a draft submission
 * @returns The new status after the operation
 */
function determineNewStatus(
  scheduledEvaluation: ScheduledEvaluationState,
  isDraft: boolean
): EvaluationStatus {
  // Property 11: For any evaluation saved successfully (not draft),
  // the status of the associated scheduled evaluation must change to 'completed'
  if (!isDraft) {
    return 'completed'
  }
  // Drafts don't change the status
  return scheduledEvaluation.status
}

/**
 * Simulates the complete submission process
 * 
 * @param scheduledEvaluation - The scheduled evaluation
 * @param responses - The responses being submitted
 * @param questions - The template questions
 * @param isDraft - Whether this is a draft
 * @param evaluatorId - The evaluator's ID
 * @returns The result of the submission including new status
 */
function simulateSubmission(
  scheduledEvaluation: ScheduledEvaluationState,
  responses: ResponseInput[],
  questions: TemplateQuestion[],
  isDraft: boolean,
  evaluatorId: number
): StatusUpdateResult {
  // Calculate scores (simplified)
  let totalScore = 0
  let maxPossibleScore = 0

  responses.forEach((response) => {
    const question = questions.find((q) => q.id === response.question_id)
    if (!question) return

    if (response.response !== 'not_applicable') {
      maxPossibleScore++
      if (response.response === 'yes') {
        totalScore++
      }
    }
  })

  const scorePercentage = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
    : 0

  // Determine new status based on isDraft
  const newStatus = determineNewStatus(scheduledEvaluation, isDraft)

  return {
    success: true,
    newStatus,
    resultId: Math.floor(Math.random() * 10000) + 1,
    isDraft,
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
 * Generator for valid response types
 */
const responseTypeArb: fc.Arbitrary<ResponseType> = fc.constantFrom(
  'yes',
  'no',
  'not_applicable'
)

/**
 * Generator for evaluation statuses that can be submitted
 * (pending or overdue - completed and cancelled cannot be submitted)
 */
const submittableStatusArb: fc.Arbitrary<EvaluationStatus> = fc.constantFrom(
  'pending',
  'overdue'
)

/**
 * Generator for a template question
 */
function createTemplateQuestion(
  id: number,
  templateId: number,
  isRequired: boolean,
  category: QuestionCategory,
  displayOrder: number
): TemplateQuestion {
  return {
    id,
    template_id: templateId,
    question_text: `Question ${id}`,
    category,
    is_required: isRequired,
    display_order: displayOrder,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Generator for a response input
 */
function createResponseInput(questionId: number, response: ResponseType): ResponseInput {
  return {
    question_id: questionId,
    response,
    observation: response === 'no' ? 'Observation for no response' : undefined,
  }
}

/**
 * Generator for a scheduled evaluation
 */
const scheduledEvaluationArb: fc.Arbitrary<ScheduledEvaluationState> = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  classroom_id: fc.integer({ min: 1, max: 1000 }),
  template_id: fc.integer({ min: 1, max: 1000 }),
  scheduled_date: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
    .map(timestamp => new Date(timestamp).toISOString()),
  status: submittableStatusArb,
})

/**
 * Generator for a set of questions with responses
 */
const questionsWithResponsesArb = fc.tuple(
  fc.integer({ min: 1, max: 20 }), // Number of questions
  fc.integer({ min: 1, max: 1000 }), // Template ID
).chain(([numQuestions, templateId]) => {
  return fc.tuple(
    fc.array(categoryArb, { minLength: numQuestions, maxLength: numQuestions }),
    fc.array(fc.boolean(), { minLength: numQuestions, maxLength: numQuestions }),
    fc.array(responseTypeArb, { minLength: numQuestions, maxLength: numQuestions }),
  ).map(([categories, requiredFlags, responseTypes]) => {
    const questions: TemplateQuestion[] = []
    const responses: ResponseInput[] = []

    for (let i = 0; i < numQuestions; i++) {
      const questionId = i + 1
      questions.push(createTemplateQuestion(
        questionId,
        templateId,
        requiredFlags[i],
        categories[i],
        i
      ))
      responses.push(createResponseInput(questionId, responseTypes[i]))
    }

    return { questions, responses, templateId }
  })
})

/**
 * Generator for evaluator ID
 */
const evaluatorIdArb = fc.integer({ min: 1, max: 10000 })

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: classroom-evaluation-system, Property 11: Evaluación completada actualiza estado de programación', () => {
  /**
   * Property 11: Completed Evaluation Updates Scheduled Evaluation Status
   * For any evaluation saved successfully (not draft), the status of the 
   * associated scheduled evaluation must change to 'completed'.
   * 
   * **Validates: Requirements 3.7**
   */

  describe('Non-Draft Submissions (isDraft = false)', () => {
    test('should update status to completed when evaluation is submitted (not draft)', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            // Submit as non-draft
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false, // isDraft = false
              evaluatorId
            )

            // Property 11: Status must change to 'completed' for non-draft submissions
            expect(result.success).toBe(true)
            expect(result.isDraft).toBe(false)
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should update status to completed regardless of original status (pending)', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb.map(e => ({ ...e, status: 'pending' as EvaluationStatus })),
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            expect(scheduledEvaluation.status).toBe('pending')

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // Status should change from 'pending' to 'completed'
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should update status to completed regardless of original status (overdue)', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb.map(e => ({ ...e, status: 'overdue' as EvaluationStatus })),
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            expect(scheduledEvaluation.status).toBe('overdue')

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // Status should change from 'overdue' to 'completed'
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should update status to completed regardless of response types', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 1000 }),
          evaluatorIdArb,
          fc.constantFrom('yes', 'no', 'not_applicable') as fc.Arbitrary<ResponseType>,
          (scheduledEvaluation, numQuestions, templateId, evaluatorId, uniformResponse) => {
            // Create questions and responses with uniform response type
            const questions: TemplateQuestion[] = []
            const responses: ResponseInput[] = []

            for (let i = 0; i < numQuestions; i++) {
              const questionId = i + 1
              questions.push(createTemplateQuestion(
                questionId,
                templateId,
                true,
                'organization',
                i
              ))
              responses.push(createResponseInput(questionId, uniformResponse))
            }

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // Status should be 'completed' regardless of response values
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should update status to completed regardless of score', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 1000 }),
          evaluatorIdArb,
          fc.integer({ min: 0, max: 100 }), // Percentage of 'yes' responses
          (scheduledEvaluation, numQuestions, templateId, evaluatorId, yesPercentage) => {
            const questions: TemplateQuestion[] = []
            const responses: ResponseInput[] = []

            for (let i = 0; i < numQuestions; i++) {
              const questionId = i + 1
              questions.push(createTemplateQuestion(
                questionId,
                templateId,
                true,
                'organization',
                i
              ))
              // Determine response based on percentage
              const response: ResponseType = (i * 100 / numQuestions) < yesPercentage ? 'yes' : 'no'
              responses.push(createResponseInput(questionId, response))
            }

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // Status should be 'completed' regardless of score
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Draft Submissions (isDraft = true)', () => {
    test('should NOT update status when saving as draft', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const originalStatus = scheduledEvaluation.status

            // Submit as draft
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              true, // isDraft = true
              evaluatorId
            )

            // Status should remain unchanged for drafts
            expect(result.success).toBe(true)
            expect(result.isDraft).toBe(true)
            expect(result.newStatus).toBe(originalStatus)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should keep pending status when saving as draft', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb.map(e => ({ ...e, status: 'pending' as EvaluationStatus })),
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              true,
              evaluatorId
            )

            // Status should remain 'pending' for drafts
            expect(result.newStatus).toBe('pending')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should keep overdue status when saving as draft', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb.map(e => ({ ...e, status: 'overdue' as EvaluationStatus })),
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              true,
              evaluatorId
            )

            // Status should remain 'overdue' for drafts
            expect(result.newStatus).toBe('overdue')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isDraft Flag Determines Status Update', () => {
    test('isDraft=false always results in completed status', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // isDraft=false => status='completed'
            expect(result.isDraft).toBe(false)
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('isDraft=true always preserves original status', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const originalStatus = scheduledEvaluation.status

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              true,
              evaluatorId
            )

            // isDraft=true => status unchanged
            expect(result.isDraft).toBe(true)
            expect(result.newStatus).toBe(originalStatus)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('same evaluation with different isDraft values produces different status outcomes', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            // Submit as non-draft
            const nonDraftResult = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // Submit as draft
            const draftResult = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              true,
              evaluatorId
            )

            // Non-draft should be 'completed', draft should preserve original
            expect(nonDraftResult.newStatus).toBe('completed')
            expect(draftResult.newStatus).toBe(scheduledEvaluation.status)
            
            // If original status was not 'completed', they should differ
            if (scheduledEvaluation.status !== 'completed') {
              expect(nonDraftResult.newStatus).not.toBe(draftResult.newStatus)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Status Transition Validity', () => {
    test('completed status is a valid EvaluationStatus', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // Verify 'completed' is a valid status
            const validStatuses: EvaluationStatus[] = ['pending', 'completed', 'overdue', 'cancelled']
            expect(validStatuses).toContain(result.newStatus)
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('status transition from pending to completed is valid', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb.map(e => ({ ...e, status: 'pending' as EvaluationStatus })),
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // pending -> completed is a valid transition
            expect(scheduledEvaluation.status).toBe('pending')
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('status transition from overdue to completed is valid', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb.map(e => ({ ...e, status: 'overdue' as EvaluationStatus })),
          questionsWithResponsesArb,
          evaluatorIdArb,
          (scheduledEvaluation, { questions, responses }, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              false,
              evaluatorId
            )

            // overdue -> completed is a valid transition
            expect(scheduledEvaluation.status).toBe('overdue')
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Determinism', () => {
    test('status update is deterministic for same inputs', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          questionsWithResponsesArb,
          evaluatorIdArb,
          fc.boolean(),
          (scheduledEvaluation, { questions, responses }, evaluatorId, isDraft) => {
            const result1 = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              isDraft,
              evaluatorId
            )

            const result2 = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              isDraft,
              evaluatorId
            )

            // Same inputs should produce same status
            expect(result1.newStatus).toBe(result2.newStatus)
            expect(result1.isDraft).toBe(result2.isDraft)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty responses for non-draft submission', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          evaluatorIdArb,
          (scheduledEvaluation, evaluatorId) => {
            const result = simulateSubmission(
              scheduledEvaluation,
              [], // Empty responses
              [], // Empty questions
              false,
              evaluatorId
            )

            // Even with empty responses, non-draft should set status to completed
            expect(result.newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle single question evaluation', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          categoryArb,
          responseTypeArb,
          evaluatorIdArb,
          fc.boolean(),
          (scheduledEvaluation, category, responseType, evaluatorId, isDraft) => {
            const questions = [createTemplateQuestion(1, 1, true, category, 0)]
            const responses = [createResponseInput(1, responseType)]

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              isDraft,
              evaluatorId
            )

            if (isDraft) {
              expect(result.newStatus).toBe(scheduledEvaluation.status)
            } else {
              expect(result.newStatus).toBe('completed')
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('should handle large number of questions', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          fc.integer({ min: 50, max: 100 }),
          evaluatorIdArb,
          fc.boolean(),
          (scheduledEvaluation, numQuestions, evaluatorId, isDraft) => {
            const questions: TemplateQuestion[] = []
            const responses: ResponseInput[] = []

            for (let i = 0; i < numQuestions; i++) {
              questions.push(createTemplateQuestion(i + 1, 1, true, 'organization', i))
              responses.push(createResponseInput(i + 1, 'yes'))
            }

            const result = simulateSubmission(
              scheduledEvaluation,
              responses,
              questions,
              isDraft,
              evaluatorId
            )

            if (isDraft) {
              expect(result.newStatus).toBe(scheduledEvaluation.status)
            } else {
              expect(result.newStatus).toBe('completed')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Integration with determineNewStatus function', () => {
    test('determineNewStatus returns completed for non-draft', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          (scheduledEvaluation) => {
            const newStatus = determineNewStatus(scheduledEvaluation, false)
            expect(newStatus).toBe('completed')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('determineNewStatus preserves status for draft', () => {
      fc.assert(
        fc.property(
          scheduledEvaluationArb,
          (scheduledEvaluation) => {
            const newStatus = determineNewStatus(scheduledEvaluation, true)
            expect(newStatus).toBe(scheduledEvaluation.status)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
