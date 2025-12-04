import type { User, ItemType } from './database'

export type ClassroomStatus = 'active' | 'inactive' | 'maintenance'

export interface Classroom {
  id: number
  name: string
  location: string
  status: ClassroomStatus
  description?: string
  responsible_person?: string
  created_at: string
  updated_at: string
  version: number
}

export interface CreateClassroomInput {
  name: string
  location: string
  status: ClassroomStatus
  description?: string
  responsible_person?: string
}

export interface UpdateClassroomInput {
  name?: string
  location?: string
  status?: ClassroomStatus
  description?: string
  responsible_person?: string
}

export interface ClassroomWithDeviceCount extends Classroom {
  device_count: number
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateClassroomInput(input: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = []

  if (!input.name || typeof input.name !== 'string') {
    errors.push({ field: 'name', message: 'El nombre es requerido', code: 'REQUIRED_FIELD' })
  } else if (input.name.length < 1 || input.name.length > 255) {
    errors.push({ field: 'name', message: 'El nombre debe tener entre 1 y 255 caracteres', code: 'INVALID_LENGTH' })
  }

  if (!input.location || typeof input.location !== 'string') {
    errors.push({ field: 'location', message: 'La localidad es requerida', code: 'REQUIRED_FIELD' })
  } else if (input.location.length < 1 || input.location.length > 255) {
    errors.push({ field: 'location', message: 'La localidad debe tener entre 1 y 255 caracteres', code: 'INVALID_LENGTH' })
  }

  const validStatuses: ClassroomStatus[] = ['active', 'inactive', 'maintenance']
  if (!input.status || !validStatuses.includes(input.status as ClassroomStatus)) {
    errors.push({ field: 'status', message: 'El estatus debe ser: active, inactive, o maintenance', code: 'INVALID_VALUE' })
  }

  return { isValid: errors.length === 0, errors }
}

export interface DeviceAssignment {
  id: number
  electronic_device_id: number
  classroom_id: number
  assigned_date: string
  removed_date?: string
  assigned_by?: number
  removed_by?: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DeviceAssignmentWithDetails extends DeviceAssignment {
  device: { id: number; item_type: ItemType }
  classroom: Classroom
  assigned_by_user?: User
  removed_by_user?: User
}

export interface CreateDeviceAssignmentInput {
  electronic_device_id: number
  classroom_id: number
  notes?: string
}

export function validateDeviceAssignment(deviceId: number, classroomId: number, existingAssignments: DeviceAssignment[]): ValidationResult {
  const errors: ValidationError[] = []
  const activeAssignment = existingAssignments.find(a => a.electronic_device_id === deviceId && a.is_active)
  if (activeAssignment) {
    errors.push({ field: 'electronic_device_id', message: 'El dispositivo ya está asignado a un aula', code: 'ALREADY_ASSIGNED' })
  }
  return { isValid: errors.length === 0, errors }
}

export interface DeviceCombination {
  id: number
  device_1_id: number
  device_2_id: number
  combination_type?: string
  created_date: string
  created_by?: number
  removed_date?: string
  removed_by?: number
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface DeviceCombinationWithDetails extends DeviceCombination {
  device_1: { id: number; item_type: ItemType; brand?: string; model?: string; tool_instance?: { item_type?: ItemType } }
  device_2: { id: number; item_type: ItemType; brand?: string; model?: string; tool_instance?: { item_type?: ItemType } }
  created_by_user?: User
  removed_by_user?: User
  creator?: { id: number; username?: string; full_name?: string }
  classroom?: { id: number; name: string; location?: string }
}

export interface CreateDeviceCombinationInput {
  device_1_id: number
  device_2_id: number
  combination_type?: string
  notes?: string
}

export async function validateDeviceCombination(
  device1Id: number,
  device2Id: number,
  assignments: DeviceAssignment[]
): Promise<ValidationResult> {
  const errors: ValidationError[] = []
  const device1Assignment = assignments.find(a => a.electronic_device_id === device1Id && a.is_active)
  const device2Assignment = assignments.find(a => a.electronic_device_id === device2Id && a.is_active)
  if (!device1Assignment) {
    errors.push({ field: 'device_1_id', message: 'El primer dispositivo debe estar asignado a un aula', code: 'NOT_ASSIGNED' })
  }
  if (!device2Assignment) {
    errors.push({ field: 'device_2_id', message: 'El segundo dispositivo debe estar asignado a un aula', code: 'NOT_ASSIGNED' })
  }
  if (device1Assignment && device2Assignment && device1Assignment.classroom_id !== device2Assignment.classroom_id) {
    errors.push({ field: 'devices', message: 'Ambos dispositivos deben estar en la misma aula', code: 'DIFFERENT_CLASSROOMS' })
  }
  return { isValid: errors.length === 0, errors }
}

