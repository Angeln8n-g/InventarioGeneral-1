import { supabase } from '../supabase'
import { v4 as uuidv4 } from 'uuid'
import type {
  ItemType,
  ToolInstance,
  CreateItemTypeInput,
  UpdateItemTypeInput,
  CreateToolInstanceInput,
  UpdateToolInstanceInput,
  ToolFilters,
} from '@/types/database'

// UUID validation utility - Accepts both standard UUIDs and custom QR codes
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const customQRRegex = /^(QR|SN|CONSUMABLE)-\d+-[a-z0-9]+$/i
  
  return uuidRegex.test(uuid) || customQRRegex.test(uuid)
}

// Generate UUID for new tool instances
export const generateToolUUID = (): string => {
  return uuidv4()
}

// Item type operations
export const itemTypeOperations = {
  async getAll(includeDeleted = false): Promise<ItemType[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('../cache')
    
    return withCache(
      CacheKeys.ITEM_TYPES_ALL,
      async () => {
        let query = supabase
          .from('item_types')
          .select('*')
          .order('name')
        
        if (!includeDeleted) {
          query = query.is('deleted_at', null)
        }
        
        const { data, error } = await query
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG
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
    const { withCache, CacheKeys, CacheTTL } = await import('../cache')
    
    return withCache(
      CacheKeys.ITEM_TYPES_CONSUMABLES,
      async () => {
        const { data, error } = await supabase
          .from('item_types')
          .select('*')
          .eq('is_consumable', true)
          .is('deleted_at', null)
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG
    )
  },

  async getTools(): Promise<ItemType[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('../cache')
    
    return withCache(
      CacheKeys.ITEM_TYPES_TOOLS,
      async () => {
        const { data, error } = await supabase
          .from('item_types')
          .select('*')
          .eq('is_consumable', false)
          .is('deleted_at', null)
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG
    )
  },

  async create(input: CreateItemTypeInput): Promise<ItemType> {
    const { data, error } = await supabase
      .from('item_types')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    
    const { invalidateCache } = await import('../cache')
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
    
    const { invalidateCache } = await import('../cache')
    invalidateCache('item_type')
    
    return data
  },

  async delete(id: number, softDelete = true): Promise<void> {
    if (softDelete) {
      const { error } = await supabase
        .from('item_types')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('item_types')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
    
    const { invalidateCache } = await import('../cache')
    invalidateCache('item_type')
  },
}

// Tool instance operations
export const toolInstanceOperations = {
  async getAll(filters?: ToolFilters, includeDeleted = false): Promise<ToolInstance[]> {
    let query = supabase
      .from('tool_instances')
      .select(`
        *,
        item_type:item_types(*)
      `)
      .order('created_at', { ascending: false })

    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.item_type_id) {
      query = query.eq('item_type_id', filters.item_type_id)
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
    if (!input.qr_code) {
      input.qr_code = generateToolUUID()
    }

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

  async delete(id: number, softDelete = true): Promise<void> {
    if (softDelete) {
      const { error } = await supabase
        .from('tool_instances')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('tool_instances')
        .delete()
        .eq('id', id)
      if (error) throw error
    }
  },
}
