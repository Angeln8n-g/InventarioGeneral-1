import { supabase } from '../supabase'
import { supabaseAdmin } from '../supabase-admin'
import type {
  AuditLog,
  CreateAuditLogInput,
  AuditLogFilters,
} from '@/types/database'

const dbClient = supabaseAdmin || supabase

export const auditLogOperations = {
  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    const { data, error } = await dbClient
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
    let query = dbClient
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

  async getCursorPaginated(params: {
    limit?: number
    cursorCreatedAt?: string
    cursorId?: number
    entityType?: string
    action?: string
  }): Promise<{ items: AuditLog[]; nextCursor: { createdAt: string; id: number } | null }> {
    const limit = params.limit || 20
    let query = dbClient
      .from('audit_logs')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1)

    if (params.cursorCreatedAt) {
      query = query.lt('created_at', params.cursorCreatedAt)
    }
    if (params.entityType) {
      query = query.eq('entity_type', params.entityType)
    }
    if (params.action) {
      query = query.eq('action', params.action)
    }

    const { data, error } = await query
    if (error) throw error

    const items = data || []
    const hasNext = items.length > limit
    const returnItems = hasNext ? items.slice(0, limit) : items

    const lastItem = returnItems[returnItems.length - 1]
    const nextCursor = (hasNext && lastItem) ? {
      createdAt: lastItem.created_at,
      id: lastItem.id
    } : null

    return {
      items: returnItems,
      nextCursor
    }
  }
}
