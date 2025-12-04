/**
 * Segment Overlap Detection Utility
 * 
 * Provides functions to detect overlapping cable segments and validate
 * cable return operations to prevent duplicate returns.
 */

export interface CableSegment {
  start: number
  end: number
  id?: number | string
  return_date?: string
  returned_quantity?: number
}

export interface SegmentOverlapResult {
  isValid: boolean
  overlappingSegments: CableSegment[]
  message?: string
}

/**
 * Detects if two cable segments overlap
 * 
 * Uses the mathematical overlap formula:
 * Two segments overlap if: seg1.start < seg2.end AND seg1.end > seg2.start
 * 
 * @param segment1 - First cable segment
 * @param segment2 - Second cable segment
 * @returns true if segments overlap, false otherwise
 * 
 * @example
 * segmentsOverlap({ start: 100, end: 150 }, { start: 120, end: 180 }) // true (overlap: 120-150)
 * segmentsOverlap({ start: 100, end: 150 }, { start: 150, end: 200 }) // false (adjacent, no overlap)
 * segmentsOverlap({ start: 100, end: 150 }, { start: 160, end: 200 }) // false (no overlap)
 */
export function segmentsOverlap(segment1: CableSegment, segment2: CableSegment): boolean {
  return segment1.start < segment2.end && segment1.end > segment2.start
}

/**
 * Finds all segments in a list that overlap with a given segment
 * 
 * @param newSegment - The segment to check for overlaps
 * @param existingSegments - List of existing segments
 * @returns Array of overlapping segments
 * 
 * @example
 * const existing = [
 *   { start: 100, end: 150 },
 *   { start: 200, end: 250 }
 * ]
 * findOverlappingSegments({ start: 120, end: 180 }, existing)
 * // Returns: [{ start: 100, end: 150 }]
 */
export function findOverlappingSegments(
  newSegment: CableSegment,
  existingSegments: CableSegment[]
): CableSegment[] {
  return existingSegments.filter(existing => segmentsOverlap(newSegment, existing))
}

/**
 * Validates that a segment doesn't overlap with existing returns
 * 
 * @param segmentStart - Start marker of new segment
 * @param segmentEnd - End marker of new segment
 * @param existingReturns - Array of existing return segments
 * @returns Validation result with overlapping segments if any
 * 
 * @example
 * const returns = [{ segment_start: 100, segment_end: 150 }]
 * validateSegmentReturn(120, 180, returns)
 * // Returns: { isValid: false, overlappingSegments: [...], message: '...' }
 */
export function validateSegmentReturn(
  segmentStart: number,
  segmentEnd: number,
  existingReturns: Array<{ segment_start: number; segment_end: number; return_date?: string }>
): SegmentOverlapResult {
  const newSegment: CableSegment = { start: segmentStart, end: segmentEnd }
  
  const overlapping = existingReturns
    .filter(ret => {
      const existingSegment: CableSegment = {
        start: ret.segment_start,
        end: ret.segment_end,
        return_date: ret.return_date
      }
      return segmentsOverlap(newSegment, existingSegment)
    })
    .map(ret => ({
      start: ret.segment_start,
      end: ret.segment_end,
      return_date: ret.return_date
    }))
  
  if (overlapping.length > 0) {
    const overlapDetails = overlapping
      .map(seg => `[${seg.start} - ${seg.end}]`)
      .join(', ')
    
    return {
      isValid: false,
      overlappingSegments: overlapping,
      message: `Este tramo ya fue registrado como devuelto. Segmentos existentes: ${overlapDetails}`
    }
  }
  
  return {
    isValid: true,
    overlappingSegments: [],
    message: 'El segmento no se solapa con devoluciones existentes'
  }
}

/**
 * Calculates total returned length from multiple segments
 * 
 * @param returns - Array of return segments
 * @returns Total length returned
 * 
 * @example
 * const returns = [
 *   { segment_start: 100, segment_end: 150 },
 *   { segment_start: 200, segment_end: 250 }
 * ]
 * calculateTotalReturnedLength(returns) // 100 (50 + 50)
 */
export function calculateTotalReturnedLength(
  returns: Array<{ segment_start: number; segment_end: number }>
): number {
  return returns.reduce((total, ret) => {
    return total + (ret.segment_end - ret.segment_start)
  }, 0)
}

/**
 * Checks if a segment is completely within another segment
 * 
 * @param inner - The potentially contained segment
 * @param outer - The potentially containing segment
 * @returns true if inner is completely within outer
 * 
 * @example
 * isSegmentWithin({ start: 120, end: 140 }, { start: 100, end: 150 }) // true
 * isSegmentWithin({ start: 100, end: 160 }, { start: 100, end: 150 }) // false
 */
