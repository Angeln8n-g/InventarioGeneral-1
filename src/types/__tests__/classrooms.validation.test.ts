import { validateClassroomInput, validateDeviceAssignment, validateDeviceCombination } from '@/types/classrooms'

describe('Classroom validation', () => {
  test('requires name, location, status', () => {
    const r = validateClassroomInput({})
    expect(r.isValid).toBe(false)
  })
  test('accepts valid input', () => {
    const r = validateClassroomInput({ name: 'Aula 1', location: 'Bloque A', status: 'active' })
    expect(r.isValid).toBe(true)
  })
})

describe('Assignment validation', () => {
  test('rejects if device already assigned', () => {
    const r = validateDeviceAssignment(10, 1, [{ id:1, electronic_device_id:10, classroom_id:1, assigned_date:'', is_active:true, created_at:'', updated_at:'' } as any])
    expect(r.isValid).toBe(false)
  })
  test('accepts if not assigned', () => {
    const r = validateDeviceAssignment(10, 1, [])
    expect(r.isValid).toBe(true)
  })
})

describe('Combination validation', () => {
  test('requires both devices assigned', async () => {
    const r = await validateDeviceCombination(1, 2, [])
    expect(r.isValid).toBe(false)
  })
  test('rejects different classrooms', async () => {
    const r = await validateDeviceCombination(1, 2, [
      { electronic_device_id:1, classroom_id:5, is_active:true } as any,
      { electronic_device_id:2, classroom_id:6, is_active:true } as any,
    ])
    expect(r.isValid).toBe(false)
  })
  test('accepts same classroom', async () => {
    const r = await validateDeviceCombination(1, 2, [
      { electronic_device_id:1, classroom_id:5, is_active:true } as any,
      { electronic_device_id:2, classroom_id:5, is_active:true } as any,
    ])
    expect(r.isValid).toBe(true)
  })
})

