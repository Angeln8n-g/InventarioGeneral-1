/**
 * Evaluation System - Property-Based Tests
 * Sistema de Evaluación de Aulas
 * 
 * Feature: classroom-evaluation-system, Property 8: Opciones de respuesta son exactamente tres
 * Validates: Requirements 2.4, 3.2
 * 
 * Property Description:
 * Para cualquier pregunta en el sistema, las únicas respuestas válidas son: 'yes', 'no', 'not_applicable'.
 */

import * as fc from 'fast-check'
import { isValidResponseType, VALID_RESPONSE_TYPES, ResponseType } from '../evaluations'

describe('Feature: classroom-evaluation-system, Property 8: Opciones de respuesta son exactamente tres', () => {
  /**
   * Property 8: Response Type Validation
   * For any question in the system, the only valid responses are: 'yes', 'no', 'not_applicable'.
   * 
   * **Validates: Requirements 2.4, 3.2**
   */
  describe('Response Type Validation', () => {
    // Define the exact valid response types
    const validResponses: ResponseType[] = ['yes', 'no', 'not_applicable']

    test('should accept all three valid response types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validResponses),
          (response) => {
            expect(isValidResponseType(response)).toBe(true)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject any string that is not a valid response type', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !validResponses.includes(s as ResponseType)),
          (response) => {
            expect(isValidResponseType(response)).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject empty strings', () => {
      expect(isValidResponseType('')).toBe(false)
    })

    test('should reject similar but incorrect values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Yes', 'YES', 'NO', 'No', 'NOT_APPLICABLE', 'Not_Applicable',
            'si', 'no_aplica', 'n/a', 'na', 'true', 'false',
            '1', '0', 'y', 'n', 'yes ', ' no', 'not applicable'
          ),
          (response) => {
            expect(isValidResponseType(response)).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should have exactly three valid response types', () => {
      expect(VALID_RESPONSE_TYPES).toHaveLength(3)
      expect(VALID_RESPONSE_TYPES).toContain('yes')
      expect(VALID_RESPONSE_TYPES).toContain('no')
      expect(VALID_RESPONSE_TYPES).toContain('not_applicable')
    })

    test('validation function correctly identifies valid vs invalid for any string', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (response) => {
            const isValid = validResponses.includes(response as ResponseType)
            const result = isValidResponseType(response)
            expect(result).toBe(isValid)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject numeric values', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          (num) => {
            expect(isValidResponseType(String(num))).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })

    test('should reject whitespace-only strings', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (spaces) => {
            const whitespace = ' '.repeat(spaces)
            expect(isValidResponseType(whitespace)).toBe(false)
          }
        ),
        { numRuns: 25 }
      )
    })
  })
})
