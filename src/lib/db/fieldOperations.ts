import { supabase } from '../supabase'
import type {
  CategoryField,
  CreateCategoryFieldInput,
  UpdateCategoryFieldInput,
} from '@/types/database'
import { validateFieldConfiguration, isFieldNameUnique } from '../validation/fieldValidation'

/**
 * Field configuration operations for category fields
 */
export const fieldOperations = {
  /**
   * Get all fields for a category
   * @param categoryId - Category ID
   * @returns Array of category fields sorted by display_order
   */
  async getByCategory(categoryId: number): Promise<CategoryField[]> {
    const { data, error } = await supabase
      .from('category_fields')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order')
    
    if (error) throw error
    return data || []
  },

  /**
   * Get a field by ID
   * @param id - Field ID
   * @returns Category field or null if not found
   */
  async getById(id: number): Promise<CategoryField | null> {
    const { data, error } = await supabase
      .from('category_fields')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Get all custom fields for a category
   * @param categoryId - Category ID
   * @returns Array of custom category fields
   */
  async getCustomFields(categoryId: number): Promise<CategoryField[]> {
    const { data, error } = await supabase
      .from('category_fields')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_custom', true)
      .order('display_order')
    
    if (error) throw error
    return data || []
  },

  /**
   * Get all standard (non-custom) fields for a category
   * @param categoryId - Category ID
   * @returns Array of standard category fields
   */
  async getStandardFields(categoryId: number): Promise<CategoryField[]> {
    const { data, error } = await supabase
      .from('category_fields')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_custom', false)
      .order('display_order')
    
    if (error) throw error
    return data || []
  },

  /**
   * Get all required fields for a category
   * @param categoryId - Category ID
   * @returns Array of required category fields
   */
  async getRequiredFields(categoryId: number): Promise<CategoryField[]> {
    const { data, error } = await supabase
      .from('category_fields')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_required', true)
      .order('display_order')
    
    if (error) throw error
    return data || []
  },

  /**
   * Create a new field configuration
   * @param input - Field creation input
   * @returns Created category field
   */
  async create(input: CreateCategoryFieldInput): Promise<CategoryField> {
    // Validate input
    const existingFields = await this.getByCategory(input.category_id)
    const validation = validateFieldConfiguration(input as unknown as Record<string, unknown>, existingFields)
    
    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join(', '))
    }
    
    const { data, error } = await supabase
      .from('category_fields')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('category_fields')
    
    return data
  },

  /**
   * Update a field configuration
   * @param id - Field ID
   * @param input - Field update input
   * @returns Updated category field
   */
  async update(id: number, input: UpdateCategoryFieldInput): Promise<CategoryField> {
    // Get current field
    const current = await this.getById(id)
    if (!current) {
      throw new Error('Field not found')
    }
    
    // Validate input if field_name is being changed
    if (input.field_name && input.field_name !== current.field_name) {
      const existingFields = await this.getByCategory(current.category_id)
      const validation = validateFieldConfiguration(
        { ...input, category_id: current.category_id, id } as unknown as Record<string, unknown>,
        existingFields
      )
      
      if (!validation.isValid) {
        throw new Error(validation.errors.map(e => e.message).join(', '))
      }
    }
    
    const { data, error } = await supabase
      .from('category_fields')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('category_fields')
    
    return data
  },

  /**
   * Delete a field configuration
   * @param id - Field ID
   * @throws Error if field is in use by devices
   */
  async delete(id: number): Promise<void> {
    // Check if field is in use
    const usageCount = await this.getUsageCount(id)
    if (usageCount > 0) {
      throw new Error(`Cannot delete field that is used by ${usageCount} device(s). Please remove the field values first.`)
    }
    
    const { error } = await supabase
      .from('category_fields')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('category_fields')
  },

  /**
   * Get the number of devices using a field
   * @param fieldId - Field ID
   * @returns Number of devices
   */
  async getUsageCount(fieldId: number): Promise<number> {
    const { count, error } = await supabase
      .from('device_custom_fields')
      .select('*', { count: 'exact', head: true })
      .eq('field_id', fieldId)
    
    if (error) throw error
    return count || 0
  },

  /**
   * Check if a field name is unique within a category
   * @param fieldName - Field name
   * @param categoryId - Category ID
   * @param excludeId - Optional field ID to exclude from check
   * @returns true if field name is unique, false otherwise
   */
  async isNameUnique(fieldName: string, categoryId: number, excludeId?: number): Promise<boolean> {
    const existingFields = await this.getByCategory(categoryId)
    return isFieldNameUnique(fieldName, categoryId, existingFields, excludeId)
  },

  /**
   * Reorder fields within a category
   * @param categoryId - Category ID
   * @param fieldOrders - Array of {id, display_order} objects
   */
  async reorder(categoryId: number, fieldOrders: Array<{ id: number; display_order: number }>): Promise<void> {
    // Update each field's display_order
    const updates = fieldOrders.map(({ id, display_order }) =>
      supabase
        .from('category_fields')
        .update({ display_order, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('category_id', categoryId)
    )
    
    await Promise.all(updates)
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('category_fields')
  },

  /**
   * Bulk create fields for a category
   * @param categoryId - Category ID
   * @param fields - Array of field creation inputs
   * @returns Array of created category fields
   */
  async bulkCreate(categoryId: number, fields: Omit<CreateCategoryFieldInput, 'category_id'>[]): Promise<CategoryField[]> {
    const fieldsWithCategory = fields.map(field => ({
      ...field,
      category_id: categoryId
    }))
    
    const { data, error } = await supabase
      .from('category_fields')
      .insert(fieldsWithCategory)
      .select()
    
    if (error) throw error
    
    // Invalidate cache
    const { invalidateCache } = await import('../cache')
    invalidateCache('category_fields')
    
    return data || []
  },
}
