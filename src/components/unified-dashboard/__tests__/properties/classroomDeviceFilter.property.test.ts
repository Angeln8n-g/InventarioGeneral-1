/**
 * Property-Based Tests for Classroom Device History Filter
 * 
 * **Feature: unified-reports-dashboard, Property 19: Classroom Device History Filter**
 * **Validates: Requirements 12.4**
 * 
 * For any classroom filter, the device list should include all devices currently 
 * assigned AND all devices previously assigned to that classroom.
 */

import * as fc from 'fast-check'

// Types for testing
interface Classroom {
  id: number
  name: string
}

interface DeviceMovement {
  id: number
  deviceId: number
  deviceName: string
  serialNumber: string
  fromClassroom: Classroom | null
  toClassroom: Classroom
  transferDate: string
  responsibleUser: { id: number; username: string }
}

interface Device {
  id: number
  name: string
  serialNumber: string
  currentClassroomId: number | null
}

// Helper function to filter devices by classroom (current + historical)
function filterDevicesByClassroom(
  devices: Device[],
  movements: DeviceMovement[],
  classroomId: number
): Device[] {
  // Get devices currently assigned to the classroom
  const currentDeviceIds = new Set(
    devices
      .filter(d => d.currentClassroomId === classroomId)
      .map(d => d.id)
  )
  
  // Get devices that were ever assigned to this classroom (from movements)
  const historicalDeviceIds = new Set(
    movements
      .filter(m => 
        m.toClassroom.id === classroomId || 
        m.fromClassroom?.id === classroomId
      )
      .map(m => m.deviceId)
  )
  
  // Combine both sets
  const allDeviceIds = new Set([...currentDeviceIds, ...historicalDeviceIds])
  
  return devices.filter(d => allDeviceIds.has(d.id))
}

// Generators
const classroomArb = (id: number): fc.Arbitrary<Classroom> => 
  fc.record({
    id: fc.constant(id),
    name: fc.string({ minLength: 1, maxLength: 20 }).map(s => `Aula-${s}`)
  })

const deviceArb = (id: number, classroomIds: number[]): fc.Arbitrary<Device> =>
  fc.record({
    id: fc.constant(id),
    name: fc.string({ minLength: 1, maxLength: 30 }).map(s => `Device-${s}`),
    serialNumber: fc.string({ minLength: 5, maxLength: 15 }).map(s => `SN-${s}`),
    currentClassroomId: fc.oneof(
      fc.constant(null),
      fc.constantFrom(...classroomIds)
    )
  })

const movementArb = (
  id: number, 
  deviceIds: number[], 
  classrooms: Classroom[]
): fc.Arbitrary<DeviceMovement> =>
  fc.record({
    id: fc.constant(id),
    deviceId: fc.constantFrom(...deviceIds),
    deviceName: fc.string({ minLength: 1, maxLength: 30 }).map(s => `Device-${s}`),
    serialNumber: fc.string({ minLength: 5, maxLength: 15 }).map(s => `SN-${s}`),
    fromClassroom: fc.oneof(
      fc.constant(null),
      fc.constantFrom(...classrooms)
    ),
    toClassroom: fc.constantFrom(...classrooms),
    transferDate: fc.integer({ min: 1577836800000, max: 1767225600000 })
      .map(ts => new Date(ts).toISOString()),
    responsibleUser: fc.record({
      id: fc.integer({ min: 1, max: 100 }),
      username: fc.string({ minLength: 3, maxLength: 20 }).map(s => `user-${s}`)
    })
  })

