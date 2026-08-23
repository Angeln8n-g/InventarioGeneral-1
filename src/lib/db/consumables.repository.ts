import { supabase } from '../supabase'
import type {
  ConsumableStock,
  ConsumableRequest,
  ConsumableReservation,
  ReservationDetails,
  CreateConsumableRequestInput,
  UpdateConsumableRequestInput,
  CreateReservationInput,
  UpdateReservationInput,
  ReservationFilters,
} from '@/types/database'

// Consumable stock operations
export const consumableStockOperations = {
  async getAll(): Promise<ConsumableStock[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('../cache')
    
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
        
        const sortedData = (data || []).sort((a, b) => {
          const nameA = a.item_type?.name || ''
          const nameB = b.item_type?.name || ''
          return nameA.localeCompare(nameB)
        })
        
        return sortedData
      },
      CacheTTL.MEDIUM
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
    
    const { invalidateCache } = await import('../cache')
    invalidateCache('consumable_stock')
    
    return data
  },

  async adjustStock(id: number, adjustment: number): Promise<ConsumableStock> {
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
    
    const { invalidateCache } = await import('../cache')
    invalidateCache('consumable_stock')
    
    return data
  },

  async consumeAtomic(
    stockId: number,
    userId: number,
    quantity: number,
    notes?: string,
    startMarker?: number,
    endMarker?: number
  ) {
    const { data, error } = await supabase.rpc('consume_consumable_atomic', {
      p_stock_id: stockId,
      p_user_id: userId,
      p_quantity: quantity,
      p_notes: notes || null,
      p_start_marker: startMarker || null,
      p_end_marker: endMarker || null,
    })

    if (error) throw error

    const { invalidateCache } = await import('../cache')
    invalidateCache('consumable')

    return data
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

    if (filters?.limit) {
      if (filters.offset !== undefined) {
        query = query.range(filters.offset, filters.offset + filters.limit - 1)
      } else {
        query = query.limit(filters.limit)
      }
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

    const { invalidateCache } = await import('../cache')
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

    const { invalidateCache } = await import('../cache')
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

    const { invalidateCache } = await import('../cache')
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
