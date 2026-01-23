import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'
import type {
  User,
  ItemType,
  ToolInstance,
  ConsumableStock,
  Loan,
  ConsumableRequest,
  Notification,
  AuditLog,
  CreateUserInput,
  UpdateUserInput,
  CreateItemTypeInput,
  UpdateItemTypeInput,
  CreateToolInstanceInput,
  UpdateToolInstanceInput,
  CreateLoanInput,
  UpdateLoanInput,
  CreateConsumableRequestInput,
  UpdateConsumableRequestInput,
  CreateNotificationInput,
  CreateAuditLogInput,
  LoanFilters,
  ToolFilters,
  AuditLogFilters,
  ConsumableReservation,
  ReservationDetails,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilters,
  ElectronicDevice,
  ElectronicDeviceWithDetails,
  CreateElectronicDeviceInput,
  UpdateElectronicDeviceInput,
} from '@/types/database'
import type { NotificationPreferences, NotificationFilter } from '@/types/notifications'
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
} from '@/types/classrooms'

// UUID validation utility - Accepts both standard UUIDs and custom QR codes
export const isValidUUID = (uuid: string): boolean => {
  // Standard UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  // Custom QR code format: QR-{timestamp}-{random}, SN-{timestamp}-{random}, or CONSUMABLE-{id}-{timestamp}
  const customQRRegex = /^(QR|SN|CONSUMABLE)-\d+-[a-z0-9]+$/i
  
  return uuidRegex.test(uuid) || customQRRegex.test(uuid)
}

// Generate UUID for new tool instances
export const generateToolUUID = (): string => {
  return uuidv4()
}

