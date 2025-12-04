import { supabase } from '../supabase'
import type {
  DeviceCategory,
  CategoryField,
  MigrationAnalysis,
  MigrationRequest,
  MigrationResult,
} from '@/types/database'
import { analyzeCategoryMigration } from '../validation/migrationValidation'
import { categoryOperations } from './categoryOperations'
import { fieldOperations } from './fieldOperations'
import { customFieldOperations } from './customFieldOperations'
import { auditLogOperations } from '../supabase-client'

/**
 * Migration operations for category migrations
 */
export const migrationOperations = {
  /**
   * Analyze compatibility between source and target categories
   * @param sourceCategoryId - Source category ID
   * @param targetCategoryId - Target category ID
   * @returns Migration analysis with compatible/incompatible fields
   */
  async analyzeCompatibility(
    sourceCategoryId: number,
    targetCategoryId: number
  ): Promise<MigrationAnalysis> {
    // Get categories
    const sourceCategory = await categoryOperations.getById(sourceCategoryId)
    const targetCategory = await categoryOperations.getById(targetCategoryId)
    
    if (!sourceCategory || !targetCategory) {
      throw new Error('Source or target category not found')
    }
    
    // Get fields for both categories
    const sourceFields = await fieldOperations.getByCategory(sourceCategoryId)
    const targetFields = await fieldOperations.getByCategory(targetCategoryId)
    
    // Analyze compatibility
    const analysis = analyzeCategoryMigration(
      sourceCategory,
      targetCategory,
      sourceFields,
      targetFields
    )
    
    // Get device count
    const deviceCount = await categoryOperations.getDeviceCount(sourceCategoryId)
    analysis.devicesToMigrate = deviceCount
    
    return analysis
  },

  /**
   * Migrate a single device to a new category
   * @param deviceId - Electronic device ID
   * @param targetCategoryId - Target category ID
   * @param fieldMapping - Optional field value mapping for incompatible fields
   * @param userId - User ID performing the migration (for audit log)
   * @returns true if successful
   */
  async migrateDevice(
    deviceId: number,
    targetCategoryId: number,
    fieldMapping?: Record<string, unknown>,
    userId?: number
  ): Promise<boolean> {
    try {
      // Get device with its current category
      const { data: device, error: deviceError } = await supabase
        .from('electronic_devices')
        .select(`
          id,
          tool_instance:tool_instances(
            id,
            item_type:item_types(id, category_id)
          )
        `)
        .eq('id', deviceId)
        .single()
      
      if (deviceError || !device) {
        throw new Error('Device not found')
      }
      
      const toolInstance = device.tool_instance as any
      const itemType = toolInstance?.item_type
      const currentCategoryId = itemType?.category_id
      
      if (!currentCategoryId) {
        throw new Error('Device does not have a category')
      }
      
      // Analyze compatibility
      const analysis = await this.analyzeCompatibility(currentCategoryId, targetCategoryId)
      
      // Get current custom fields
      const currentCustomFields = await customFieldOperations.getByDevice(deviceId)
      
      // Get target category fields
      const targetFields = await fieldOperations.getByCategory(targetCategoryId)
      const targetFieldMap = new Map(targetFields.map(f => [f.field_name, f]))
      
      // Preserve compatible field values
      const newCustomFields: Array<{ field_id: number; field_value: unknown }> = []
      
      for (const customField of currentCustomFields) {
        const fieldName = customField.field.field_name
        
        if (analysis.compatibleFields.includes(fieldName)) {
          const targetField = targetFieldMap.get(fieldName)
          if (targetField) {
            newCustomFields.push({
              field_id: targetField.id,
              field_value: customField.field_value
            })
          }
        }
      }
      
      // Add mapped values for incompatible fields if provided
      if (fieldMapping) {
        for (const [fieldName, fieldValue] of Object.entries(fieldMapping)) {
          const targetField = targetFieldMap.get(fieldName)
          if (targetField) {
            newCustomFields.push({
              field_id: targetField.id,
              field_value: fieldValue
            })
          }
        }
      }
      
      // Update item_type category_id
      const { error: updateError } = await supabase
        .from('item_types')
        .update({ category_id: targetCategoryId })
        .eq('id', itemType.id)
      
      if (updateError) throw updateError
      
      // Delete old custom fields
      await customFieldOperations.deleteByDevice(deviceId)
      
      // Create new custom fields
      if (newCustomFields.length > 0) {
        await customFieldOperations.bulkUpsert(deviceId, newCustomFields)
      }
      
      // Create audit log
      if (userId) {
        await auditLogOperations.create({
          user_id: userId,
          action: 'MIGRATE_CATEGORY',
          entity_type: 'electronic_device',
          entity_id: deviceId,
          old_values: { category_id: currentCategoryId },
          new_values: { category_id: targetCategoryId }
        })
      }
      
      return true
    } catch (error) {
      console.error('Migration error:', error)
      return false
    }
  },

  /**
   * Migrate multiple devices to a new category
   * @param request - Migration request with source/target categories and device IDs
   * @param userId - User ID performing the migration (for audit log)
   * @returns Migration result with success/failure counts
   */
  async migrateBulk(request: MigrationRequest, userId?: number): Promise<MigrationResult> {
    const { sourceCategoryId, targetCategoryId, deviceIds, fieldMapping } = request
    
    // Analyze compatibility first
    const analysis = await this.analyzeCompatibility(sourceCategoryId, targetCategoryId)
    
    // Get devices to migrate
    let devicesToMigrate: number[]
    
    if (deviceIds && deviceIds.length > 0) {
      devicesToMigrate = deviceIds
    } else {
      // Get all devices in source category
      const { data: itemTypes, error } = await supabase
        .from('item_types')
        .select(`
          id,
          tool_instances(
            electronic_devices(id)
          )
        `)
        .eq('category_id', sourceCategoryId)
      
      if (error) throw error
      
      devicesToMigrate = (itemTypes || [])
        .flatMap(it => (it.tool_instances as any[]) || [])
        .flatMap(ti => (ti.electronic_devices as any[]) || [])
        .map(ed => ed.id)
        .filter(id => id !== undefined)
    }
    
    // Migrate each device
    let migratedCount = 0
    let failedCount = 0
    const errors: string[] = []
    
    for (const deviceId of devicesToMigrate) {
      const success = await this.migrateDevice(
        deviceId,
        targetCategoryId,
        fieldMapping,
        userId
      )
      
      if (success) {
        migratedCount++
      } else {
        failedCount++
        errors.push(`Failed to migrate device ${deviceId}`)
      }
    }
    
    return {
      success: failedCount === 0,
      migratedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined
    }
  },

  /**
   * Get migration preview (dry run)
   * @param sourceCategoryId - Source category ID
   * @param targetCategoryId - Target category ID
   * @returns Migration analysis with device list
   */
  async getMigrationPreview(
    sourceCategoryId: number,
    targetCategoryId: number
  ): Promise<{
    analysis: MigrationAnalysis
    devices: Array<{ id: number; name: string }>
  }> {
    const analysis = await this.analyzeCompatibility(sourceCategoryId, targetCategoryId)
    
    // Get devices in source category
    const { data: itemTypes, error } = await supabase
      .from('item_types')
      .select(`
        id,
        name,
        tool_instances(
          electronic_devices(id)
        )
      `)
      .eq('category_id', sourceCategoryId)
    
    if (error) throw error
    
    const devices = (itemTypes || [])
      .flatMap(it => {
        const instances = (it.tool_instances as any[]) || []
        return instances.flatMap(ti => {
          const eds = (ti.electronic_devices as any[]) || []
          return eds.map(ed => ({
            id: ed.id,
            name: it.name
          }))
        })
      })
      .filter(d => d.id !== undefined)
    
    return {
      analysis,
      devices
    }
  },
}
