import React, { useState, useEffect } from 'react'
import { ElectronicCategory, CreateElectronicDeviceInput, UpdateElectronicDeviceInput, ElectronicDeviceWithDetails } from '@/types/database'
import { validateElectronicDeviceInput, ELECTRONIC_DEVICE_VALIDATION } from '@/types/electronics'
import { useLanguage } from '@/contexts/LanguageContext'

interface ElectronicDeviceFormProps {
  device?: ElectronicDeviceWithDetails
  onSubmit: (data: CreateElectronicDeviceInput | UpdateElectronicDeviceInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

const ELECTRONIC_CATEGORIES: ElectronicCategory[] = ['Laptops', 'Tablets', 'Smartphones', 'Periféricos', 'Digitales', 'Otros']

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
  const [formData, setFormData] = useState<CreateElectronicDeviceInput>({
    name: device?.item_type?.name || '',
    description: device?.item_type?.description || '',
    category: (device?.item_type?.category as ElectronicCategory) || 'Laptops',
    brand: device?.brand || '',
    model: device?.model || '',
    serial_number: device?.tool_instance?.serial_number || '',
    status: device?.tool_instance?.status || 'available',
    condition_notes: device?.tool_instance?.condition_notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CreateElectronicDeviceInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate
    const validation = validateElectronicDeviceInput(formData as unknown as Record<string, unknown>)
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {}
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message
      })
      setErrors(newErrors)
      return
    }

    try {
      await onSubmit(formData)
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
        <select
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className={`w-full border ${errors.category ? 'border-claro-red' : 'border-gray-300 dark:border-gray-600'} rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all`}
        >
          {ELECTRONIC_CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-xs text-claro-red">{errors.category}</p>
        )}
      </div>

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
