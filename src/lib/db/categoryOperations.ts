import { supabase } from '../supabase'
import type {
  DeviceCategory,
  DeviceCategoryWithCount,
  CreateDeviceCategoryInput,
  UpdateDeviceCategoryInput,
} from '@/types/database'
import { validateCategoryInput, isCategoryNameUnique } from '../validation/categoryValidation'

/**
 * Category operations for device categories
 */
export const categoryOperations = {
  /**
   * Get all device categories
   * @returns Array of all device categories
   */
  async getAll(): Promise<DeviceCategory[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('../cache')
    
    return withCache(
      CacheKeys.DEVICE_CATEGORIES_ALL,
      async () => {
        const { data, error } = await supabase
          .from('device_categories')
          .select('*')
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG // 15 minutos
    )
  },

  /**
   * Get all active device categories
   * @returns Array of active device categories
   */
  async getActive(): Promise<DeviceCategory[]> {
    const { withCache, CacheKeys, CacheTTL } = await import('../cache')
    
    return withCache(
      CacheKeys.DEVICE_CATEGORIES_ACTIVE,
      async () => {
        const { data, error } = await supabase
          .from('device_categories')
          .select('*')
          .eq('is_active', true)
          .order('name')
        
        if (error) throw error
        return data || []
      },
      CacheTTL.LONG // 15 minutos
    )
  },

  /**
   * Get all device categories with device counts
   * @returns Array of device categories with device counts
   */
  async getAllWithCounts(): Promise<DeviceCategoryWithCount[]> {
    // First get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('device_categories')
      .select('*')
      .order('name')
    
    if (categoriesError) throw categoriesError
    
    // For now, return categories with 0 device count
    // Device count will be calculated when we have the relationship set up
    return (categories || []).map(category => ({
      ...category,
      device_count: 0
    }))
  },

  /**
   * Get a device category by ID
   * @param id - Category ID
   * @returns Device category or null if not found
   */
  async getById(id: number): Promise<DeviceCategory | null> {
    const { data, error } = await supabase
      .from('device_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Get a device category by name (case-insensitive)
   * @param name - Category name
   * @returns Device category or null if not found
   */
  async getByName(name: string): Promise<DeviceCategory | null> {
    const { data, error } = await supabase
      .from('device_categories')
      .select('*')
      .ilike('name', name)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Create a new device category
   * @param input - Category creation input
   * @returns Created device category
   */
  async create(input: CreateDeviceCategoryInput): Promise<DeviceCategory> {
    // Validate input
    const existingCategories = await this.getAll()
    const validation = validateCategoryInput(input as unknown as Record<string, unknown>, existingCategories)
    
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '))
    }
    
    const { data, error } = await supabase
      .from('device_categories')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('device_categories')
    
    return data
  },

  /**
   * Update a device category
   * @param id - Category ID
   * @param input - Category update input
   * @returns Updated device category
   */
  async update(id: number, input: UpdateDeviceCategoryInput): Promise<DeviceCategory> {
    // Get current category
    const current = await this.getById(id)
    if (!current) {
      throw new Error('Category not found')
    }
    
    // Validate input if name is being changed
    if (input.name && input.name !== current.name) {
      const existingCategories = await this.getAll()
      const validation = validateCategoryInput(
        { ...input, id } as unknown as Record<string, unknown>,
        existingCategories
      )
      
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }
    }
    
    // Get current version for optimistic locking
    const { data, error } = await supabase
      .from('device_categories')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
        version: current.version + 1
      })
      .eq('id', id)
      .eq('version', current.version) // Optimistic locking
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('Category was modified by another user. Please refresh and try again.')
      }
      throw error
    }
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('device_categories')
    
    return data
  },

  /**
   * Delete a device category
   * @param id - Category ID
   * @throws Error if category has devices
   */
  async delete(id: number): Promise<void> {
    // Check if category has devices
    const deviceCount = await this.getDeviceCount(id)
    if (deviceCount > 0) {
      throw new Error(`Cannot delete category with ${deviceCount} device(s). Please reassign or delete the devices first.`)
    }
    
    const { error } = await supabase
      .from('device_categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('device_categories')
  },

  /**
   * Get the number of devices using a category
   * @param categoryId - Category ID
   * @returns Number of devices
   */
  async getDeviceCount(categoryId: number): Promise<number> {
    const { count, error } = await supabase
      .from('item_types')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
    
    if (error) throw error
    return count || 0
  },

  /**
   * Check if a category name is unique
   * @param name - Category name
   * @param excludeId - Optional category ID to exclude from check
   * @returns true if name is unique, false otherwise
   */
  async isNameUnique(name: string, excludeId?: number): Promise<boolean> {
    const existingCategories = await this.getAll()
    return isCategoryNameUnique(name, existingCategories, excludeId)
  },

  /**
   * Soft delete a category (set is_active to false)
   * @param id - Category ID
   * @returns Updated device category
   */
  async softDelete(id: number): Promise<DeviceCategory> {
    return this.update(id, { is_active: false })
  },

  /**
   * Restore a soft-deleted category
   * @param id - Category ID
   * @returns Updated device category
   */
  async restore(id: number): Promise<DeviceCategory> {
    return this.update(id, { is_active: true })
  },
}
