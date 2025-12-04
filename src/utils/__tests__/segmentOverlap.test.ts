/**
 * Segment Overlap Detection Utility - Unit Tests
 * 
 * Tests for segment overlap detection and validation
 * Requirements: 7.1, 7.3, 7.4
 */

import {
  segmentsOverlap,
  findOverlappingSegments,
  validateSegmentReturn,
  calculateTotalReturnedLength,
  isSegmentWithin,
  areSegmentsAdjacent,
  mergeSegments,
  calculateGap,
  findGaps,
  calculateCoverage
} from '../segmentOverlap'

describe('segmentsOverlap', () => {
  describe('overlapping segments', () => {
    test('should detect partial overlap (seg1 starts before seg2)', () => {
      expect(segmentsOverlap(
        { start: 100, end: 150 },
        { start: 120, end: 180 }
      )).toBe(true)
    })

    test('should detect partial overlap (seg2 starts before seg1)', () => {
      expect(segmentsOverlap(
        { start: 120, end: 180 },
        { start: 100, end: 150 }
      )).toBe(true)
    })

    test('should detect complete containment (seg1 contains seg2)', () => {
      expect(segmentsOverlap(
        { start: 100, end: 200 },
        { start: 120, end: 150 }
      )).toBe(true)
    })

    test('should detect complete containment (seg2 contains seg1)', () => {
      expect(segmentsOverlap(
        { start: 120, end: 150 },
        { start: 100, end: 200 }
      )).toBe(true)
    })

    test('should detect identical segments', () => {
      expect(segmentsOverlap(
        { start: 100, end: 150 },
        { start: 100, end: 150 }
      )).toBe(true)
    })
  })

  describe('non-overlapping segments', () => {
    test('should not detect overlap for adjacent segments', () => {
      expect(segmentsOverlap(
        { start: 100, end: 150 },
        { start: 150, end: 200 }
      )).toBe(false)
    })

    test('should not detect overlap for separate segments', () => {
      expect(segmentsOverlap(
        { start: 100, end: 150 },
        { start: 160, end: 200 }
      )).toBe(false)
    })

    test('should not detect overlap for reversed separate segments', () => {
      expect(segmentsOverlap(
        { start: 160, end: 200 },
        { start: 100, end: 150 }
      )).toBe(false)
    })
  })
})

describe('findOverlappingSegments', () => {
  const existingSegments = [
    { start: 100, end: 150 },
    { start: 200, end: 250 },
    { start: 300, end: 350 }
  ]

  test('should find single overlapping segment', () => {
    const result = findOverlappingSegments(
      { start: 120, end: 180 },
      existingSegments
    )
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ start: 100, end: 150 })
  })

  test('should find multiple overlapping segments', () => {
    const result = findOverlappingSegments(
      { start: 140, end: 220 },
      existingSegments
    )
    expect(result).toHaveLength(2)
  })

  test('should return empty array for no overlaps', () => {
    const result = findOverlappingSegments(
      { start: 160, end: 190 },
      existingSegments
    )
    expect(result).toHaveLength(0)
  })
})

describe('validateSegmentReturn', () => {
  const existingReturns = [
    { segment_start: 100, segment_end: 150, return_date: '2024-01-01' },
    { segment_start: 200, segment_end: 250, return_date: '2024-01-02' }
  ]

  test('should validate non-overlapping segment', () => {
    const result = validateSegmentReturn(160, 190, existingReturns)
    expect(result.isValid).toBe(true)
    expect(result.overlappingSegments).toHaveLength(0)
  })

  test('should reject overlapping segment', () => {
    const result = validateSegmentReturn(120, 180, existingReturns)
    expect(result.isValid).toBe(false)
    expect(result.overlappingSegments).toHaveLength(1)
    expect(result.message).toContain('ya fue registrado como devuelto')
  })

  test('should handle empty existing returns', () => {
    const result = validateSegmentReturn(100, 150, [])
    expect(result.isValid).toBe(true)
  })
})

describe('calculateTotalReturnedLength', () => {
  test('should calculate total from multiple segments', () => {
    const returns = [
      { segment_start: 100, segment_end: 150 },
      { segment_start: 200, segment_end: 250 }
    ]
    expect(calculateTotalReturnedLength(returns)).toBe(100)
  })

  test('should return 0 for empty array', () => {
    expect(calculateTotalReturnedLength([])).toBe(0)
  })

  test('should handle single segment', () => {
    const returns = [{ segment_start: 100, segment_end: 175 }]
    expect(calculateTotalReturnedLength(returns)).toBe(75)
  })
})

