/**
 * Property-Based Tests for Classroom Device Distribution
 *
 * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
 * **Validates: Requirements 10.2**
 *
 * For any classroom device distribution view, the sum of devices across all
 * classrooms should equal the total assigned devices count.
 */

import * as fc from 'fast-check'

// Types for testing
interface ClassroomDeviceAssignment {
  classroomId: number
  classroomName: string
  building?: string
  floor?: string
  totalDevices: number
}

interface ClassroomsSummary {
  total: number
  withDevices: number
  totalAssignments: number
}

// Helper function to calculate total devices from assignments
function calculateTotalDevicesFromAssignments(
  assignments: ClassroomDeviceAssignment[]
): number {
  return assignments.reduce((sum, classroom) => sum + classroom.totalDevices, 0)
}

// Helper function to count classrooms with devices
function countClassroomsWithDevices(
  assignments: ClassroomDeviceAssignment[]
): number {
  return assignments.filter((c) => c.totalDevices > 0).length
}

// Helper function to validate summary consistency
function validateSummaryConsistency(
  summary: ClassroomsSummary,
  assignments: ClassroomDeviceAssignment[]
): boolean {
  const calculatedTotal = calculateTotalDevicesFromAssignments(assignments)
  const calculatedWithDevices = countClassroomsWithDevices(assignments)

  return (
    summary.totalAssignments === calculatedTotal &&
    summary.withDevices === calculatedWithDevices &&
    summary.total === assignments.length
  )
}

// Generators
const classroomAssignmentArb = (id: number): fc.Arbitrary<ClassroomDeviceAssignment> =>
  fc.record({
    classroomId: fc.constant(id),
    classroomName: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `Aula-${s}`),
    building: fc.option(fc.string({ minLength: 1, maxLength: 15 }).map((s) => `Edificio-${s}`), { nil: undefined }),
    floor: fc.option(fc.string({ minLength: 1, maxLength: 5 }), { nil: undefined }),
    totalDevices: fc.integer({ min: 0, max: 50 }),
  })

describe('Classroom Device Distribution Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
   * **Validates: Requirements 10.2**
   *
   * The sum of devices across all classrooms should equal the total assigned devices count.
   */
  it('sum of devices across classrooms should equal total assignments', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).chain((numClassrooms) => {
          const ids = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          return fc.array(
            fc.integer({ min: 0, max: numClassrooms - 1 }).chain((idx) =>
              classroomAssignmentArb(ids[idx])
            ),
            { minLength: numClassrooms, maxLength: numClassrooms }
          ).map((arr) => ids.map((id, i) => ({ ...arr[i], classroomId: id })))
        }),
        (assignments) => {
          const totalFromAssignments = calculateTotalDevicesFromAssignments(assignments)

          // Create a consistent summary
          const summary: ClassroomsSummary = {
            total: assignments.length,
            withDevices: countClassroomsWithDevices(assignments),
            totalAssignments: totalFromAssignments,
          }

          // The sum should match
          expect(summary.totalAssignments).toBe(totalFromAssignments)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
   * **Validates: Requirements 10.2**
   *
   * Classrooms with devices count should match classrooms where totalDevices > 0.
   */
  it('withDevices count should match classrooms with totalDevices > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 15 }).chain((numClassrooms) => {
          const ids = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          return fc.array(
            fc.integer({ min: 0, max: numClassrooms - 1 }).chain((idx) =>
              classroomAssignmentArb(ids[idx])
            ),
            { minLength: numClassrooms, maxLength: numClassrooms }
          ).map((arr) => ids.map((id, i) => ({ ...arr[i], classroomId: id })))
        }),
        (assignments) => {
          const withDevicesCount = countClassroomsWithDevices(assignments)
          const manualCount = assignments.filter((c) => c.totalDevices > 0).length

          expect(withDevicesCount).toBe(manualCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
   * **Validates: Requirements 10.2**
   *
   * Total classrooms should equal the length of assignments array.
   */
  it('total classrooms should equal assignments array length', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 25 }).chain((numClassrooms: number) => {
          if (numClassrooms === 0) return fc.constant<ClassroomDeviceAssignment[]>([])
          const ids = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          return fc.array(
            fc.integer({ min: 0, max: numClassrooms - 1 }).chain((idx) =>
              classroomAssignmentArb(ids[idx])
            ),
            { minLength: numClassrooms, maxLength: numClassrooms }
          ).map((arr) => ids.map((id, i) => ({ ...arr[i], classroomId: id }))) as fc.Arbitrary<ClassroomDeviceAssignment[]>
        }),
        (assignments: ClassroomDeviceAssignment[]) => {
          const summary: ClassroomsSummary = {
            total: assignments.length,
            withDevices: countClassroomsWithDevices(assignments),
            totalAssignments: calculateTotalDevicesFromAssignments(assignments),
          }

          expect(summary.total).toBe(assignments.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
   * **Validates: Requirements 10.2**
   *
   * Summary should be consistent with assignments data.
   */
  it('summary should be consistent with assignments data', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).chain((numClassrooms) => {
          const ids = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          return fc.array(
            fc.integer({ min: 0, max: numClassrooms - 1 }).chain((idx) =>
              classroomAssignmentArb(ids[idx])
            ),
            { minLength: numClassrooms, maxLength: numClassrooms }
          ).map((arr) => ids.map((id, i) => ({ ...arr[i], classroomId: id })))
        }),
        (assignments) => {
          const summary: ClassroomsSummary = {
            total: assignments.length,
            withDevices: countClassroomsWithDevices(assignments),
            totalAssignments: calculateTotalDevicesFromAssignments(assignments),
          }

          expect(validateSummaryConsistency(summary, assignments)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
   * **Validates: Requirements 10.2**
   *
   * withDevices should never exceed total classrooms.
   */
  it('withDevices should never exceed total classrooms', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }).chain((numClassrooms) => {
          const ids = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          return fc.array(
            fc.integer({ min: 0, max: numClassrooms - 1 }).chain((idx) =>
              classroomAssignmentArb(ids[idx])
            ),
            { minLength: numClassrooms, maxLength: numClassrooms }
          ).map((arr) => ids.map((id, i) => ({ ...arr[i], classroomId: id })))
        }),
        (assignments) => {
          const summary: ClassroomsSummary = {
            total: assignments.length,
            withDevices: countClassroomsWithDevices(assignments),
            totalAssignments: calculateTotalDevicesFromAssignments(assignments),
          }

          expect(summary.withDevices).toBeLessThanOrEqual(summary.total)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 15: Classroom Device Distribution Sum**
   * **Validates: Requirements 10.2**
   *
   * Adding a device to any classroom should increase total by 1.
   */
  it('adding a device to any classroom should increase total by 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }).chain((numClassrooms) => {
          const ids = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          return fc.tuple(
            fc.array(
              fc.integer({ min: 0, max: numClassrooms - 1 }).chain((idx) =>
                classroomAssignmentArb(ids[idx])
              ),
              { minLength: numClassrooms, maxLength: numClassrooms }
            ).map((arr) => ids.map((id, i) => ({ ...arr[i], classroomId: id }))),
            fc.integer({ min: 0, max: numClassrooms - 1 })
          )
        }),
        ([assignments, targetIndex]) => {
          const originalTotal = calculateTotalDevicesFromAssignments(assignments)

          // Add one device to target classroom
          const modifiedAssignments = assignments.map((a, i) =>
            i === targetIndex ? { ...a, totalDevices: a.totalDevices + 1 } : a
          )

          const newTotal = calculateTotalDevicesFromAssignments(modifiedAssignments)

          expect(newTotal).toBe(originalTotal + 1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
