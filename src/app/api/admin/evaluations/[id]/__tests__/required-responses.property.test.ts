/**
 * Required Responses Validation - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 7: Respuestas obligatorias deben estar presentes para enviar
 * 
 * Property Description:
 * Para cualquier intento de enviar una evaluación (no borrador), el sistema debe rechazar 
 * el envío si alguna pregunta marcada como obligatoria no tiene respuesta.
 * 
 * **Validates: Requirements 3.4**
 */

import * as fc from 'fast-check'
import type {
  ResponseType,
  TemplateQuestion,
  QuestionCategory,
} from '@/types/evaluations'

// Types for Testing
interface ResponseInput {
  question_id: number
  response: ResponseType
  observation?: string
}

interface RequiredResponsesValidationResult {
  isValid: boolean
  errors: string[]
  missingQuestionIds: number[]
}

// Validation Function
function validateRequiredResponses(
  questions: TemplateQuestion[],
  responses: ResponseInput[],
  isDraft: boolean
): RequiredResponsesValidationResult {
  if (isDraft) {
    return { isValid: true, errors: [], missingQuestionIds: [] }
  }

  const requiredQuestionIds = questions.filter((q) => q.is_required).map((q) => q.id)
  const answeredQuestionIds = responses.map((r) => r.question_id)
  const missingRequired = requiredQuestionIds.filter((id) => !answeredQuestionIds.includes(id))

  if (missingRequired.length > 0) {
    return {
      isValid: false,
      errors: ['Faltan respuestas obligatorias. Complete todas las preguntas requeridas.'],
      missingQuestionIds: missingRequired,
    }
  }

  return { isValid: true, errors: [], missingQuestionIds: [] }
}

// Arbitraries
const categoryArb: fc.Arbitrary<QuestionCategory> = fc.constantFrom('organization', 'cleanliness', 'maintenance')
const responseTypeArb: fc.Arbitrary<ResponseType> = fc.constantFrom('yes', 'no', 'not_applicable')

function createTemplateQuestion(id: number, templateId: number, isRequired: boolean, category: QuestionCategory, displayOrder: number): TemplateQuestion {
  return { id, template_id: templateId, question_text: `Question ${id}`, category, is_required: isRequired, display_order: displayOrder, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
}

function createResponseInput(questionId: number, response: ResponseType): ResponseInput {
  return { question_id: questionId, response, observation: response === 'no' ? 'Observation' : undefined }
}

const questionsSetArb = fc.tuple(
  fc.integer({ min: 1, max: 10 }),
  fc.integer({ min: 0, max: 10 }),
  fc.integer({ min: 1, max: 1000 }),
).chain(([numRequired, numOptional, templateId]) => {
  const totalQuestions = numRequired + numOptional
  if (totalQuestions === 0) return fc.constant({ questions: [] as TemplateQuestion[], templateId })
  return fc.array(categoryArb, { minLength: totalQuestions, maxLength: totalQuestions }).map((categories) => {
    const questions: TemplateQuestion[] = []
    let questionId = 1
    for (let i = 0; i < numRequired; i++) questions.push(createTemplateQuestion(questionId++, templateId, true, categories[i], i))
    for (let i = 0; i < numOptional; i++) questions.push(createTemplateQuestion(questionId++, templateId, false, categories[numRequired + i], numRequired + i))
    return { questions, templateId }
  })
})

// Property Tests
describe('Feature: classroom-evaluation-system, Property 7: Respuestas obligatorias deben estar presentes para enviar', () => {
  describe('Submission Validation (isDraft = false)', () => {
    it('should reject submission when required questions are missing responses', () => {
      fc.assert(fc.property(questionsSetArb.filter(({ questions }) => questions.some(q => q.is_required)), ({ questions }) => {
        const requiredQuestions = questions.filter(q => q.is_required)
        const partialResponses = requiredQuestions.slice(0, Math.max(0, requiredQuestions.length - 1)).map(q => createResponseInput(q.id, 'yes'))
        const result = validateRequiredResponses(questions, partialResponses, false)
        expect(result.isValid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.missingQuestionIds.length).toBeGreaterThan(0)
      }), { numRuns: 100 })
    })

    it('should accept submission when all required questions have responses', () => {
      fc.assert(fc.property(questionsSetArb, fc.array(responseTypeArb, { minLength: 1, maxLength: 20 }), ({ questions }, responseTypes) => {
        const requiredQuestions = questions.filter(q => q.is_required)
        const responses = requiredQuestions.map((q, i) => createResponseInput(q.id, responseTypes[i % responseTypes.length]))
        const result = validateRequiredResponses(questions, responses, false)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.missingQuestionIds).toHaveLength(0)
      }), { numRuns: 100 })
    })
  })

  describe('Draft Validation (isDraft = true)', () => {
    it('should accept draft even when required questions are missing responses', () => {
      fc.assert(fc.property(questionsSetArb.filter(({ questions }) => questions.some(q => q.is_required)), ({ questions }) => {
        const result = validateRequiredResponses(questions, [], true)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.missingQuestionIds).toHaveLength(0)
      }), { numRuns: 100 })
    })
  })

  describe('Response Type Independence', () => {
    it('should accept any valid response type for required questions', () => {
      fc.assert(fc.property(questionsSetArb.filter(({ questions }) => questions.some(q => q.is_required)), fc.array(responseTypeArb, { minLength: 1, maxLength: 50 }), ({ questions }, responseTypes) => {
        const requiredQuestions = questions.filter(q => q.is_required)
        const responses = requiredQuestions.map((q, i) => createResponseInput(q.id, responseTypes[i % responseTypes.length]))
        const result = validateRequiredResponses(questions, responses, false)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      }), { numRuns: 100 })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty questions array', () => {
      const result = validateRequiredResponses([], [], false)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.missingQuestionIds).toHaveLength(0)
    })

    it('should handle empty responses array with required questions', () => {
      fc.assert(fc.property(questionsSetArb.filter(({ questions }) => questions.some(q => q.is_required)), ({ questions }) => {
        const result = validateRequiredResponses(questions, [], false)
        const requiredIds = questions.filter(q => q.is_required).map(q => q.id)
        expect(result.isValid).toBe(false)
        expect(result.missingQuestionIds.sort()).toEqual(requiredIds.sort())
      }), { numRuns: 100 })
    })
  })

  describe('Error Message Consistency', () => {
    it('should provide consistent error message in Spanish', () => {
      fc.assert(fc.property(questionsSetArb.filter(({ questions }) => questions.some(q => q.is_required)), ({ questions }) => {
        const result = validateRequiredResponses(questions, [], false)
        expect(result.isValid).toBe(false)
        expect(result.errors).toContain('Faltan respuestas obligatorias. Complete todas las preguntas requeridas.')
      }), { numRuns: 100 })
    })
  })
})