describe('isSegmentWithin', () => {
  test('should return true when inner is completely within outer', () => {
    expect(isSegmentWithin(
      { start: 120, end: 140 },
      { start: 100, end: 150 }
    )).toBe(true)
  })

  test('should return true when inner equals outer', () => {
    expect(isSegmentWithin(
      { start: 100, end: 150 },
      { start: 100, end: 150 }
    )).toBe(true)
  })

  test('should return false when inner extends beyond outer', () => {
    expect(isSegmentWithin(
      { start: 100, end: 160 },
      { start: 100, end: 150 }
    )).toBe(false)
  })

  test('should return false when inner starts before outer', () => {
    expect(isSegmentWithin(
      { start: 90, end: 140 },
      { start: 100, end: 150 }
    )).toBe(false)
  })
})

describe('areSegmentsAdjacent', () => {
  test('should return true for adjacent segments (seg1 before seg2)', () => {
    expect(areSegmentsAdjacent(
      { start: 100, end: 150 },
      { start: 150, end: 200 }
    )).toBe(true)
  })

  test('should return true for adjacent segments (seg2 before seg1)', () => {
    expect(areSegmentsAdjacent(
      { start: 150, end: 200 },
      { start: 100, end: 150 }
    )).toBe(true)
  })

  test('should return false for non-adjacent segments', () => {
    expect(areSegmentsAdjacent(
      { start: 100, end: 150 },
      { start: 160, end: 200 }
    )).toBe(false)
  })

  test('should return false for overlapping segments', () => {
    expect(areSegmentsAdjacent(
      { start: 100, end: 160 },
      { start: 150, end: 200 }
    )).toBe(false)
  })
})

describe('mergeSegments', () => {
  test('should merge adjacent segments', () => {
    const segments = [
      { start: 100, end: 150 },
      { start: 150, end: 200 }
    ]
    const result = mergeSegments(segments)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ start: 100, end: 200 })
  })

  test('should merge overlapping segments', () => {
    const segments = [
      { start: 100, end: 160 },
      { start: 150, end: 200 }
    ]
    const result = mergeSegments(segments)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ start: 100, end: 200 })
  })

  test('should not merge separate segments', () => {
    const segments = [
      { start: 100, end: 150 },
      { start: 200, end: 250 }
    ]
    const result = mergeSegments(segments)
    expect(result).toHaveLength(2)
  })

  test('should handle empty array', () => {
    expect(mergeSegments([])).toHaveLength(0)
  })

  test('should handle unsorted segments', () => {
    const segments = [
      { start: 200, end: 250 },
      { start: 100, end: 150 },
      { start: 150, end: 200 }
    ]
    const result = mergeSegments(segments)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ start: 100, end: 250 })
  })
})

describe('calculateGap', () => {
  test('should calculate gap between separate segments', () => {
    expect(calculateGap(
      { start: 100, end: 150 },
      { start: 160, end: 200 }
    )).toBe(10)
  })

  test('should return 0 for adjacent segments', () => {
    expect(calculateGap(
      { start: 100, end: 150 },
      { start: 150, end: 200 }
    )).toBe(0)
  })

  test('should return 0 for overlapping segments', () => {
    expect(calculateGap(
      { start: 100, end: 160 },
      { start: 150, end: 200 }
    )).toBe(0)
  })

  test('should work regardless of segment order', () => {
    expect(calculateGap(
      { start: 160, end: 200 },
      { start: 100, end: 150 }
    )).toBe(10)
  })
})

describe('findGaps', () => {
  test('should find gap in middle', () => {
    const returned = [
      { start: 100, end: 120 },
      { start: 150, end: 200 }
    ]
    const gaps = findGaps(100, 200, returned)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toEqual({ start: 120, end: 150 })
  })

  test('should find gap at start', () => {
    const returned = [{ start: 150, end: 200 }]
    const gaps = findGaps(100, 200, returned)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toEqual({ start: 100, end: 150 })
  })

  test('should find gap at end', () => {
    const returned = [{ start: 100, end: 150 }]
    const gaps = findGaps(100, 200, returned)
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toEqual({ start: 150, end: 200 })
  })

  test('should return full range when no returns', () => {
    const gaps = findGaps(100, 200, [])
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toEqual({ start: 100, end: 200 })
  })

  test('should return empty when fully covered', () => {
    const returned = [{ start: 100, end: 200 }]
    const gaps = findGaps(100, 200, returned)
    expect(gaps).toHaveLength(0)
  })
})

describe('calculateCoverage', () => {
  test('should calculate partial coverage', () => {
    const returned = [
      { start: 100, end: 130 },
      { start: 170, end: 200 }
    ]
    expect(calculateCoverage(100, 200, returned)).toBe(60)
  })

  test('should return 0 for no returns', () => {
    expect(calculateCoverage(100, 200, [])).toBe(0)
  })

  test('should return full length for complete coverage', () => {
    const returned = [{ start: 100, end: 200 }]
    expect(calculateCoverage(100, 200, returned)).toBe(100)
  })
})
