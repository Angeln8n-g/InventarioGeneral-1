/**
 * Marker Validation Utility - Property-Based Tests
 * 
 * Property 2: Length Calculation Accuracy
 * Property 3: Invalid Marker Rejection
 * Property 10: Numeric Input Validation
 * 
 * Validates: Requirements 2.2, 2.3, 3.2, 3.3, 4.1, 4.4
 */

import * as fc from 'fast-check'
import {
  validateMarkers,
  calculateLength,
  parseMarker,
  validateAgainstStock,
  validateReturnLength
} from '../markerValidation'

describe('Property Tests: Marker Validation', () => {
  /**
   * Property 2: Length Calculation Accuracy
   * For any pair of valid markers (start, end) where end > start, 
   * the calculated length should equal (end - start) with precision to 2 decimal places.
   */
  describe('Property 2: Length Calculation Accuracy', () => {
    test('calculated length equals (end - start) with precision', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 1000 }),
          (start, delta) => {
            const end = start + delta
            const calculated = calculateLength(start, end, 2)
            const expected = Math.round(delta * 100) / 100
            expect(calculated).toBeCloseTo(expected, 2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('length is always positive when end > start', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 1000 }),
          (start, delta) => {
            const end = start + delta
            const length = calculateLength(start, end)
            expect(length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('length calculation is commutative with negation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5000 }),
          fc.integer({ min: 1, max: 500 }),
          (start, delta) => {
            const end = start + delta
            const length1 = calculateLength(start, end)
            const length2 = calculateLength(0, delta)
            expect(length1).toBeCloseTo(length2, 2)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('handles decimal values correctly', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 99 }),
          fc.nat({ max: 1000 }),
          fc.nat({ max: 99 }),
          (startInt, startDec, deltaInt, deltaDec) => {
            const start = startInt + startDec / 100
            const delta = deltaInt + deltaDec / 100 + 0.01 // ensure delta > 0
            const end = start + delta
            const calculated = calculateLength(start, end, 2)
            expect(calculated).toBeCloseTo(delta, 2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 3: Invalid Marker Rejection
   * For any marker pair where end ≤ start, the system should reject the input.
   */
  describe('Property 3: Invalid Marker Rejection', () => {
    test('rejects when end equals start', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (value) => {
            const result = validateMarkers(value.toString(), value.toString())
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('El número final debe ser mayor que el número inicial')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('rejects when end is less than start', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 10000 }),
          fc.integer({ min: 1, max: 99 }),
          (start, delta) => {
            const end = start - delta
            const result = validateMarkers(start.toString(), end.toString())
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('El número final debe ser mayor que el número inicial')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 10: Numeric Input Validation
   * The system should accept only positive numeric values and reject non-numeric characters.
   */
  describe('Property 10: Numeric Input Validation', () => {
    test('accepts positive numeric values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 5000 }),
          fc.integer({ min: 1, max: 500 }),
          (start, delta) => {
            const end = start + delta
            const result = validateMarkers(start.toString(), end.toString())
            expect(result.isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('rejects negative values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: 1, max: 1000 }),
          (negativeStart, positiveEnd) => {
            const result = validateMarkers(negativeStart.toString(), positiveEnd.toString())
            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Los valores deben ser positivos')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('parseMarker returns null for non-numeric strings', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => isNaN(parseFloat(s))),
          (nonNumeric) => {
            expect(parseMarker(nonNumeric)).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    test('parseMarker returns number for valid numeric strings', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000 }),
          (num) => {
            const parsed = parseMarker(num.toString())
            expect(parsed).not.toBeNull()
            expect(parsed).toBe(num)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 4: Stock Boundary Validation
   * For any consumption attempt, if the calculated length exceeds available stock,
   * the system should reject the transaction.
   */
  describe('Property 4: Stock Boundary Validation', () => {
    test('rejects length exceeding stock', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (stock, excess) => {
            const length = stock + excess
            const result = validateAgainstStock(length, stock)
            expect(result.isValid).toBe(false)
            expect(result.errors[0]).toContain('Stock insuficiente')
          }
        ),
        { numRuns: 100 }
      )
    })

    test('accepts length within stock', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 1000 }),
          fc.integer({ min: 1, max: 50 }),
          (stock, percentage) => {
            const length = Math.floor(stock * percentage / 100)
            if (length > 0) {
              const result = validateAgainstStock(length, stock)
              expect(result.isValid).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 7: Return Length Constraint
   * For any return attempt, if the calculated return length exceeds the originally 
   * consumed length (minus already returned length), the system should reject.
   */
  describe('Property 7: Return Length Constraint', () => {
    test('rejects return exceeding available', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 0, max: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (consumed, returnedPercentage, excess) => {
            const alreadyReturned = Math.floor(consumed * returnedPercentage / 100)
            const available = consumed - alreadyReturned
            const returnLength = available + excess
            
            const result = validateReturnLength(returnLength, consumed, alreadyReturned)
            expect(result.isValid).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('accepts return within available', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 0, max: 30 }),
          fc.integer({ min: 1, max: 50 }),
          (consumed, returnedPercentage, returnPercentage) => {
            const alreadyReturned = Math.floor(consumed * returnedPercentage / 100)
            const available = consumed - alreadyReturned
            const returnLength = Math.floor(available * returnPercentage / 100)
            
            if (returnLength > 0 && returnLength <= available) {
              const result = validateReturnLength(returnLength, consumed, alreadyReturned)
              expect(result.isValid).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