export function isSegmentWithin(inner: CableSegment, outer: CableSegment): boolean {
  return inner.start >= outer.start && inner.end <= outer.end
}

/**
 * Checks if two segments are adjacent (touching but not overlapping)
 * 
 * @param segment1 - First segment
 * @param segment2 - Second segment
 * @returns true if segments are adjacent
 * 
 * @example
 * areSegmentsAdjacent({ start: 100, end: 150 }, { start: 150, end: 200 }) // true
 * areSegmentsAdjacent({ start: 100, end: 150 }, { start: 151, end: 200 }) // false
 */
export function areSegmentsAdjacent(segment1: CableSegment, segment2: CableSegment): boolean {
  return segment1.end === segment2.start || segment2.end === segment1.start
}

/**
 * Merges adjacent or overlapping segments into consolidated segments
 * 
 * @param segments - Array of segments to merge
 * @returns Array of merged segments
 * 
 * @example
 * const segments = [
 *   { start: 100, end: 150 },
 *   { start: 150, end: 200 },
 *   { start: 300, end: 350 }
 * ]
 * mergeSegments(segments)
 * // Returns: [{ start: 100, end: 200 }, { start: 300, end: 350 }]
 */
export function mergeSegments(segments: CableSegment[]): CableSegment[] {
  if (segments.length === 0) return []
  
  // Sort segments by start position
  const sorted = [...segments].sort((a, b) => a.start - b.start)
  
  const merged: CableSegment[] = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]
    
    // If current overlaps or is adjacent to last, merge them
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end)
    } else {
      merged.push(current)
    }
  }
  
  return merged
}

/**
 * Calculates the gap between two segments
 * 
 * @param segment1 - First segment
 * @param segment2 - Second segment
 * @returns Gap length (0 if overlapping or adjacent)
 * 
 * @example
 * calculateGap({ start: 100, end: 150 }, { start: 160, end: 200 }) // 10
 * calculateGap({ start: 100, end: 150 }, { start: 150, end: 200 }) // 0 (adjacent)
 * calculateGap({ start: 100, end: 150 }, { start: 120, end: 180 }) // 0 (overlapping)
 */
export function calculateGap(segment1: CableSegment, segment2: CableSegment): number {
  // Sort segments by start position
  const [first, second] = segment1.start < segment2.start 
    ? [segment1, segment2] 
    : [segment2, segment1]
  
  // If overlapping or adjacent, no gap
  if (first.end >= second.start) return 0
  
  return second.start - first.end
}

/**
 * Finds gaps in coverage given a range and returned segments
 * 
 * @param totalStart - Start of the total range
 * @param totalEnd - End of the total range
 * @param returnedSegments - Segments that have been returned
 * @returns Array of gap segments
 * 
 * @example
 * findGaps(100, 200, [
 *   { start: 100, end: 120 },
 *   { start: 150, end: 200 }
 * ])
 * // Returns: [{ start: 120, end: 150 }]
 */
export function findGaps(
  totalStart: number,
  totalEnd: number,
  returnedSegments: CableSegment[]
): CableSegment[] {
  if (returnedSegments.length === 0) {
    return [{ start: totalStart, end: totalEnd }]
  }
  
  // Merge overlapping segments first
  const merged = mergeSegments(returnedSegments)
  
  // Sort by start position
  const sorted = merged.sort((a, b) => a.start - b.start)
  
  const gaps: CableSegment[] = []
  
  // Check gap before first segment
  if (sorted[0].start > totalStart) {
    gaps.push({ start: totalStart, end: sorted[0].start })
  }
  
  // Check gaps between segments
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    
    if (current.end < next.start) {
      gaps.push({ start: current.end, end: next.start })
    }
  }
  
  // Check gap after last segment
  const last = sorted[sorted.length - 1]
  if (last.end < totalEnd) {
    gaps.push({ start: last.end, end: totalEnd })
  }
  
  return gaps
}

/**
 * Calculates the total coverage (returned length) within a range
 * 
 * @param totalStart - Start of the total range
 * @param totalEnd - End of the total range
 * @param returnedSegments - Segments that have been returned
 * @returns Total length covered by returned segments
 */
export function calculateCoverage(
  totalStart: number,
  totalEnd: number,
  returnedSegments: CableSegment[]
): number {
  const gaps = findGaps(totalStart, totalEnd, returnedSegments)
  const gapLength = gaps.reduce((sum, gap) => sum + (gap.end - gap.start), 0)
  const totalLength = totalEnd - totalStart
  
  return totalLength - gapLength
}
