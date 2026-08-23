import { supabase } from '../supabase'
import { generateToolUUID } from './tools.repository'
import type {
  ItemType,
  ToolInstance,
  ElectronicDevice,
  ElectronicDeviceWithDetails,
  CreateElectronicDeviceInput,
  UpdateElectronicDeviceInput,
} from '@/types/database'

export const electronicDeviceOperations = {
  async getAll(filters?: {
    status?: ToolInstance['status']
    category?: string
    search?: string
  }): Promise<ElectronicDeviceWithDetails[]> {
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

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      results = results.filter((device) => {
        const toolInstance = device.tool_instance as unknown as ToolInstance & { item_type: ItemType }
        const itemType = toolInstance?.item_type
        
        return (
          itemType?.name?.toLowerCase().includes(searchLower) ||
          device.brand?.toLowerCase().includes(searchLower) ||
          device.model?.toLowerCase().includes(searchLower) ||
          toolInstance?.serial_number?.toLowerCase().includes(searchLower)
        )
      })
    }

    const electronicDeviceIds = results.map(d => d.id)
    if (electronicDeviceIds.length > 0) {
      const deviceToolInstanceIds = results.map(d => (d.tool_instance as unknown as ToolInstance).id)
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .in('tool_instance_id', deviceToolInstanceIds)
        .eq('status', 'active')

      const { data: assignments } = await supabase
        .from('device_assignments')
        .select(`
          *,
          classroom:classrooms(*)
        `)
        .in('electronic_device_id', electronicDeviceIds)
        .eq('is_active', true)

      const { data: customFields } = await supabase
        .from('device_custom_fields')
        .select(`
          *,
          field:category_fields(*)
        `)
        .in('electronic_device_id', electronicDeviceIds)

      results = results.map(device => {
        const toolInstance = device.tool_instance as unknown as ToolInstance
        const loan = loans?.find(l => l.tool_instance_id === toolInstance.id)
        const assignment = assignments?.find(a => a.electronic_device_id === device.id)
        
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

    const toolInstance = data.tool_instance as unknown as ToolInstance
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('tool_instance_id', toolInstance.id)
      .eq('status', 'active')
      .single()

    const { data: customFields } = await supabase
      .from('device_custom_fields')
      .select(`
        *,
        field:category_fields(*)
      `)
      .eq('electronic_device_id', id)

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

      const { invalidateCache } = await import('../cache')
      invalidateCache('item_type')
    }

    if (!itemType) {
      throw new Error('Failed to create or retrieve item type')
    }

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
    const currentDevice = await this.getById(id)
    if (!currentDevice) {
      throw new Error('Electronic device not found')
    }

    const toolInstance = currentDevice.tool_instance as unknown as ToolInstance & { item_type: ItemType }

    if (
      input.name ||
      input.category ||
      input.description ||
      input.serial_number !== undefined ||
      input.status ||
      input.condition_notes !== undefined
    ) {
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

          const { invalidateCache } = await import('../cache')
          invalidateCache('item_type')
        }
      }

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

    const updatedDevice = await this.getById(id)
    if (!updatedDevice) {
      throw new Error('Failed to retrieve updated device')
    }

    return updatedDevice
  },

  async delete(id: number): Promise<void> {
    const device = await this.getById(id)
    if (!device) {
      throw new Error('Electronic device not found')
    }

    const toolInstance = device.tool_instance as unknown as ToolInstance

    const { data: activeLoan } = await supabase
      .from('loans')
      .select('id')
      .eq('tool_instance_id', toolInstance.id)
      .eq('status', 'active')
      .single()

    if (activeLoan) {
      throw new Error('Cannot delete device with active loan')
    }

    const { error } = await supabase
      .from('electronic_devices')
      .delete()
      .eq('id', id)

    if (error) throw error

    await supabase
      .from('tool_instances')
      .delete()
      .eq('id', toolInstance.id)
  },

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
