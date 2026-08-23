import { supabase } from '../supabase'
import type {
  Classroom,
  CreateClassroomInput,
  UpdateClassroomInput,
  ClassroomWithDeviceCount,
  DeviceAssignment,
  DeviceAssignmentWithDetails,
  CreateDeviceAssignmentInput,
  DeviceCombination,
  DeviceCombinationWithDetails,
  CreateDeviceCombinationInput,
  ClassroomReservation, 
  ClassroomReservationWithDetails, 
  CreateClassroomReservationInput, 
  UpdateClassroomReservationInput,
  ClassroomInternetService, 
  CreateInternetServiceInput, 
  UpdateInternetServiceInput 
} from '@/types/classrooms'

export const classroomOperations = {
  async create(input: CreateClassroomInput): Promise<Classroom> {
    const { data, error } = await supabase
      .from('classrooms')
      .insert({
        name: input.name,
        location: input.location,
        building: input.building || null,
        floor: input.floor || null,
        status: input.status,
        description: input.description || null,
        responsible_person: input.responsible_person || null,
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async getAll(): Promise<(ClassroomWithDeviceCount & { is_reserved: boolean; current_reservation?: string })[]> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })
    if (error) throw error
    const classrooms = data || []
    
    // Compute device counts
    const { data: assignments } = await supabase
      .from('device_assignments')
      .select('classroom_id, is_active')
      .eq('is_active', true)
    const counts = (assignments || []).reduce((acc: Record<number, number>, a) => {
      acc[a.classroom_id] = (acc[a.classroom_id] || 0) + 1
      return acc
    }, {})
    
    // Check current reservations
    const now = new Date().toISOString()
    const { data: reservations } = await supabase
      .from('classroom_reservations')
      .select('classroom_id, title')
      .lte('start_datetime', now)
      .gte('end_datetime', now)
      .in('status', ['pending', 'confirmed'])
    
    const reservedMap: Record<number, string> = {}
    ;(reservations || []).forEach((r: any) => {
      reservedMap[r.classroom_id] = r.title
    })
    
    return classrooms.map(c => ({ 
      ...c, 
      device_count: counts[c.id] || 0,
      is_reserved: !!reservedMap[c.id],
      current_reservation: reservedMap[c.id]
    }))
  },

  async getStats(): Promise<{
    totalReservations: number
    activeReservations: number
    reservationsThisMonth: number
    internetServicesCount: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { count: totalReservations } = await supabase
      .from('classroom_reservations')
      .select('*', { count: 'exact', head: true })

    const { count: activeReservations } = await supabase
      .from('classroom_reservations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed'])
      .gte('end_datetime', now.toISOString())

    const { count: reservationsThisMonth } = await supabase
      .from('classroom_reservations')
      .select('*', { count: 'exact', head: true })
      .gte('start_datetime', startOfMonth)
      .lte('start_datetime', endOfMonth)

    const { count: internetServicesCount } = await supabase
      .from('classroom_internet_services')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    return {
      totalReservations: totalReservations || 0,
      activeReservations: activeReservations || 0,
      reservationsThisMonth: reservationsThisMonth || 0,
      internetServicesCount: internetServicesCount || 0,
    }
  },

  async getById(id: number): Promise<ClassroomWithDeviceCount | null> {
    const { data, error } = await supabase
      .from('classrooms')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null
    const { data: assignments } = await supabase
      .from('device_assignments')
      .select('id')
      .eq('classroom_id', id)
      .eq('is_active', true)
    const device_count = (assignments || []).length
    return { ...data, device_count }
  },

  async update(id: number, input: UpdateClassroomInput): Promise<Classroom> {
    const { data, error } = await supabase
      .from('classrooms')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async delete(id: number, softDelete = true): Promise<void> {
    const { data: assignments } = await supabase
      .from('device_assignments')
      .select('id')
      .eq('classroom_id', id)
      .eq('is_active', true)
    if ((assignments || []).length > 0) {
      const err: any = new Error('Classroom has assigned devices')
      err.code = 'HAS_ASSIGNED_DEVICES'
      throw err
    }
    
    if (softDelete) {
      const { error } = await supabase
        .from('classrooms')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
}

export const assignmentOperations = {
  async create(input: CreateDeviceAssignmentInput, userId?: number): Promise<DeviceAssignmentWithDetails> {
    const { data, error } = await supabase
      .from('device_assignments')
      .insert({
        electronic_device_id: input.electronic_device_id,
        classroom_id: input.classroom_id,
        notes: input.notes || null,
        assigned_by: userId || null,
      })
      .select(`
        *,
        device:electronic_devices(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        classroom:classrooms(*)
      `)
      .single()
    if (error) throw error
    return data as unknown as DeviceAssignmentWithDetails
  },

  async getAll(filters?: { classroom_id?: number; electronic_device_id?: number; status?: 'active' | 'removed' }): Promise<DeviceAssignmentWithDetails[]> {
    let query = supabase
      .from('device_assignments')
      .select(`
        *,
        device:electronic_devices(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        classroom:classrooms(*),
        assigned_by_user:users!device_assignments_assigned_by_fkey(*),
        removed_by_user:users!device_assignments_removed_by_fkey(*)
      `)
      .order('created_at', { ascending: false })
    if (filters?.classroom_id) query = query.eq('classroom_id', filters.classroom_id)
    if (filters?.electronic_device_id) query = query.eq('electronic_device_id', filters.electronic_device_id)
    if (filters?.status) query = query.eq('is_active', filters.status === 'active')
    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as DeviceAssignmentWithDetails[]
  },

  async getById(id: number): Promise<DeviceAssignmentWithDetails | null> {
    const { data, error } = await supabase
      .from('device_assignments')
      .select(`
        *,
        device:electronic_devices(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        classroom:classrooms(*),
        assigned_by_user:users!device_assignments_assigned_by_fkey(*),
        removed_by_user:users!device_assignments_removed_by_fkey(*)
      `)
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data || null) as unknown as DeviceAssignmentWithDetails | null
  },

  async getByClassroom(classroomId: number): Promise<DeviceAssignmentWithDetails[]> {
    return this.getAll({ classroom_id: classroomId })
  },

  async getByDevice(deviceId: number): Promise<DeviceAssignmentWithDetails[]> {
    return this.getAll({ electronic_device_id: deviceId })
  },

  async remove(id: number, userId?: number): Promise<DeviceAssignment> {
    const { data, error } = await supabase
      .from('device_assignments')
      .update({
        is_active: false,
        removed_date: new Date().toISOString(),
        removed_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as DeviceAssignment
  },
}

export const combinationOperations = {
  async create(input: CreateDeviceCombinationInput, userId?: number): Promise<DeviceCombinationWithDetails> {
    const { data, error } = await supabase
      .from('device_combinations')
      .insert({
        device_1_id: input.device_1_id,
        device_2_id: input.device_2_id,
        combination_type: input.combination_type || null,
        notes: input.notes || null,
        created_by: userId || null,
      })
      .select(`
        *,
        device_1:electronic_devices!device_combinations_device_1_id_fkey(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        device_2:electronic_devices!device_combinations_device_2_id_fkey(*, tool_instance:tool_instances(*, item_type:item_types(*)))
      `)
      .single()
    if (error) throw error
    return data as unknown as DeviceCombinationWithDetails
  },

  async getAll(filters?: { classroom_id?: number }): Promise<DeviceCombinationWithDetails[]> {
    let query = supabase
      .from('device_combinations')
      .select(`
        *,
        device_1:electronic_devices!device_combinations_device_1_id_fkey(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        device_2:electronic_devices!device_combinations_device_2_id_fkey(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        creator:users!device_combinations_created_by_fkey(id, username, full_name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (filters?.classroom_id) {
      const { data: assignments } = await supabase
        .from('device_assignments')
        .select('electronic_device_id')
        .eq('classroom_id', filters.classroom_id)
        .eq('is_active', true)
      const ids = (assignments || []).map(a => a.electronic_device_id)
      query = query.in('device_1_id', ids).in('device_2_id', ids)
    }
    const { data, error } = await query
    if (error) throw error

    const combinations = data || []
    const deviceIds = new Set<number>()
    combinations.forEach(c => {
      deviceIds.add(c.device_1_id)
      deviceIds.add(c.device_2_id)
    })

    const { data: assignments } = await supabase
      .from('device_assignments')
      .select(`
        electronic_device_id,
        classroom:classrooms(id, name, location)
      `)
      .in('electronic_device_id', Array.from(deviceIds))
      .eq('is_active', true)

    const deviceClassroomMap: Record<number, { id: number; name: string; location?: string }> = {}
    assignments?.forEach((a: any) => {
      if (a.classroom) {
        const classroom = Array.isArray(a.classroom) ? a.classroom[0] : a.classroom
        if (classroom) {
          deviceClassroomMap[a.electronic_device_id] = {
            id: classroom.id,
            name: classroom.name,
            location: classroom.location,
          }
        }
      }
    })

    const combinationsWithClassroom = combinations.map(c => ({
      ...c,
      classroom: deviceClassroomMap[c.device_1_id] || deviceClassroomMap[c.device_2_id] || null,
    }))

    return combinationsWithClassroom as unknown as DeviceCombinationWithDetails[]
  },

  async getById(id: number): Promise<DeviceCombinationWithDetails | null> {
    const { data, error } = await supabase
      .from('device_combinations')
      .select(`
        *,
        device_1:electronic_devices!device_combinations_device_1_id_fkey(*, tool_instance:tool_instances(*, item_type:item_types(*))),
        device_2:electronic_devices!device_combinations_device_2_id_fkey(*, tool_instance:tool_instances(*, item_type:item_types(*)))
      `)
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data || null) as unknown as DeviceCombinationWithDetails | null
  },

  async getByClassroom(classroomId: number): Promise<DeviceCombinationWithDetails[]> {
    return this.getAll({ classroom_id: classroomId })
  },

  async remove(id: number, userId?: number): Promise<DeviceCombination> {
    const { data, error } = await supabase
      .from('device_combinations')
      .update({
        is_active: false,
        removed_date: new Date().toISOString(),
        removed_by: userId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as DeviceCombination
  },
}

export const classroomReservationOperations = {
  async create(input: CreateClassroomReservationInput, userId: number): Promise<ClassroomReservation> {
    const { data: existing } = await supabase
      .from('classroom_reservations')
      .select('id')
      .eq('classroom_id', input.classroom_id)
      .neq('status', 'cancelled')
      .or(`and(start_datetime.lt.${input.end_datetime},end_datetime.gt.${input.start_datetime})`)
    
    if (existing && existing.length > 0) {
      const err: any = new Error('Ya existe una reserva en ese horario')
      err.code = 'OVERLAPPING_RESERVATION'
      throw err
    }

    const { data, error } = await supabase
      .from('classroom_reservations')
      .insert({
        classroom_id: input.classroom_id,
        user_id: userId,
        title: input.title,
        description: input.description || null,
        start_datetime: input.start_datetime,
        end_datetime: input.end_datetime,
        attendees_count: input.attendees_count || null,
        status: 'pending'
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async getByClassroom(classroomId: number): Promise<ClassroomReservationWithDetails[]> {
    const { data, error } = await supabase
      .from('classroom_reservations')
      .select(`
        *,
        classroom:classrooms(name, location),
        user:users(username, email)
      `)
      .eq('classroom_id', classroomId)
      .order('start_datetime', { ascending: true })
    if (error) throw error
    return (data || []).map((r: any) => ({
      ...r,
      classroom_name: r.classroom?.name,
      classroom_location: r.classroom?.location,
      username: r.user?.username,
      user_email: r.user?.email
    }))
  },

  async getById(id: number): Promise<ClassroomReservationWithDetails | null> {
    const { data, error } = await supabase
      .from('classroom_reservations')
      .select(`
        *,
        classroom:classrooms(name, location),
        user:users(username, email)
      `)
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null
    return {
      ...data,
      classroom_name: data.classroom?.name,
      classroom_location: data.classroom?.location,
      username: data.user?.username,
      user_email: data.user?.email
    } as ClassroomReservationWithDetails
  },

  async update(id: number, input: UpdateClassroomReservationInput): Promise<ClassroomReservation> {
    const { data, error } = await supabase
      .from('classroom_reservations')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('classroom_reservations')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

export const internetServiceOperations = {
  async create(input: CreateInternetServiceInput, userId?: number): Promise<ClassroomInternetService> {
    const { data, error } = await supabase
      .from('classroom_internet_services')
      .insert({
        ...input,
        created_by: userId || null,
        status: input.status || 'active'
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async getByClassroom(classroomId: number): Promise<ClassroomInternetService[]> {
    const { data, error } = await supabase
      .from('classroom_internet_services')
      .select('*')
      .eq('classroom_id', classroomId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<ClassroomInternetService | null> {
    const { data, error } = await supabase
      .from('classroom_internet_services')
      .select('*')
      .eq('id', id)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async update(id: number, input: UpdateInternetServiceInput): Promise<ClassroomInternetService> {
    const { data, error } = await supabase
      .from('classroom_internet_services')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('classroom_internet_services')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}
