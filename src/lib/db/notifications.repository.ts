import { supabase } from '../supabase'
import { supabaseAdmin } from '../supabase-admin'
import type {
  Notification,
  CreateNotificationInput,
} from '@/types/database'
import type {
  NotificationPreferences,
  NotificationFilter,
} from '@/types/notifications'

const dbClient = supabaseAdmin || supabase

// Notification operations
export const notificationOperations = {
  async getByUserId(
    userId: number, 
    filters?: NotificationFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Notification[]; total: number; unread_count: number }> {
    try {
      let query = dbClient
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

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

      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, error, count } = await query
      
      if (error) {
        console.warn('Notifications query error (returning empty):', error.message)
        return {
          data: [],
          total: 0,
          unread_count: 0,
        }
      }

      const { count: unreadCount, error: unreadError } = await dbClient
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
      return {
        data: [],
        total: 0,
        unread_count: 0,
      }
    }
  },

  async getUnreadByUserId(userId: number): Promise<Notification[]> {
    const { data, error } = await dbClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await dbClient
      .from('notifications')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async markAsRead(id: number): Promise<Notification> {
    const { data, error } = await dbClient
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
    const { error } = await dbClient
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
    const { error } = await dbClient
      .from('notifications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
}

// Notification preferences operations
export const notificationPreferencesOperations = {
  async getByUserId(userId: number): Promise<NotificationPreferences | null> {
    const { data, error } = await dbClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  async create(userId: number): Promise<NotificationPreferences> {
    const { data, error } = await dbClient
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(userId: number, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data, error } = await dbClient
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