describe('Classroom Device History Filter Properties', () => {
  /**
   * **Feature: unified-reports-dashboard, Property 19: Classroom Device History Filter**
   * **Validates: Requirements 12.4**
   * 
   * For any classroom filter, the device list should include all devices currently 
   * assigned AND all devices previously assigned to that classroom.
   */
  it('should include all devices currently assigned to the filtered classroom', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }).chain(numClassrooms => {
          const classroomIds = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          
          return fc.tuple(
            fc.array(
              fc.integer({ min: 0, max: numClassrooms - 1 }).chain(idx => 
                classroomArb(classroomIds[idx])
              ),
              { minLength: numClassrooms, maxLength: numClassrooms }
            ).map(arr => {
              // Ensure unique IDs
              return classroomIds.map((id, i) => ({ ...arr[i], id }))
            }),
            fc.integer({ min: 1, max: 10 }).chain(numDevices => {
              const deviceIds = Array.from({ length: numDevices }, (_, i) => i + 1)
              return fc.array(
                fc.integer({ min: 0, max: numDevices - 1 }).chain(idx =>
                  deviceArb(deviceIds[idx], classroomIds)
                ),
                { minLength: numDevices, maxLength: numDevices }
              ).map(arr => {
                // Ensure unique IDs
                return deviceIds.map((id, i) => ({ ...arr[i], id }))
              })
            }),
            fc.constantFrom(...classroomIds)
          )
        }),
        ([classrooms, devices, targetClassroomId]) => {
          // Create empty movements array for this test
          const movements: DeviceMovement[] = []
          
          const filteredDevices = filterDevicesByClassroom(devices, movements, targetClassroomId)
          
          // All devices currently assigned to the target classroom should be in the result
          const currentlyAssigned = devices.filter(d => d.currentClassroomId === targetClassroomId)
          
          for (const device of currentlyAssigned) {
            expect(filteredDevices.some(d => d.id === device.id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 19: Classroom Device History Filter**
   * **Validates: Requirements 12.4**
   * 
   * Devices that were previously assigned (appear in movement history) should be included.
   */
  it('should include all devices previously assigned to the filtered classroom', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }).chain(numClassrooms => {
          const classroomIds = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          
          return fc.tuple(
            // Generate classrooms
            fc.array(
              fc.integer({ min: 0, max: numClassrooms - 1 }).chain(idx => 
                classroomArb(classroomIds[idx])
              ),
              { minLength: numClassrooms, maxLength: numClassrooms }
            ).map(arr => classroomIds.map((id, i) => ({ ...arr[i], id }))),
            // Generate devices
            fc.integer({ min: 2, max: 6 }).chain(numDevices => {
              const deviceIds = Array.from({ length: numDevices }, (_, i) => i + 1)
              return fc.tuple(
                fc.array(
                  fc.integer({ min: 0, max: numDevices - 1 }).chain(idx =>
                    deviceArb(deviceIds[idx], classroomIds)
                  ),
                  { minLength: numDevices, maxLength: numDevices }
                ).map(arr => deviceIds.map((id, i) => ({ ...arr[i], id }))),
                fc.constant(deviceIds)
              )
            }),
            fc.constantFrom(...classroomIds)
          )
        }).chain(([classrooms, [devices, deviceIds], targetClassroomId]) => {
          // Generate movements that reference the target classroom
          return fc.tuple(
            fc.constant(classrooms),
            fc.constant(devices),
            fc.constant(targetClassroomId),
            fc.array(
              movementArb(1, deviceIds, classrooms),
              { minLength: 1, maxLength: 10 }
            ).map((arr, idx) => arr.map((m, i) => ({ ...m, id: i + 1 })))
          )
        }),
        ([classrooms, devices, targetClassroomId, movements]) => {
          const filteredDevices = filterDevicesByClassroom(devices, movements, targetClassroomId)
          
          // Get device IDs that appear in movements involving the target classroom
          const historicalDeviceIds = new Set(
            movements
              .filter(m => 
                m.toClassroom.id === targetClassroomId || 
                m.fromClassroom?.id === targetClassroomId
              )
              .map(m => m.deviceId)
          )
          
          // All historical devices should be in the filtered result
          for (const deviceId of historicalDeviceIds) {
            const deviceExists = devices.some(d => d.id === deviceId)
            if (deviceExists) {
              expect(filteredDevices.some(d => d.id === deviceId)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 19: Classroom Device History Filter**
   * **Validates: Requirements 12.4**
   * 
   * The filtered result should be a subset of all devices.
   */
  it('filtered devices should be a subset of all devices', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }).chain(numClassrooms => {
          const classroomIds = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          
          return fc.tuple(
            fc.array(
              fc.integer({ min: 0, max: numClassrooms - 1 }).chain(idx => 
                classroomArb(classroomIds[idx])
              ),
              { minLength: numClassrooms, maxLength: numClassrooms }
            ).map(arr => classroomIds.map((id, i) => ({ ...arr[i], id }))),
            fc.integer({ min: 1, max: 8 }).chain(numDevices => {
              const deviceIds = Array.from({ length: numDevices }, (_, i) => i + 1)
              return fc.array(
                fc.integer({ min: 0, max: numDevices - 1 }).chain(idx =>
                  deviceArb(deviceIds[idx], classroomIds)
                ),
                { minLength: numDevices, maxLength: numDevices }
              ).map(arr => deviceIds.map((id, i) => ({ ...arr[i], id })))
            }),
            fc.constantFrom(...classroomIds)
          )
        }),
        ([classrooms, devices, targetClassroomId]) => {
          const movements: DeviceMovement[] = []
          const filteredDevices = filterDevicesByClassroom(devices, movements, targetClassroomId)
          
          // Every filtered device should exist in the original devices array
          for (const filtered of filteredDevices) {
            expect(devices.some(d => d.id === filtered.id)).toBe(true)
          }
          
          // Filtered count should not exceed total devices
          expect(filteredDevices.length).toBeLessThanOrEqual(devices.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 19: Classroom Device History Filter**
   * **Validates: Requirements 12.4**
   * 
   * Devices with no connection to the classroom should not appear in filtered results.
   */
  it('should not include devices with no connection to the filtered classroom', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 5 }).chain(numClassrooms => {
          const classroomIds = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          
          return fc.tuple(
            fc.array(
              fc.integer({ min: 0, max: numClassrooms - 1 }).chain(idx => 
                classroomArb(classroomIds[idx])
              ),
              { minLength: numClassrooms, maxLength: numClassrooms }
            ).map(arr => classroomIds.map((id, i) => ({ ...arr[i], id }))),
            fc.integer({ min: 2, max: 6 }).chain(numDevices => {
              const deviceIds = Array.from({ length: numDevices }, (_, i) => i + 1)
              return fc.tuple(
                fc.array(
                  fc.integer({ min: 0, max: numDevices - 1 }).chain(idx =>
                    deviceArb(deviceIds[idx], classroomIds)
                  ),
                  { minLength: numDevices, maxLength: numDevices }
                ).map(arr => deviceIds.map((id, i) => ({ ...arr[i], id }))),
                fc.constant(deviceIds)
              )
            }),
            fc.constantFrom(...classroomIds)
          )
        }).chain(([classrooms, [devices, deviceIds], targetClassroomId]) => {
          // Generate movements that DON'T involve the target classroom
          const otherClassrooms = classrooms.filter(c => c.id !== targetClassroomId)
          
          if (otherClassrooms.length === 0) {
            return fc.constant([classrooms, devices, targetClassroomId, []] as const)
          }
          
          return fc.tuple(
            fc.constant(classrooms),
            fc.constant(devices),
            fc.constant(targetClassroomId),
            fc.array(
              movementArb(1, deviceIds, otherClassrooms),
              { minLength: 0, maxLength: 5 }
            ).map((arr) => arr.map((m, i) => ({ ...m, id: i + 1 })))
          )
        }),
        ([classrooms, devices, targetClassroomId, movements]) => {
          const filteredDevices = filterDevicesByClassroom(devices, movements, targetClassroomId)
          
          // Find devices that have NO connection to target classroom
          const devicesWithNoConnection = devices.filter(d => {
            // Not currently assigned
            if (d.currentClassroomId === targetClassroomId) return false
            
            // Not in any movement involving target classroom
            const hasMovement = movements.some(m => 
              m.deviceId === d.id && 
              (m.toClassroom.id === targetClassroomId || m.fromClassroom?.id === targetClassroomId)
            )
            
            return !hasMovement
          })
          
          // These devices should NOT be in the filtered result
          for (const device of devicesWithNoConnection) {
            expect(filteredDevices.some(d => d.id === device.id)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * **Feature: unified-reports-dashboard, Property 19: Classroom Device History Filter**
   * **Validates: Requirements 12.4**
   * 
   * Union property: filtered devices = current + historical (no duplicates).
   */
  it('filtered devices should equal union of current and historical assignments', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }).chain(numClassrooms => {
          const classroomIds = Array.from({ length: numClassrooms }, (_, i) => i + 1)
          
          return fc.tuple(
            fc.array(
              fc.integer({ min: 0, max: numClassrooms - 1 }).chain(idx => 
                classroomArb(classroomIds[idx])
              ),
              { minLength: numClassrooms, maxLength: numClassrooms }
            ).map(arr => classroomIds.map((id, i) => ({ ...arr[i], id }))),
            fc.integer({ min: 2, max: 8 }).chain(numDevices => {
              const deviceIds = Array.from({ length: numDevices }, (_, i) => i + 1)
              return fc.tuple(
                fc.array(
                  fc.integer({ min: 0, max: numDevices - 1 }).chain(idx =>
                    deviceArb(deviceIds[idx], classroomIds)
                  ),
                  { minLength: numDevices, maxLength: numDevices }
                ).map(arr => deviceIds.map((id, i) => ({ ...arr[i], id }))),
                fc.constant(deviceIds)
              )
            }),
            fc.constantFrom(...classroomIds)
          )
        }).chain(([classrooms, [devices, deviceIds], targetClassroomId]) => {
          return fc.tuple(
            fc.constant(classrooms),
            fc.constant(devices),
            fc.constant(targetClassroomId),
            fc.array(
              movementArb(1, deviceIds, classrooms),
              { minLength: 0, maxLength: 10 }
            ).map((arr) => arr.map((m, i) => ({ ...m, id: i + 1 })))
          )
        }),
        ([, devices, targetClassroomId, movements]) => {
          const filteredDevices = filterDevicesByClassroom(devices, movements, targetClassroomId)
          
          // Calculate expected set manually
          const currentIds = new Set(
            devices.filter(d => d.currentClassroomId === targetClassroomId).map(d => d.id)
          )
          
          const historicalIds = new Set(
            movements
              .filter(m => 
                m.toClassroom.id === targetClassroomId || 
                m.fromClassroom?.id === targetClassroomId
              )
              .map(m => m.deviceId)
              .filter(id => devices.some(d => d.id === id))
          )
          
          const expectedIds = new Set([...currentIds, ...historicalIds])
          const actualIds = new Set(filteredDevices.map(d => d.id))
          
          expect(actualIds).toEqual(expectedIds)
        }
      ),
      { numRuns: 100 }
    )
  })
})
