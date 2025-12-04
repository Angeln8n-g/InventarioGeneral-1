import React, { useState, useEffect, useCallback } from 'react'
import { ElectronicCategory, CreateElectronicDeviceInput, UpdateElectronicDeviceInput, ElectronicDeviceWithDetails, DeviceCategory, CategoryField } from '@/types/database'
import { validateElectronicDeviceInput, ELECTRONIC_DEVICE_VALIDATION } from '@/types/electronics'
import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'

interface ElectronicDeviceFormProps {
  device?: ElectronicDeviceWithDetails
  onSubmit: (data: CreateElectronicDeviceInput | UpdateElectronicDeviceInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

interface CustomFieldValue {
  field_id: number
  field_value: unknown
}

// Fallback categories in case API fails
const FALLBACK_CATEGORIES: string[] = ['Laptops', 'Tablets', 'Smartphones', 'Periféricos', 'Digitales', 'Otros']

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'loaned', label: 'Loaned' },
  { value: 'out-of-service', label: 'Out of Service' },
  { value: 'lost', label: 'Lost' },
  { value: 'damaged', label: 'Damaged' },
] as const

export const ElectronicDeviceForm: React.FC<ElectronicDeviceFormProps> = ({
  device,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const { t } = useLanguage()
  const [categories, setCategories] = useState<DeviceCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoryFields, setCategoryFields] = useState<CategoryField[]>([])
  const [loadingFields, setLoadingFields] = useState(false)
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, unknown>>({})
  // Get category from device - it can be in item_type or tool_instance.item_type
  const getDeviceCategory = (): string => {
    if (device?.item_type?.category) return device.item_type.category
    const toolInstance = device?.tool_instance as any
    if (toolInstance?.item_type?.category) return toolInstance.item_type.category
    return ''
  }

  const getDeviceName = (): string => {
    if (device?.item_type?.name) return device.item_type.name
    const toolInstance = device?.tool_instance as any
    if (toolInstance?.item_type?.name) return toolInstance.item_type.name
    return ''
  }

  const getDeviceDescription = (): string => {
    if (device?.item_type?.description) return device.item_type.description
    const toolInstance = device?.tool_instance as any
    if (toolInstance?.item_type?.description) return toolInstance.item_type.description
    return ''
  }

  const [formData, setFormData] = useState<CreateElectronicDeviceInput>({
    name: getDeviceName(),
    description: getDeviceDescription(),
    category: getDeviceCategory() as ElectronicCategory,
    brand: device?.brand || '',
    model: device?.model || '',
    serial_number: device?.tool_instance?.serial_number || '',
    status: device?.tool_instance?.status || 'available',
    condition_notes: device?.tool_instance?.condition_notes || '',
    memory_capacity: device?.memory_capacity,
    memory_unit: device?.memory_unit,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch category fields when category changes
  const fetchCategoryFields = useCallback(async (categoryName: string) => {
    if (!categoryName) {
      setCategoryFields([])
      return
    }

    const category = categories.find(c => c.name === categoryName)
    if (!category) {
      setCategoryFields([])
      return
    }

    try {
      setLoadingFields(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/categories/${category.id}/fields`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setCategoryFields(data.data || [])
      } else {
        console.error('Failed to fetch category fields')
        setCategoryFields([])
      }
    } catch (error) {
      console.error('Error fetching category fields:', error)
      setCategoryFields([])
    } finally {
      setLoadingFields(false)
    }
  }, [categories])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/categories', {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          const activeCategories = (data.data || []).filter((cat: DeviceCategory) => cat.is_active)
          setCategories(activeCategories)
          
          // Set default category only if not already set and not editing an existing device
          if (!formData.category && !device && activeCategories.length > 0) {
            setFormData(prev => ({ ...prev, category: activeCategories[0].name as ElectronicCategory }))
          }
        } else {
          console.error('Failed to fetch categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [device])

  // Fetch fields when category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      fetchCategoryFields(formData.category)
    }
  }, [formData.category, categories, fetchCategoryFields])

  // Initialize custom field values from device data when editing
  useEffect(() => {
    if (device && (device as any).custom_fields) {
      const existingValues: Record<number, unknown> = {}
      const customFields = (device as any).custom_fields
      
      // Map field names to field IDs if we have the fields loaded
      categoryFields.forEach(field => {
        if (customFields[field.field_name] !== undefined) {
          existingValues[field.id] = customFields[field.field_name]
        }
      })
      
      setCustomFieldValues(existingValues)
    }
  }, [device, categoryFields])

  // Get category names for the select
  const categoryNames = categories.length > 0 
    ? categories.map(cat => cat.name) 
    : FALLBACK_CATEGORIES

  const handleChange = (field: keyof CreateElectronicDeviceInput, value: string) => {
    // Convert numeric fields to numbers
    let processedValue: string | number = value
    if (field === 'memory_capacity' && value !== '') {
      processedValue = parseFloat(value)
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCustomFieldChange = (fieldId: number, value: unknown, fieldType: string) => {
    let processedValue = value
    
    // Convert value based on field type
    if (fieldType === 'number' && typeof value === 'string') {
      processedValue = value === '' ? null : parseFloat(value)
    } else if (fieldType === 'boolean') {
      processedValue = Boolean(value)
    }
    
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: processedValue,
    }))
    
    // Clear error for this custom field
    const errorKey = `custom_field_${fieldId}`
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const showMemoryFields = ['Laptops', 'Tablets', 'Smartphones'].includes(formData.category)
  
  // Filter out memory fields from custom fields since they're handled separately
  const displayCustomFields = categoryFields.filter(
    field => !['memory_capacity', 'memory_unit'].includes(field.field_name)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate standard fields
    const validation = validateElectronicDeviceInput(formData as unknown as Record<string, unknown>)
    const newErrors: Record<string, string> = {}
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message
      })
    }

    // Validate required custom fields
    displayCustomFields.forEach(field => {
      if (field.is_required) {
        const value = customFieldValues[field.id]
        const isEmpty = value === undefined || value === null || value === ''
        
        if (isEmpty) {
          newErrors[`custom_field_${field.id}`] = `${field.field_name} es requerido`
        }
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Prepare custom fields data
      const customFieldsData: CustomFieldValue[] = Object.entries(customFieldValues)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .map(([fieldId, value]) => ({
          field_id: parseInt(fieldId),
          field_value: value,
        }))

      // Include custom fields in the submission (using 'customFields' as expected by API)
      const submitData = {
        ...formData,
        customFields: customFieldsData,
      }

      await onSubmit(submitData as CreateElectronicDeviceInput)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
          Name <span className="text-claro-red">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full border ${errors.name ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          placeholder="Enter device name"
          maxLength={ELECTRONIC_DEVICE_VALIDATION.name.maxLength}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-claro-red">{errors.name}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
          Category <span className="text-claro-red">*</span>
        </label>
        {loadingCategories ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">Loading categories...</span>
          </div>
        ) : (
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className={`w-full border ${errors.category ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          >
            {categoryNames.map(categoryName => {
              const category = categories.find(c => c.name === categoryName)
              return (
                <option key={categoryName} value={categoryName}>
                  {category?.icon ? `${category.icon} ` : ''}{categoryName}
                </option>
              )
            })}
          </select>
        )}
        {errors.category && (
          <p className="mt-1 text-xs text-claro-red">{errors.category}</p>
        )}
      </div>

      {/* Memory Capacity (conditional) */}
      {showMemoryFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
              Memory Capacity
            </label>
            <input
              type="number"
              value={formData.memory_capacity ?? ''}
              onChange={(e) => handleChange('memory_capacity', e.target.value)}
              className={`w-full border ${errors.memory_capacity ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
              placeholder="e.g., 16"
              min={0}
              step={0.01}
            />
            {errors.memory_capacity && (
              <p className="mt-1 text-xs text-claro-red">{errors.memory_capacity}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
              Memory Unit
            </label>
            <select
              value={formData.memory_unit ?? ''}
              onChange={(e) => handleChange('memory_unit', e.target.value)}
              className={`w-full border ${errors.memory_unit ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
            >
              <option value="">Select Unit</option>
              <option value="GB">GB</option>
              <option value="TB">TB</option>
            </select>
            {errors.memory_unit && (
              <p className="mt-1 text-xs text-claro-red">{errors.memory_unit}</p>
            )}
          </div>
        </div>
      )}

      {/* Brand and Model - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Brand
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            className={`w-full border ${errors.brand ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
            placeholder="e.g., Apple, Dell, HP"
            maxLength={ELECTRONIC_DEVICE_VALIDATION.brand.maxLength}
          />
          {errors.brand && (
            <p className="mt-1 text-xs text-claro-red">{errors.brand}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
            Model
          </label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => handleChange('model', e.target.value)}
            className={`w-full border ${errors.model ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
            placeholder="e.g., MacBook Pro, Latitude 5420"
            maxLength={ELECTRONIC_DEVICE_VALIDATION.model.maxLength}
          />
          {errors.model && (
            <p className="mt-1 text-xs text-claro-red">{errors.model}</p>
          )}
        </div>
      </div>

      {/* Serial Number */}
      <div>
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
          Serial Number
        </label>
        <input
          type="text"
          value={formData.serial_number}
          onChange={(e) => handleChange('serial_number', e.target.value)}
          className={`w-full border ${errors.serial_number ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all font-mono`}
          placeholder="Enter serial number"
          maxLength={ELECTRONIC_DEVICE_VALIDATION.serial_number.maxLength}
        />
        {errors.serial_number && (
          <p className="mt-1 text-xs text-claro-red">{errors.serial_number}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className={`w-full border ${errors.description ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
          placeholder="Enter device description"
          rows={3}
          maxLength={ELECTRONIC_DEVICE_VALIDATION.description.maxLength}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-claro-red">{errors.description}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
          Status
        </label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* Condition Notes */}
      <div>
        <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
          Condition Notes
        </label>
        <textarea
          value={formData.condition_notes}
          onChange={(e) => handleChange('condition_notes', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          placeholder="Any notes about the device condition"
          rows={2}
        />
      </div>

      {/* Custom Fields Section */}
      {displayCustomFields.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 className="text-sm font-semibold text-text-light dark:text-text-dark mb-3 flex items-center gap-2">
            📋 Campos Adicionales
            {loadingFields && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </h3>
          <div className="space-y-4">
            {displayCustomFields
              .sort((a, b) => a.display_order - b.display_order)
              .map(field => {
                const errorKey = `custom_field_${field.id}`
                const hasError = !!errors[errorKey]
                const value = customFieldValues[field.id]
                
                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                      {field.field_name}
                      {field.is_required && <span className="text-claro-red ml-1">*</span>}
                    </label>
                    
                    {field.field_type === 'text' && (
                      <input
                        type="text"
                        value={(value as string) || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.field_type)}
                        className={`w-full border ${hasError ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                        placeholder={`Ingrese ${field.field_name.toLowerCase()}`}
                      />
                    )}
                    
                    {field.field_type === 'number' && (
                      <input
                        type="number"
                        value={(value as number) ?? ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.field_type)}
                        className={`w-full border ${hasError ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                        placeholder={`Ingrese ${field.field_name.toLowerCase()}`}
                        step="any"
                      />
                    )}
                    
                    {field.field_type === 'select' && (
                      <select
                        value={(value as string) || ''}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.field_type)}
                        className={`w-full border ${hasError ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
                      >
                        <option value="">Seleccionar...</option>
                        {(field.options as any)?.options?.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    
                    {field.field_type === 'boolean' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.checked, field.field_type)}
                          className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-text-light dark:text-text-dark">
                          {field.field_name}
                        </span>
                      </label>
                    )}
                    
                    {hasError && (
                      <p className="mt-1 text-xs text-claro-red">{errors[errorKey]}</p>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (device ? 'Updating...' : 'Creating...') : (device ? 'Update Device' : 'Create Device')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
