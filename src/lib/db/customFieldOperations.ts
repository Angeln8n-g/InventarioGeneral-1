import { supabase } from '../supabase'
import type {
  DeviceCustomField,
  DeviceCustomFieldWithDetails,
  CreateDeviceCustomFieldInput,
  UpdateDeviceCustomFieldInput,
} from '@/types/database'

/**
 * Custom field operations for device custom fields
 */
export const customFieldOperations = {
  /**
   * Get all custom fields for a device
   * @param deviceId - Electronic device ID
   * @returns Array of device custom fields with field details
   */
  async getByDevice(deviceId: number): Promise<DeviceCustomFieldWithDetails[]> {
    const { data, error } = await supabase
      .from('device_custom_fields')
      .select(`
        *,
        field:category_fields(*)
      `)
      .eq('electronic_device_id', deviceId)
      .order('field(display_order)')
    
    if (error) throw error
    return data || []
  },

  /**
   * Get a custom field by ID
   * @param id - Custom field ID
   * @returns Device custom field or null if not found
   */
  async getById(id: number): Promise<DeviceCustomField | null> {
    const { data, error } = await supabase
      .from('device_custom_fields')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Get a custom field by device and field ID
   * @param deviceId - Electronic device ID
   * @param fieldId - Category field ID
   * @returns Device custom field or null if not found
   */
  async getByDeviceAndField(deviceId: number, fieldId: number): Promise<DeviceCustomField | null> {
    const { data, error } = await supabase
      .from('device_custom_fields')
      .select('*')
      .eq('electronic_device_id', deviceId)
      .eq('field_id', fieldId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  /**
   * Create a new custom field value
   * @param input - Custom field creation input
   * @returns Created device custom field
   */
  async create(input: CreateDeviceCustomFieldInput): Promise<DeviceCustomField> {
    // Validate that the field exists and belongs to the device's category
    const { data: field, error: fieldError } = await supabase
      .from('category_fields')
      .select('id, category_id')
      .eq('id', input.field_id)
      .single()
    
    if (fieldError || !field) {
      throw new Error('Field not found')
    }
    
    // Validate that the device exists and belongs to the same category
    const { data: device, error: deviceError } = await supabase
      .from('electronic_devices')
      .select(`
        id,
        tool_instance:tool_instances(
          item_type:item_types(category_id)
        )
      `)
      .eq('id', input.electronic_device_id)
      .single()
    
    if (deviceError || !device) {
      throw new Error('Device not found')
    }
    
    // Check if custom field already exists
    const existing = await this.getByDeviceAndField(input.electronic_device_id, input.field_id)
    if (existing) {
      throw new Error('Custom field already exists for this device')
    }
    
    const { data, error } = await supabase
      .from('device_custom_fields')
      .insert(input)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update a custom field value
   * @param id - Custom field ID
   * @param input - Custom field update input
   * @returns Updated device custom field
   */
  async update(id: number, input: UpdateDeviceCustomFieldInput): Promise<DeviceCustomField> {
    const { data, error } = await supabase
      .from('device_custom_fields')
      .update({
        ...input,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update or create a custom field value (upsert)
   * @param deviceId - Electronic device ID
   * @param fieldId - Category field ID
   * @param fieldValue - Field value
   * @returns Device custom field
   */
  async upsert(deviceId: number, fieldId: number, fieldValue: unknown): Promise<DeviceCustomField> {
    const existing = await this.getByDeviceAndField(deviceId, fieldId)
    
    if (existing) {
      return this.update(existing.id, { field_value: fieldValue })
    } else {
      return this.create({
        electronic_device_id: deviceId,
        field_id: fieldId,
        field_value: fieldValue
      })
    }
  },

  /**
   * Delete a custom field value
   * @param id - Custom field ID
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('device_custom_fields')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  /**
   * Delete all custom fields for a device
   * @param deviceId - Electronic device ID
   */
  async deleteByDevice(deviceId: number): Promise<void> {
    const { error } = await supabase
      .from('device_custom_fields')
      .delete()
      .eq('electronic_device_id', deviceId)
    
    if (error) throw error
  },

  /**
   * Delete all custom fields for a specific field definition
   * @param fieldId - Category field ID
   */
  async deleteByField(fieldId: number): Promise<void> {
    const { error } = await supabase
      .from('device_custom_fields')
      .delete()
      .eq('field_id', fieldId)
    
    if (error) throw error
  },

  /**
   * Bulk upsert custom fields for a device
   * @param deviceId - Electronic device ID
   * @param fields - Array of {field_id, field_value} objects
   * @returns Array of device custom fields
   */
  async bulkUpsert(
    deviceId: number,
    fields: Array<{ field_id: number; field_value: unknown }>
  ): Promise<DeviceCustomField[]> {
    const results: DeviceCustomField[] = []
    
    for (const field of fields) {
      const result = await this.upsert(deviceId, field.field_id, field.field_value)
      results.push(result)
    }
    
    return results
  },

  /**
   * Get all devices that have a specific custom field
   * @param fieldId - Category field ID
   * @returns Array of device IDs
   */
  async getDevicesWithField(fieldId: number): Promise<number[]> {
    const { data, error } = await supabase
      .from('device_custom_fields')
      .select('electronic_device_id')
      .eq('field_id', fieldId)
    
    if (error) throw error
    return (data || []).map(d => d.electronic_device_id)
  },

  /**
   * Validate field value against field type
   * @param fieldValue - The value to validate
   * @param fieldType - The expected field type
   * @returns true if valid, false otherwise
   */
  validateFieldValue(fieldValue: unknown, fieldType: string): boolean {
    switch (fieldType) {
      case 'text':
        return typeof fieldValue === 'string'
      case 'number':
        return typeof fieldValue === 'number'
      case 'boolean':
        return typeof fieldValue === 'boolean'
      case 'select':
        return typeof fieldValue === 'string' || typeof fieldValue === 'number'
      default:
        return false
    }
  },
}
