/**
 * Segment Overlap Detection Utility - Property-Based Tests
 * 
 * Property 13: Segment Overlap Detection
 * Property 14: Overlap Prevention
 * Property 15: Non-overlapping Segment Acceptance
 * 
 * Validates: Requirements 7.1, 7.3, 7.4
 */

import * as fc from 'fast-check'
import {
  segmentsOverlap,
  validateSegmentReturn,
  findOverlappingSegments,
  isSegmentWithin,
  mergeSegments,
  calculateTotalReturnedLength
} from '../segmentOverlap'

describe('Property Tests: Segment Overlap', () => {
  /**
   * Property 13: Segment Overlap Detection
   * For any two cable segments A and B, they overlap if and only if 
   * (A.start < B.end) AND (A.end > B.start).
   */
  describe('Property 13: Segment Overlap Detection', () => {
    test('overlap formula is correctly implemented', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (start1, length1, start2, length2) => {
            const seg1 = { start: start1, end: start1 + length1 }
            const seg2 = { start: start2, end: start2 + length2 }
            
            const overlaps = segmentsOverlap(seg1, seg2)
            const expectedOverlap = (seg1.start < seg2.end) && (seg1.end > seg2.start)
            
            expect(overlaps).toBe(expectedOverlap)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('overlap detection is symmetric', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (start1, length1, start2, length2) => {
            const seg1 = { start: start1, end: start1 + length1 }
            const seg2 = { start: start2, end: start2 + length2 }
            
            expect(segmentsOverlap(seg1, seg2)).toBe(segmentsOverlap(seg2, seg1))
          }
        ),
        { numRuns: 100 }
      )
    })

    test('a segment always overlaps with itself', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (start, length) => {
            const seg = { start, end: start + length }
            expect(segmentsOverlap(seg, seg)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('adjacent segments do not overlap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (start, length1, length2) => {
            const seg1 = { start, end: start + length1 }
            const seg2 = { start: start + length1, end: start + length1 + length2 }
            
            expect(segmentsOverlap(seg1, seg2)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('segments with gap do not overlap', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 1, max: 100 }),
          (start, length1, gap, length2) => {
            const seg1 = { start, end: start + length1 }
            const seg2 = { start: start + length1 + gap, end: start + length1 + gap + length2 }
            
            expect(segmentsOverlap(seg1, seg2)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 14: Overlap Prevention
   * For any return attempt with segment [start, end], if there exists a previously 
   * returned segment that overlaps, the system should reject the return.
   */
  describe('Property 14: Overlap Prevention', () => {
    test('overlapping returns are rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 10, max: 100 }),
          fc.integer({ min: 1, max: 9 }),
          (existingStart, existingLength, overlapAmount) => {
            const existingEnd = existingStart + existingLength
            const existingReturns = [{ segment_start: existingStart, segment_end: existingEnd }]
            
            // Create a new segment that overlaps
            const newStart = existingEnd - overlapAmount
            const newEnd = existingEnd + 10
            
            const result = validateSegmentReturn(newStart, newEnd, existingReturns)
            expect(result.isValid).toBe(false)
            expect(result.overlappingSegments.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('contained segments are rejected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 500 }),
          fc.integer({ min: 50, max: 200 }),
          fc.integer({ min: 5, max: 20 }),
          fc.integer({ min: 10, max: 30 }),
          (existingStart, existingLength, innerOffset, innerLength) => {
            const existingEnd = existingStart + existingLength
            const existingReturns = [{ segment_start: existingStart, segment_end: existingEnd }]
            
            // Create a segment contained within existing
            const newStart = existingStart + innerOffset
            const newEnd = newStart + innerLength
            
            if (newEnd < existingEnd) {
              const result = validateSegmentReturn(newStart, newEnd, existingReturns)
              expect(result.isValid).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Property 15: Non-overlapping Segment Acceptance
   * For any return attempt with segment [start, end], if no previously returned 
   * segments overlap, the system should accept the return.
   */
  describe('Property 15: Non-overlapping Segment Acceptance', () => {
    test('non-overlapping returns are accepted', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 200 }),
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 10, max: 50 }),
          (existingStart, existingLength, gap, newLength) => {
            const existingEnd = existingStart + existingLength
            const existingReturns = [{ segment_start: existingStart, segment_end: existingEnd }]
            
            // Create a segment after existing with a gap
            const newStart = existingEnd + gap
            const newEnd = newStart + newLength
            
            const result = validateSegmentReturn(newStart, newEnd, existingReturns)
            expect(result.isValid).toBe(true)
            expect(result.overlappingSegments).toHaveLength(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    test('segments before existing are accepted', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 500 }),
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 10, max: 50 }),
          (existingStart, existingLength, gap, newLength) => {
            const existingEnd = existingStart + existingLength
            const existingReturns = [{ segment_start: existingStart, segment_end: existingEnd }]
            
            // Create a segment before existing with a gap
            const newEnd = existingStart - gap
            const newStart = newEnd - newLength
            
            if (newStart >= 0) {
              const result = validateSegmentReturn(newStart, newEnd, existingReturns)
              expect(result.isValid).toBe(true)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('empty existing returns always accepts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 1, max: 100 }),
          (start, length) => {
            const result = validateSegmentReturn(start, start + length, [])
            expect(result.isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional Properties
   */
  describe('Additional Segment Properties', () => {
    test('isSegmentWithin is transitive', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 30, max: 50 }),
          fc.integer({ min: 5, max: 10 }),
          fc.integer({ min: 2, max: 5 }),
          (outerStart, outerLength, middleOffset, innerOffset) => {
            const outer = { start: outerStart, end: outerStart + outerLength }
            const middleStart = outerStart + middleOffset
            const middleEnd = outerStart + outerLength - middleOffset
            
            if (middleStart < middleEnd) {
              const middle = { start: middleStart, end: middleEnd }
              const innerStart = middleStart + innerOffset
              const innerEnd = middleEnd - innerOffset
              
              if (innerStart < innerEnd) {
                const inner = { start: innerStart, end: innerEnd }
                
                if (isSegmentWithin(inner, middle) && isSegmentWithin(middle, outer)) {
                  expect(isSegmentWithin(inner, outer)).toBe(true)
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('merged segments do not overlap', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              start: fc.integer({ min: 0, max: 500 }),
              length: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (segmentData) => {
            const segments = segmentData.map(s => ({ start: s.start, end: s.start + s.length }))
            const merged = mergeSegments(segments)
            
            // Merged segments should not overlap
            for (let i = 0; i < merged.length - 1; i++) {
              expect(merged[i].end).toBeLessThanOrEqual(merged[i + 1].start)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    test('total returned length is sum of individual segment lengths', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              segment_start: fc.integer({ min: 0, max: 500 }),
              length: fc.integer({ min: 1, max: 50 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (segmentData) => {
            const returns = segmentData.map(s => ({
              segment_start: s.segment_start,
              segment_end: s.segment_start + s.length
            }))
            
            const total = calculateTotalReturnedLength(returns)
            const expectedTotal = segmentData.reduce((sum, s) => sum + s.length, 0)
            
            expect(total).toBe(expectedTotal)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