// User operations
export const userOperations = {
  async getById(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}

// Item type operations
export const itemTypeOperations = {
  async getAll(): Promise<ItemType[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('./cache')
    
    return withCache(
      CacheKeys.ITEM_TYPES_ALL,
      async () => {
        const { data, error } = await supabase
          .from('item_types')
          .select('*')
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG // 15 minutos
    )
  },

  async getById(id: number): Promise<ItemType | null> {
    const { data, error } = await supabase
      .from('item_types')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getConsumables(): Promise<ItemType[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('./cache')
    
    return withCache(
      CacheKeys.ITEM_TYPES_CONSUMABLES,
      async () => {
        const { data, error } = await supabase
          .from('item_types')
          .select('*')
          .eq('is_consumable', true)
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG // 15 minutos
    )
  },

  async getTools(): Promise<ItemType[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('./cache')
    
    return withCache(
      CacheKeys.ITEM_TYPES_TOOLS,
      async () => {
        const { data, error } = await supabase
          .from('item_types')
          .select('*')
          .eq('is_consumable', false)
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG // 15 minutos
    )
  },

  async create(input: CreateItemTypeInput): Promise<ItemType> {
    const { data, error } = await supabase
      .from('item_types')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidar caché de item_types
    const { invalidateCache } = await import('./cache')
    invalidateCache('item_type')
    
    return data
  },

  async update(id: number, input: UpdateItemTypeInput): Promise<ItemType> {
    const { data, error } = await supabase
      .from('item_types')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidar caché de item_types
    const { invalidateCache } = await import('./cache')
    invalidateCache('item_type')
    
    return data
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('item_types')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Invalidar caché de item_types
    const { invalidateCache } = await import('./cache')
    invalidateCache('item_type')
  },
}

// Tool instance operations
export const toolInstanceOperations = {
  async getAll(filters?: ToolFilters): Promise<ToolInstance[]> {
    let query = supabase
      .from('tool_instances')
      .select(`
        *,
        item_type:item_types(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.item_type_id) {
      query = query.eq('item_type_id', filters.item_type_id)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<ToolInstance | null> {
    const { data, error } = await supabase
      .from('tool_instances')
      .select(`
        *,
        item_type:item_types(*)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByQRCode(qrCode: string): Promise<ToolInstance | null> {
    if (!isValidUUID(qrCode)) {
      throw new Error('Invalid QR code format')
    }

    const { data, error } = await supabase
      .from('tool_instances')
      .select(`
        *,
        item_type:item_types(*)
      `)
      .eq('qr_code', qrCode)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(input: CreateToolInstanceInput): Promise<ToolInstance> {
    // Generate UUID if not provided
    if (!input.qr_code) {
      input.qr_code = generateToolUUID()
    }

    // Validate UUID format
    if (!isValidUUID(input.qr_code)) {
      throw new Error('Invalid UUID format for QR code')
    }

    const { data, error } = await supabase
      .from('tool_instances')
      .insert(input)
      .select(`
        *,
        item_type:item_types(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, input: UpdateToolInstanceInput): Promise<ToolInstance> {
    // First get current version
    const { data: current, error: fetchError } = await supabase
      .from('tool_instances')
      .select('version')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from('tool_instances')
      .update({ 
        ...input, 
        updated_at: new Date().toISOString(),
        version: (current?.version || 0) + 1
      })
      .eq('id', id)
      .select(`
        *,
        item_type:item_types(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(id: number, status: ToolInstance['status'], notes?: string): Promise<ToolInstance> {
    return this.update(id, { status, condition_notes: notes })
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('tool_instances')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}

// Consumable stock operations
export const consumableStockOperations = {
  async getAll(): Promise<ConsumableStock[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('./cache')
    
    return withCache(
      CacheKeys.CONSUMABLE_STOCK_ALL,
      async () => {
        const { data, error } = await supabase
          .from('consumable_stock')
          .select(`
            *,
            item_type:item_types(*)
          `)
          .order('id', { ascending: true })
        
        if (error) throw error
        
        // Sort by item_type name in JavaScript
        const sortedData = (data || []).sort((a, b) => {
          const nameA = a.item_type?.name || ''
          const nameB = b.item_type?.name || ''
          return nameA.localeCompare(nameB)
        })
        
        return sortedData
      },
      CacheTTL.MEDIUM // 5 minutos (cambia más frecuentemente)
    )
  },

  async getById(id: number): Promise<ConsumableStock | null> {
    const { data, error } = await supabase
      .from('consumable_stock')
      .select(`
        *,
        item_type:item_types(*)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByItemTypeId(itemTypeId: number): Promise<ConsumableStock | null> {
    const { data, error } = await supabase
      .from('consumable_stock')
      .select(`
        *,
        item_type:item_types(*)
      `)
      .eq('item_type_id', itemTypeId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async updateQuantity(id: number, newQuantity: number): Promise<ConsumableStock> {
    // First get current version
    const { data: current, error: fetchError } = await supabase
      .from('consumable_stock')
      .select('version')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from('consumable_stock')
      .update({ 
        current_quantity: newQuantity,
        updated_at: new Date().toISOString(),
        version: (current?.version || 0) + 1
      })
      .eq('id', id)
      .select(`
        *,
        item_type:item_types(*)
      `)
      .single()
    
    if (error) throw error
    
    // Invalidar caché de consumable_stock
    const { invalidateCache } = await import('./cache')
    invalidateCache('consumable_stock')
    
    return data
  },

  async adjustStock(id: number, adjustment: number): Promise<ConsumableStock> {
    // First get current values
    const { data: current, error: fetchError } = await supabase
      .from('consumable_stock')
      .select('current_quantity, version')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const newQuantity = (current?.current_quantity || 0) + adjustment
    if (newQuantity < 0) {
      throw new Error('Stock quantity cannot be negative')
    }

    const { data, error } = await supabase
      .from('consumable_stock')
      .update({ 
        current_quantity: newQuantity,
        updated_at: new Date().toISOString(),
        version: (current?.version || 0) + 1
      })
      .eq('id', id)
      .select(`
        *,
        item_type:item_types(*)
      `)
      .single()
    
    if (error) throw error
    
    // Invalidar caché de consumable_stock
    const { invalidateCache } = await import('./cache')
    invalidateCache('consumable_stock')
    
    return data
  },
}

// Loan operations
export const loanOperations = {
  async getAll(filters?: LoanFilters): Promise<Loan[]> {
    let query = supabase
      .from('loans')
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .order('created_at', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.overdue) {
      query = query.lt('due_date', new Date().toISOString())
        .eq('status', 'active')
    }
    if (filters?.start_date) {
      query = query.gte('loan_date', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('loan_date', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<Loan | null> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getActiveByUserId(userId: number): Promise<Loan[]> {
    return this.getAll({ user_id: userId, status: 'active' })
  },

  async getOverdueLoans(): Promise<Loan[]> {
    return this.getAll({ overdue: true })
  },

  async create(input: CreateLoanInput): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .insert(input)
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, input: UpdateLoanInput): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        user:users(*),
        tool_instance:tool_instances(*, item_type:item_types(*))
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async returnTool(id: number): Promise<Loan> {
    return this.update(id, {
      return_date: new Date().toISOString(),
      status: 'returned'
    })
  },

  async markOverdue(id: number): Promise<Loan> {
    return this.update(id, { status: 'overdue' })
  },
}

// Notification operations
export const notificationOperations = {
  async getByUserId(
    userId: number, 
    filters?: NotificationFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Notification[]; total: number; unread_count: number }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Apply filters
      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.read !== undefined) {
        query = query.eq('is_read', filters.read)
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, error, count } = await query
      
      // If table doesn't exist or other DB error, return empty data gracefully
      if (error) {
        console.warn('Notifications query error (returning empty):', error.message)
        return {
          data: [],
          total: 0,
          unread_count: 0,
        }
      }

      // Get unread count - also handle gracefully
      const { count: unreadCount, error: unreadError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (unreadError) {
        console.warn('Unread count error (using 0):', unreadError.message)
      }

      return {
        data: data || [],
        total: count || 0,
        unread_count: unreadCount || 0,
      }
    } catch (err) {
      console.warn('Notifications fetch failed (non-critical):', err)
      // Return empty data instead of throwing
      return {
        data: [],
        total: 0,
        unread_count: 0,
      }
    }
  },

  async getUnreadByUserId(userId: number): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAsRead(id: number): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAllAsRead(userId: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}

// Notification preferences operations
export const notificationPreferencesOperations = {
  async getByUserId(userId: number): Promise<NotificationPreferences | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(userId: number): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(userId: number, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .update({ ...preferences, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getOrCreate(userId: number): Promise<NotificationPreferences> {
    const existing = await this.getByUserId(userId)
    if (existing) return existing
    return this.create(userId)
  },
}

// Consumable request operations
export const consumableRequestOperations = {
  async getAll(filters?: { user_id?: number; status?: string; item_type_id?: number }): Promise<ConsumableRequest[]> {
    let query = supabase
      .from('consumable_requests')
      .select(`
        *,
        user:users(*),
        item_type:item_types(*)
      `)
      .order('request_date', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.item_type_id) {
      query = query.eq('item_type_id', filters.item_type_id)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<ConsumableRequest | null> {
    const { data, error } = await supabase
      .from('consumable_requests')
      .select(`
        *,
        user:users(*),
        item_type:item_types(*)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByUserId(userId: number): Promise<ConsumableRequest[]> {
    return this.getAll({ user_id: userId })
  },

  async create(input: CreateConsumableRequestInput): Promise<ConsumableRequest> {
    const { data, error } = await supabase
      .from('consumable_requests')
      .insert(input)
      .select(`
        *,
        user:users(*),
        item_type:item_types(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: number, input: UpdateConsumableRequestInput): Promise<ConsumableRequest> {
    const { data, error } = await supabase
      .from('consumable_requests')
      .update(input)
      .eq('id', id)
      .select(`
        *,
        user:users(*),
        item_type:item_types(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async fulfill(id: number, fulfilledQuantity: number): Promise<ConsumableRequest> {
    const request = await this.getById(id)
    if (!request) {
      throw new Error('Consumable request not found')
    }
    
    const status = fulfilledQuantity === 0 ? 'cancelled' : 
                  fulfilledQuantity < request.requested_quantity ? 'partial' : 'fulfilled'
    
    return this.update(id, {
      fulfilled_quantity: fulfilledQuantity,
      status: status as ConsumableRequest['status'],
      fulfilled_date: new Date().toISOString(),
    })
  },

  async cancel(id: number): Promise<ConsumableRequest> {
    return this.update(id, { status: 'cancelled' })
  },
}

// Audit log operations
export const auditLogOperations = {
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const { data, error } = await supabase
      .from('audit_logs')
      .insert(input)
      .select(`
        *,
        user:users(*)
      `)
      .single()
    
    if (error) throw error
    return data
  },

  async getAll(filters?: AuditLogFilters): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.entity_type) {
      query = query.eq('entity_type', filters.entity_type)
    }
    if (filters?.entity_id) {
      query = query.eq('entity_id', filters.entity_id)
    }
    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return this.getAll({ entity_type: entityType, entity_id: entityId })
  },
}


// Consumable reservation operations
export const reservationOperations = {
  async getAll(filters?: ReservationFilters): Promise<ReservationDetails[]> {
    let query = supabase
      .from('reservation_details')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }

    if (filters?.item_type_id) {
      query = query.eq('item_type_id', filters.item_type_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.expiring_soon) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      query = query
        .eq('status', 'active')
        .lte('expiration_date', tomorrow.toISOString())
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async getById(id: number): Promise<ReservationDetails | null> {
    const { data, error } = await supabase
      .from('reservation_details')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByUserId(userId: number): Promise<ReservationDetails[]> {
    return this.getAll({ user_id: userId })
  },

  async getActiveByItemType(itemTypeId: number): Promise<ReservationDetails[]> {
    return this.getAll({ item_type_id: itemTypeId, status: 'active' })
  },

  async create(userId: number, input: CreateReservationInput): Promise<ConsumableReservation> {
    const { data, error } = await supabase
      .from('consumable_reservations')
      .insert({
        user_id: userId,
        ...input,
      })
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    const { invalidateCache } = await import('./cache')
    invalidateCache('consumable')
    invalidateCache('reservation')

    return data
  },

  async update(id: number, input: UpdateReservationInput): Promise<ConsumableReservation> {
    const { data, error } = await supabase
      .from('consumable_reservations')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Invalidate cache
    const { invalidateCache } = await import('./cache')
    invalidateCache('consumable')
    invalidateCache('reservation')

    return data
  },

  async fulfill(id: number, warehouseQrCodeId?: number): Promise<ConsumableReservation> {
    return this.update(id, {
      status: 'fulfilled',
      pickup_date: new Date().toISOString(),
      warehouse_qr_code_id: warehouseQrCodeId,
    })
  },

  async cancel(id: number): Promise<ConsumableReservation> {
    return this.update(id, { status: 'cancelled' })
  },

  async expireOld(): Promise<void> {
    const { error } = await supabase.rpc('expire_old_reservations')
    if (error) throw error

    // Invalidate cache
    const { invalidateCache } = await import('./cache')
    invalidateCache('consumable')
    invalidateCache('reservation')
  },

  async getStats(userId?: number): Promise<{
    total_active: number
    total_fulfilled: number
    total_cancelled: number
    total_expired: number
    expiring_soon: number
    my_active: number
  }> {
    const allReservations = await this.getAll()

    const stats = {
      total_active: allReservations.filter(r => r.status === 'active').length,
      total_fulfilled: allReservations.filter(r => r.status === 'fulfilled').length,
      total_cancelled: allReservations.filter(r => r.status === 'cancelled').length,
      total_expired: allReservations.filter(r => r.status === 'expired').length,
      expiring_soon: allReservations.filter(r => 
        r.status === 'active' && r.days_until_expiration <= 1
      ).length,
      my_active: userId 
        ? allReservations.filter(r => r.user_id === userId && r.status === 'active').length
        : 0,
    }

    return stats
  },

  async getTotalReservedQuantity(itemTypeId: number): Promise<number> {
    const { data, error } = await supabase
      .from('consumable_reservations')
      .select('reserved_quantity')
      .eq('item_type_id', itemTypeId)
      .eq('status', 'active')

    if (error) throw error

    return (data || []).reduce((sum, r) => sum + r.reserved_quantity, 0)
  },
}

// Electronic device operations
export const electronicDeviceOperations = {
  async getAll(filters?: {
    status?: ToolInstance['status']
    category?: string
    search?: string
  }): Promise<ElectronicDeviceWithDetails[]> {
    // Get all electronic devices with their tool instances
    // After migration 010, we can use simple syntax (only one FK exists)
    const { data, error } = await supabase
      .from('electronic_devices')
      .select(`
        *,
        tool_instance:tool_instances(
          *,
          item_type:item_types(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching electronic devices:', error)
      throw error
    }

    let results = data || []

    // Apply filters in JavaScript for more flexibility
    if (filters?.status) {
      results = results.filter(device => {
        const toolInstance = device.tool_instance as unknown as ToolInstance
        return toolInstance?.status === filters.status
      })
    }

    if (filters?.category) {
      results = results.filter(device => {
        const toolInstance = device.tool_instance as unknown as ToolInstance & { item_type: ItemType }
        return toolInstance?.item_type?.category === filters.category
      })
    }

    // Apply search filter in JavaScript (since it needs to search across multiple fields)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      results = results.filter((device) => {
        const toolInstance = device.tool_instance as unknown as ToolInstance & { item_type: ItemType }
        const itemType = toolInstance.item_type
        
        return (
          itemType?.name?.toLowerCase().includes(searchLower) ||
          device.brand?.toLowerCase().includes(searchLower) ||
          device.model?.toLowerCase().includes(searchLower) ||
          toolInstance.serial_number?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Get current loans and assignments for each device
    const electronicDeviceIds = results.map(d => d.id)
    if (electronicDeviceIds.length > 0) {
      // Get loans
      const deviceToolInstanceIds = results.map(d => (d.tool_instance as unknown as ToolInstance).id)
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .in('tool_instance_id', deviceToolInstanceIds)
        .eq('status', 'active')

      // Get active assignments with classroom info
      const { data: assignments } = await supabase
        .from('device_assignments')
        .select(`
          *,
          classroom:classrooms(*)
        `)
        .in('electronic_device_id', electronicDeviceIds)
        .eq('is_active', true)

      // Get custom fields for all devices
      const { data: customFields } = await supabase
        .from('device_custom_fields')
        .select(`
          *,
          field:category_fields(*)
        `)
        .in('electronic_device_id', electronicDeviceIds)

      // Attach loans, assignments, and custom fields to devices
      results = results.map(device => {
        const toolInstance = device.tool_instance as unknown as ToolInstance
        const loan = loans?.find(l => l.tool_instance_id === toolInstance.id)
        const assignment = assignments?.find(a => a.electronic_device_id === device.id)
        
        // Transform custom fields to a key-value object
        const deviceCustomFields = customFields?.filter(cf => cf.electronic_device_id === device.id) || []
        const customFieldsObj: Record<string, unknown> = {}
        deviceCustomFields.forEach(cf => {
          if (cf.field?.field_name) {
            customFieldsObj[cf.field.field_name] = cf.field_value
          }
        })
        
        return {
          ...device,
          current_loan: loan || undefined,
          current_assignment: assignment || undefined,
          custom_fields: customFieldsObj,
        }
      })
    }

    return results
  },

  async getById(id: number): Promise<ElectronicDeviceWithDetails | null> {
    const { data, error } = await supabase
      .from('electronic_devices')
      .select(`
        *,
        tool_instance:tool_instances(
          *,
          item_type:item_types(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    // Get current loan if exists
    const toolInstance = data.tool_instance as unknown as ToolInstance
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('tool_instance_id', toolInstance.id)
      .eq('status', 'active')
      .single()

    // Get custom fields for this device
    const { data: customFields } = await supabase
      .from('device_custom_fields')
      .select(`
        *,
        field:category_fields(*)
      `)
      .eq('electronic_device_id', id)

    // Transform custom fields to a key-value object
    const customFieldsObj: Record<string, unknown> = {}
    customFields?.forEach(cf => {
      if (cf.field?.field_name) {
        customFieldsObj[cf.field.field_name] = cf.field_value
      }
    })

    return {
      ...data,
      current_loan: loan || undefined,
      custom_fields: customFieldsObj,
    }
  },

  async getByToolInstanceId(toolInstanceId: number): Promise<ElectronicDevice | null> {
    const { data, error } = await supabase
      .from('electronic_devices')
      .select('*')
      .eq('tool_instance_id', toolInstanceId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(input: CreateElectronicDeviceInput): Promise<ElectronicDeviceWithDetails> {
    // First, create or get the item_type
    let itemType: ItemType | null = null
    const { data: existingItemType } = await supabase
      .from('item_types')
      .select('*')
      .eq('name', input.name)
      .eq('category', input.category)
      .eq('is_consumable', false)
      .single()

    if (existingItemType) {
      itemType = existingItemType
    } else {
      const { data: newItemType, error: itemTypeError } = await supabase
        .from('item_types')
        .insert({
          name: input.name,
          description: input.description || null,
          category: input.category,
          is_consumable: false,
          default_loan_duration_days: 7,
        })
        .select()
        .single()

      if (itemTypeError) throw itemTypeError
      itemType = newItemType

      // Invalidate cache
      const { invalidateCache } = await import('./cache')
      invalidateCache('item_type')
    }

    if (!itemType) {
      throw new Error('Failed to create or retrieve item type')
    }

    // Create tool_instance with generated QR code
    const qrCode = generateToolUUID()
    const { data: toolInstance, error: toolError } = await supabase
      .from('tool_instances')
      .insert({
        item_type_id: itemType.id,
        qr_code: qrCode,
        serial_number: input.serial_number || null,
        status: input.status || 'available',
        condition_notes: input.condition_notes || null,
      })
      .select()
      .single()

    if (toolError) throw toolError

    // Create electronic_device record
    const { data: electronicDevice, error: deviceError} = await supabase
      .from('electronic_devices')
      .insert({
        tool_instance_id: toolInstance.id,
        brand: input.brand || null,
        model: input.model || null,
        memory_capacity: input.memory_capacity || null,
        memory_unit: input.memory_unit || null,
      })
      .select()
      .single()

    if (deviceError) throw deviceError

    return {
      ...electronicDevice,
      tool_instance: { ...toolInstance, item_type: itemType },
      item_type: itemType,
    }
  },

  async update(
    id: number,
    input: UpdateElectronicDeviceInput
  ): Promise<ElectronicDeviceWithDetails> {
    // Get current device
    const currentDevice = await this.getById(id)
    if (!currentDevice) {
      throw new Error('Electronic device not found')
    }

    const toolInstance = currentDevice.tool_instance as unknown as ToolInstance & { item_type: ItemType }

    // Update tool_instance if needed
    if (
      input.name ||
      input.category ||
      input.description ||
      input.serial_number !== undefined ||
      input.status ||
      input.condition_notes !== undefined
    ) {
      // Update or create item_type if name/category changed
      let itemTypeId = toolInstance.item_type_id
      if (input.name || input.category) {
        const name = input.name || toolInstance.item_type.name
        const category = input.category || toolInstance.item_type.category

        const { data: existingItemType } = await supabase
          .from('item_types')
          .select('*')
          .eq('name', name)
          .eq('category', category)
          .eq('is_consumable', false)
          .single()

        if (existingItemType) {
          itemTypeId = existingItemType.id
        } else {
          const { data: newItemType, error: itemTypeError } = await supabase
            .from('item_types')
            .insert({
              name,
              description: input.description || toolInstance.item_type.description,
              category,
              is_consumable: false,
              default_loan_duration_days: 7,
            })
            .select()
            .single()

          if (itemTypeError) throw itemTypeError
          itemTypeId = newItemType.id

          // Invalidate cache
          const { invalidateCache } = await import('./cache')
          invalidateCache('item_type')
        }
      }

      // Update tool_instance
      const { error: toolError } = await supabase
        .from('tool_instances')
        .update({
          item_type_id: itemTypeId,
          serial_number: input.serial_number !== undefined ? input.serial_number : toolInstance.serial_number,
          status: input.status || toolInstance.status,
          condition_notes: input.condition_notes !== undefined ? input.condition_notes : toolInstance.condition_notes,
          updated_at: new Date().toISOString(),
          version: toolInstance.version + 1,
        })
        .eq('id', toolInstance.id)

      if (toolError) throw toolError
    }

    // Update electronic_device
    const { error: deviceError } = await supabase
      .from('electronic_devices')
      .update({
        brand: input.brand !== undefined ? input.brand : currentDevice.brand,
        model: input.model !== undefined ? input.model : currentDevice.model,
        memory_capacity: input.memory_capacity !== undefined ? input.memory_capacity : currentDevice.memory_capacity,
        memory_unit: input.memory_unit !== undefined ? input.memory_unit : currentDevice.memory_unit,
        updated_at: new Date().toISOString(),
        version: currentDevice.version + 1,
      })
      .eq('id', id)

    if (deviceError) throw deviceError

    // Return updated device
    const updatedDevice = await this.getById(id)
    if (!updatedDevice) {
      throw new Error('Failed to retrieve updated device')
    }

    return updatedDevice
  },

  async delete(id: number): Promise<void> {
    // Get device to find tool_instance_id
    const device = await this.getById(id)
    if (!device) {
      throw new Error('Electronic device not found')
    }

    const toolInstance = device.tool_instance as unknown as ToolInstance

    // Check for active loans
    const { data: activeLoan } = await supabase
      .from('loans')
      .select('id')
      .eq('tool_instance_id', toolInstance.id)
      .eq('status', 'active')
      .single()

    if (activeLoan) {
      throw new Error('Cannot delete device with active loan')
    }

    // Delete electronic_device (cascade will handle tool_instance)
    const { error } = await supabase
      .from('electronic_devices')
      .delete()
      .eq('id', id)

    if (error) throw error

    // Also delete tool_instance explicitly
    await supabase
      .from('tool_instances')
      .delete()
      .eq('id', toolInstance.id)
  },

  /**
   * Get item type by ID with category information
   * @param itemTypeId - Item type ID
   * @returns Item type with category_id or null
   */
  async getItemTypeById(itemTypeId: number): Promise<ItemType | null> {
    const { data, error } = await supabase
      .from('item_types')
      .select('*')
      .eq('id', itemTypeId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },
}

// Classroom operations
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

    // Total reservations
    const { count: totalReservations } = await supabase
      .from('classroom_reservations')
      .select('*', { count: 'exact', head: true })

    // Active reservations (pending or confirmed, not expired)
    const { count: activeReservations } = await supabase
      .from('classroom_reservations')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed'])
      .gte('end_datetime', now.toISOString())

    // Reservations this month
    const { count: reservationsThisMonth } = await supabase
      .from('classroom_reservations')
      .select('*', { count: 'exact', head: true })
      .gte('start_datetime', startOfMonth)
      .lte('start_datetime', endOfMonth)

    // Internet services count
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

  async delete(id: number): Promise<void> {
    // Prevent deletion if active assignments exist
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
    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}

// Device assignment operations
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

// Device combination operations
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
      // filter combinations where both devices have active assignments in classroom
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

    // Get device IDs to fetch their classroom assignments
    const combinations = data || []
    const deviceIds = new Set<number>()
    combinations.forEach(c => {
      deviceIds.add(c.device_1_id)
      deviceIds.add(c.device_2_id)
    })

    // Fetch active assignments for all devices
    const { data: assignments } = await supabase
      .from('device_assignments')
      .select(`
        electronic_device_id,
        classroom:classrooms(id, name, location)
      `)
      .in('electronic_device_id', Array.from(deviceIds))
      .eq('is_active', true)

    // Create a map of device ID to classroom
    const deviceClassroomMap: Record<number, { id: number; name: string; location?: string }> = {}
    assignments?.forEach((a: any) => {
      if (a.classroom) {
        // Handle both single object and array cases
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

    // Attach classroom info to combinations
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

// Classroom reservation operations
import type { 
  ClassroomReservation, 
  ClassroomReservationWithDetails, 
  CreateClassroomReservationInput, 
  UpdateClassroomReservationInput 
} from '@/types/classrooms'

export const classroomReservationOperations = {
  async create(input: CreateClassroomReservationInput, userId: number): Promise<ClassroomReservation> {
    // Check for overlapping reservations
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

// Classroom internet service operations
import type { 
  ClassroomInternetService, 
  CreateInternetServiceInput, 
  UpdateInternetServiceInput 
} from '@/types/classrooms'

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


// ============================================================================
// Evaluation System Operations
// Sistema de Evaluación de Aulas
// ============================================================================

import type {
  EvaluationTemplate,
  EvaluationTemplateWithQuestions,
  TemplateQuestion,
  ScheduledEvaluation,
  ScheduledEvaluationWithDetails,
  EvaluationResult,
  EvaluationResultWithResponses,
  EvaluationResponse,
  CreateTemplateInput,
  UpdateTemplateInput,
  CreateScheduledEvaluationInput,
  CreateEvaluationResultInput,
  SpaceType,
  EvaluationStatus,
} from '@/types/evaluations'

// Evaluation Template Operations
export const evaluationTemplateOperations = {
  /**
   * Get all active evaluation templates
   */
  async getAll(): Promise<EvaluationTemplate[]> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Get a template by ID with all its questions
   */
  async getById(id: number): Promise<EvaluationTemplateWithQuestions | null> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select(`
        *,
        questions:template_questions(*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    // Sort questions by display_order
    const questions = (data.questions || []).sort(
      (a: TemplateQuestion, b: TemplateQuestion) => a.display_order - b.display_order
    )

    return { ...data, questions }
  },

  /**
   * Create a new evaluation template with questions
   */
  async create(input: CreateTemplateInput, userId?: number): Promise<EvaluationTemplateWithQuestions> {
    // Validate at least one question
    if (!input.questions || input.questions.length === 0) {
      throw new Error('Template must have at least one question')
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('evaluation_templates')
      .insert({
        name: input.name,
        space_type: input.space_type,
        version: 1,
        is_active: true,
        created_by: userId || null,
      })
      .select()
      .single()

    if (templateError) throw templateError

    // Create questions
    const questionsToInsert = input.questions.map((q, index) => ({
      template_id: template.id,
      question_text: q.question_text,
      category: q.category,
      is_required: q.is_required,
      display_order: q.display_order ?? index,
    }))

    const { data: questions, error: questionsError } = await supabase
      .from('template_questions')
      .insert(questionsToInsert)
      .select()

    if (questionsError) throw questionsError

    return { ...template, questions: questions || [] }
  },

  /**
   * Update an existing template
   * If template has completed evaluations, creates a new version
   */
  async update(id: number, input: UpdateTemplateInput, userId?: number): Promise<EvaluationTemplateWithQuestions> {
    // Check if template has completed evaluations
    const { data: existingEvaluations } = await supabase
      .from('scheduled_evaluations')
      .select('id')
      .eq('template_id', id)
      .eq('status', 'completed')
      .limit(1)

    const hasCompletedEvaluations = existingEvaluations && existingEvaluations.length > 0

    if (hasCompletedEvaluations && input.questions) {
      // Create new version - deactivate old template
      await supabase
        .from('evaluation_templates')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      // Get current template for version info
      const { data: currentTemplate } = await supabase
        .from('evaluation_templates')
        .select('version, name, space_type')
        .eq('id', id)
        .single()

      // Create new template with incremented version
      const newTemplateInput: CreateTemplateInput = {
        name: input.name || currentTemplate?.name || '',
        space_type: input.space_type || currentTemplate?.space_type || 'training_room',
        questions: input.questions.map((q, index) => ({
          question_text: q.question_text,
          category: q.category,
          is_required: q.is_required,
          display_order: q.display_order ?? index,
        })),
      }

      const { data: newTemplate, error: newTemplateError } = await supabase
        .from('evaluation_templates')
        .insert({
          name: newTemplateInput.name,
          space_type: newTemplateInput.space_type,
          version: (currentTemplate?.version || 1) + 1,
          is_active: true,
          created_by: userId || null,
        })
        .select()
        .single()

      if (newTemplateError) throw newTemplateError

      // Create questions for new template
      const questionsToInsert = newTemplateInput.questions.map((q, index) => ({
        template_id: newTemplate.id,
        question_text: q.question_text,
        category: q.category,
        is_required: q.is_required,
        display_order: q.display_order ?? index,
      }))

      const { data: questions, error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionsToInsert)
        .select()

      if (questionsError) throw questionsError

      return { ...newTemplate, questions: questions || [] }
    }

    // No completed evaluations - update in place
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.name !== undefined) updateData.name = input.name
    if (input.space_type !== undefined) updateData.space_type = input.space_type
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data: template, error: templateError } = await supabase
      .from('evaluation_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (templateError) throw templateError

    // Update questions if provided
    if (input.questions) {
      // Delete existing questions
      await supabase
        .from('template_questions')
        .delete()
        .eq('template_id', id)

      // Insert new questions
      const questionsToInsert = input.questions.map((q, index) => ({
        template_id: id,
        question_text: q.question_text,
        category: q.category,
        is_required: q.is_required,
        display_order: q.display_order ?? index,
      }))

      const { data: questions, error: questionsError } = await supabase
        .from('template_questions')
        .insert(questionsToInsert)
        .select()

      if (questionsError) throw questionsError

      return { ...template, questions: questions || [] }
    }

    // Return template with existing questions
    const { data: questions } = await supabase
      .from('template_questions')
      .select('*')
      .eq('template_id', id)
      .order('display_order', { ascending: true })

    return { ...template, questions: questions || [] }
  },

  /**
   * Delete a template (only if no pending evaluations)
   */
  async delete(id: number): Promise<void> {
    // Check for pending evaluations
    const { data: pendingEvaluations } = await supabase
      .from('scheduled_evaluations')
      .select('id')
      .eq('template_id', id)
      .eq('status', 'pending')
      .limit(1)

    if (pendingEvaluations && pendingEvaluations.length > 0) {
      throw new Error('Cannot delete template with pending evaluations')
    }

    // Delete template (cascade will delete questions)
    const { error } = await supabase
      .from('evaluation_templates')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Get templates by space type
   */
  async getBySpaceType(spaceType: SpaceType): Promise<EvaluationTemplate[]> {
    const { data, error } = await supabase
      .from('evaluation_templates')
      .select('*')
      .eq('space_type', spaceType)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  },
}

// Template Question Operations
export const templateQuestionOperations = {
  /**
   * Get all questions for a template
   */
  async getByTemplateId(templateId: number): Promise<TemplateQuestion[]> {
    const { data, error } = await supabase
      .from('template_questions')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  /**
   * Create a new question for a template
   */
  async create(
    templateId: number,
    input: Omit<TemplateQuestion, 'id' | 'template_id' | 'created_at' | 'updated_at'>
  ): Promise<TemplateQuestion> {
    const { data, error } = await supabase
      .from('template_questions')
      .insert({
        template_id: templateId,
        question_text: input.question_text,
        category: input.category,
        is_required: input.is_required,
        display_order: input.display_order,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a question
   */
  async update(
    id: number,
    input: Partial<Omit<TemplateQuestion, 'id' | 'template_id' | 'created_at' | 'updated_at'>>
  ): Promise<TemplateQuestion> {
    const { data, error } = await supabase
      .from('template_questions')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a question
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('template_questions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Reorder questions within a template
   */
  async reorder(templateId: number, questionIds: number[]): Promise<void> {
    // Update each question's display_order
    const updates = questionIds.map((questionId, index) =>
      supabase
        .from('template_questions')
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq('id', questionId)
        .eq('template_id', templateId)
    )

    await Promise.all(updates)
  },
}

// Scheduled Evaluation Operations
export const scheduledEvaluationOperations = {
  /**
   * Get all scheduled evaluations with optional filters
   */
  async getAll(filters?: {
    status?: EvaluationStatus
    classroom_id?: number
    template_id?: number
    assigned_to?: number
  }): Promise<ScheduledEvaluationWithDetails[]> {
    let query = supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        classroom:classrooms(id, name, location, responsible_person),
        template:evaluation_templates(id, name, space_type),
        assigned_user:users!scheduled_evaluations_assigned_to_fkey(id, username, full_name),
        approver:users!scheduled_evaluations_approver_id_fkey(id, username, full_name)
      `)
      .order('scheduled_date', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.classroom_id) {
      query = query.eq('classroom_id', filters.classroom_id)
    }
    if (filters?.template_id) {
      query = query.eq('template_id', filters.template_id)
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    const { data, error } = await query
    if (error) throw error

    // Mark overdue evaluations
    const now = new Date()
    const results = (data || []).map((evaluation) => {
      const scheduledDate = new Date(evaluation.scheduled_date)
      if (evaluation.status === 'pending' && scheduledDate < now) {
        return { ...evaluation, status: 'overdue' as EvaluationStatus }
      }
      return evaluation
    })

    return results as unknown as ScheduledEvaluationWithDetails[]
  },

  /**
   * Get a scheduled evaluation by ID
   */
  async getById(id: number): Promise<ScheduledEvaluationWithDetails | null> {
    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        classroom:classrooms(id, name, location, responsible_person, responsible_user_id),
        template:evaluation_templates(id, name, space_type),
        assigned_user:users!scheduled_evaluations_assigned_to_fkey(id, username, full_name),
        approver:users!scheduled_evaluations_approver_id_fkey(id, username, full_name)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    // Check if overdue
    const now = new Date()
    const scheduledDate = new Date(data.scheduled_date)
    if (data.status === 'pending' && scheduledDate < now) {
      data.status = 'overdue'
    }

    // Get result if exists
    const { data: result } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('scheduled_evaluation_id', id)
      .single()

    return { ...data, result: result || undefined } as unknown as ScheduledEvaluationWithDetails
  },

  /**
   * Create a new scheduled evaluation
   */
  async create(input: CreateScheduledEvaluationInput, userId?: number): Promise<ScheduledEvaluation> {
    // Validate required fields
    if (!input.classroom_id || !input.template_id || !input.scheduled_date) {
      throw new Error('Missing required fields: classroom_id, template_id, and scheduled_date are required')
    }

    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .insert({
        classroom_id: input.classroom_id,
        template_id: input.template_id,
        scheduled_date: input.scheduled_date,
        status: 'pending',
        created_by: userId || null,
        assigned_to: input.assigned_to || null,
        approver_id: input.approver_id || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a scheduled evaluation (only if pending)
   */
  async update(
    id: number,
    input: Partial<Pick<ScheduledEvaluation, 'scheduled_date' | 'template_id'>>
  ): Promise<ScheduledEvaluation> {
    // Check current status
    const { data: current } = await supabase
      .from('scheduled_evaluations')
      .select('status')
      .eq('id', id)
      .single()

    if (current?.status !== 'pending') {
      throw new Error('Only pending evaluations can be edited')
    }

    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete (cancel) a scheduled evaluation
   */
  async delete(id: number): Promise<void> {
    // Soft delete by changing status to cancelled
    const { error } = await supabase
      .from('scheduled_evaluations')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  /**
   * Get evaluations by date range (for calendar view)
   */
  async getByDateRange(startDate: string, endDate: string): Promise<ScheduledEvaluationWithDetails[]> {
    const { data, error } = await supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        classroom:classrooms(id, name, location, responsible_person),
        template:evaluation_templates(id, name, space_type)
      `)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true })

    if (error) throw error

    // Mark overdue evaluations
    const now = new Date()
    const results = (data || []).map((evaluation) => {
      const scheduledDate = new Date(evaluation.scheduled_date)
      if (evaluation.status === 'pending' && scheduledDate < now) {
        return { ...evaluation, status: 'overdue' as EvaluationStatus }
      }
      return evaluation
    })

    return results as unknown as ScheduledEvaluationWithDetails[]
  },

  /**
   * Get evaluations by classroom
   */
  async getByClassroom(classroomId: number): Promise<ScheduledEvaluationWithDetails[]> {
    return this.getAll({ classroom_id: classroomId })
  },
}

// Evaluation Result Operations
export const evaluationResultOperations = {
  /**
   * Create a new evaluation result with responses
   */
  async create(input: CreateEvaluationResultInput, evaluatorId: number): Promise<EvaluationResult> {
    // Get the scheduled evaluation and template questions
    const { data: scheduledEval } = await supabase
      .from('scheduled_evaluations')
      .select(`
        *,
        template:evaluation_templates(
          *,
          questions:template_questions(*)
        )
      `)
      .eq('id', input.scheduled_evaluation_id)
      .single()

    if (!scheduledEval) {
      throw new Error('Scheduled evaluation not found')
    }

    const template = scheduledEval.template as unknown as EvaluationTemplateWithQuestions
    const questions = template.questions || []

    // Validate required questions if not a draft
    if (!input.is_draft) {
      const requiredQuestionIds = questions
        .filter((q: TemplateQuestion) => q.is_required)
        .map((q: TemplateQuestion) => q.id)

      const answeredQuestionIds = input.responses.map((r) => r.question_id)
      const missingRequired = requiredQuestionIds.filter(
        (id: number) => !answeredQuestionIds.includes(id)
      )

      if (missingRequired.length > 0) {
        throw new Error('Missing required responses')
      }
    }

    // Calculate scores
    let totalScore = 0
    let maxPossibleScore = 0
    const categoryScores = {
      organization: { score: 0, max: 0 },
      cleanliness: { score: 0, max: 0 },
      maintenance: { score: 0, max: 0 },
    }

    input.responses.forEach((response) => {
      const question = questions.find((q: TemplateQuestion) => q.id === response.question_id)
      if (!question) return

      if (response.response !== 'not_applicable') {
        maxPossibleScore++
        categoryScores[question.category].max++

        if (response.response === 'yes') {
          totalScore++
          categoryScores[question.category].score++
        }
      }
    })

    const scorePercentage = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
      : 0

    // Create result
    const { data: result, error: resultError } = await supabase
      .from('evaluation_results')
      .insert({
        scheduled_evaluation_id: input.scheduled_evaluation_id,
        evaluator_id: evaluatorId,
        completed_at: new Date().toISOString(),
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        score_percentage: scorePercentage,
        organization_score: categoryScores.organization.score,
        organization_max: categoryScores.organization.max,
        cleanliness_score: categoryScores.cleanliness.score,
        cleanliness_max: categoryScores.cleanliness.max,
        maintenance_score: categoryScores.maintenance.score,
        maintenance_max: categoryScores.maintenance.max,
        is_draft: input.is_draft || false,
      })
      .select()
      .single()

    if (resultError) throw resultError

    // Create responses
    const responsesToInsert = input.responses.map((r) => ({
      result_id: result.id,
      question_id: r.question_id,
      response: r.response,
      observation: r.observation || null,
    }))

    const { error: responsesError } = await supabase
      .from('evaluation_responses')
      .insert(responsesToInsert)

    if (responsesError) throw responsesError

    // Update scheduled evaluation status if not a draft
    if (!input.is_draft) {
      await supabase
        .from('scheduled_evaluations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.scheduled_evaluation_id)
    }

    return result
  },

  /**
   * Update an existing evaluation result (for drafts)
   */
  async update(id: number, input: CreateEvaluationResultInput): Promise<EvaluationResult> {
    // Get current result
    const { data: currentResult } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('id', id)
      .single()

    if (!currentResult) {
      throw new Error('Evaluation result not found')
    }

    if (!currentResult.is_draft) {
      throw new Error('Cannot update a completed evaluation')
    }

    // Delete existing responses
    await supabase
      .from('evaluation_responses')
      .delete()
      .eq('result_id', id)

    // Get template questions for score calculation
    const { data: scheduledEval } = await supabase
      .from('scheduled_evaluations')
      .select(`
        template:evaluation_templates(
          questions:template_questions(*)
        )
      `)
      .eq('id', currentResult.scheduled_evaluation_id)
      .single()

    const template = scheduledEval?.template as unknown as { questions: TemplateQuestion[] }
    const questions = template?.questions || []

    // Calculate scores
    let totalScore = 0
    let maxPossibleScore = 0
    const categoryScores = {
      organization: { score: 0, max: 0 },
      cleanliness: { score: 0, max: 0 },
      maintenance: { score: 0, max: 0 },
    }

    input.responses.forEach((response) => {
      const question = questions.find((q) => q.id === response.question_id)
      if (!question) return

      if (response.response !== 'not_applicable') {
        maxPossibleScore++
        categoryScores[question.category].max++

        if (response.response === 'yes') {
          totalScore++
          categoryScores[question.category].score++
        }
      }
    })

    const scorePercentage = maxPossibleScore > 0
      ? Math.round((totalScore / maxPossibleScore) * 10000) / 100
      : 0

    // Update result
    const { data: result, error: resultError } = await supabase
      .from('evaluation_results')
      .update({
        completed_at: new Date().toISOString(),
        total_score: totalScore,
        max_possible_score: maxPossibleScore,
        score_percentage: scorePercentage,
        organization_score: categoryScores.organization.score,
        organization_max: categoryScores.organization.max,
        cleanliness_score: categoryScores.cleanliness.score,
        cleanliness_max: categoryScores.cleanliness.max,
        maintenance_score: categoryScores.maintenance.score,
        maintenance_max: categoryScores.maintenance.max,
        is_draft: input.is_draft || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (resultError) throw resultError

    // Create new responses
    const responsesToInsert = input.responses.map((r) => ({
      result_id: id,
      question_id: r.question_id,
      response: r.response,
      observation: r.observation || null,
    }))

    const { error: responsesError } = await supabase
      .from('evaluation_responses')
      .insert(responsesToInsert)

    if (responsesError) throw responsesError

    // Update scheduled evaluation status if not a draft
    if (!input.is_draft) {
      await supabase
        .from('scheduled_evaluations')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentResult.scheduled_evaluation_id)
    }

    return result
  },

  /**
   * Get result by scheduled evaluation ID
   */
  async getByScheduledId(scheduledEvaluationId: number): Promise<EvaluationResultWithResponses | null> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        responses:evaluation_responses(
          *,
          question:template_questions(*)
        )
      `)
      .eq('scheduled_evaluation_id', scheduledEvaluationId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as EvaluationResultWithResponses | null
  },

  /**
   * Get results by classroom (for history)
   */
  async getByClassroom(
    classroomId: number,
    filters?: { start_date?: string; end_date?: string }
  ): Promise<EvaluationResultWithResponses[]> {
    let query = supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        scheduled_evaluation:scheduled_evaluations!inner(
          classroom_id,
          scheduled_date,
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .eq('scheduled_evaluation.classroom_id', classroomId)
      .eq('is_draft', false)
      .order('completed_at', { ascending: false })

    if (filters?.start_date) {
      query = query.gte('completed_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('completed_at', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as EvaluationResultWithResponses[]
  },

  /**
   * Get results by responsible person
   */
  async getByResponsible(
    responsiblePerson: string,
    filters?: { start_date?: string; end_date?: string }
  ): Promise<EvaluationResultWithResponses[]> {
    // First get classrooms for this responsible person
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id')
      .eq('responsible_person', responsiblePerson)

    if (!classrooms || classrooms.length === 0) {
      return []
    }

    const classroomIds = classrooms.map((c) => c.id)

    let query = supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        scheduled_evaluation:scheduled_evaluations!inner(
          classroom_id,
          scheduled_date,
          classroom:classrooms(id, name, location, responsible_person),
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .in('scheduled_evaluation.classroom_id', classroomIds)
      .eq('is_draft', false)
      .order('completed_at', { ascending: false })

    if (filters?.start_date) {
      query = query.gte('completed_at', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('completed_at', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as EvaluationResultWithResponses[]
  },

  /**
   * Get result by ID
   */
  async getById(id: number): Promise<EvaluationResult | null> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as EvaluationResult | null
  },

  /**
   * Get result by ID with full details for approval review
   */
  async getByIdWithDetails(id: number): Promise<EvaluationResultWithResponses | null> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        approver:users!evaluation_results_approved_by_fkey(id, username, full_name),
        responses:evaluation_responses(
          *,
          question:template_questions(*)
        ),
        scheduled_evaluation:scheduled_evaluations(
          *,
          classroom:classrooms(id, name, location, responsible_person),
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data as unknown as EvaluationResultWithResponses | null
  },

  /**
   * Update approval status of an evaluation result
   */
  async updateApproval(
    id: number,
    approvalStatus: 'approved' | 'rejected',
    approvedBy: number,
    comments?: string
  ): Promise<EvaluationResult> {
    const { data, error } = await supabase
      .from('evaluation_results')
      .update({
        approval_status: approvalStatus,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approval_comments: comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as EvaluationResult
  },

  /**
   * Get evaluations pending approval for a specific approver
   */
  async getPendingApproval(approverId?: number): Promise<EvaluationResultWithResponses[]> {
    let query = supabase
      .from('evaluation_results')
      .select(`
        *,
        evaluator:users!evaluation_results_evaluator_id_fkey(id, username, full_name),
        scheduled_evaluation:scheduled_evaluations!inner(
          *,
          classroom:classrooms(id, name, location, responsible_person),
          template:evaluation_templates(id, name, space_type)
        )
      `)
      .eq('is_draft', false)
      .eq('approval_status', 'pending')
      .order('completed_at', { ascending: false })

    // If approver ID is provided, filter by evaluations where this user is the designated approver
    if (approverId) {
      query = query.eq('scheduled_evaluation.approver_id', approverId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as unknown as EvaluationResultWithResponses[]
  },
}

// Evaluation Response Operations
export const evaluationResponseOperations = {
  /**
   * Create multiple responses in batch
   */
  async createBatch(
    resultId: number,
    responses: Array<{
      question_id: number
      response: 'yes' | 'no' | 'not_applicable'
      observation?: string
    }>
  ): Promise<EvaluationResponse[]> {
    const responsesToInsert = responses.map((r) => ({
      result_id: resultId,
      question_id: r.question_id,
      response: r.response,
      observation: r.observation || null,
    }))

    const { data, error } = await supabase
      .from('evaluation_responses')
      .insert(responsesToInsert)
      .select()

    if (error) throw error
    return data || []
  },

  /**
   * Get all responses for a result
   */
  async getByResultId(resultId: number): Promise<EvaluationResponse[]> {
    const { data, error } = await supabase
      .from('evaluation_responses')
      .select(`
        *,
        question:template_questions(*)
      `)
      .eq('result_id', resultId)
      .order('question_id', { ascending: true })

    if (error) throw error
    return data || []
  },
}
