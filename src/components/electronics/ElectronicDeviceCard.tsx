import React from 'react'
import { ElectronicDeviceWithDetails } from '@/types/database'
import { getDeviceData } from '@/types/electronics'
import { getCategoryIcon } from '@/utils/categoryIcons'
import CustomFieldsDisplay from './CustomFieldsDisplay'

interface ElectronicDeviceCardProps {
  device: ElectronicDeviceWithDetails
  /** Optional category icon from database (overrides default) */
  categoryIcon?: string | null
  onViewDetails: () => void
}

export const ElectronicDeviceCard: React.FC<ElectronicDeviceCardProps> = ({ device, categoryIcon, onViewDetails }) => {
  // Extract device data with type safety
  const { toolInstance, itemType } = getDeviceData(device)
  
  // Get the category icon (from prop or fallback to default)
  const displayIcon = getCategoryIcon(itemType.category, categoryIcon)

  const getStatusColor = () => {
    switch (toolInstance.status) {
      case 'available':
        return { bg: 'bg-claro-green/10 dark:bg-claro-green/20', text: 'text-claro-green', icon: 'text-claro-green' }
      case 'loaned':
        return { bg: 'bg-claro-warning/10 dark:bg-claro-warning/20', text: 'text-claro-warning', icon: 'text-claro-warning' }
      case 'out-of-service':
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: 'text-gray-600 dark:text-gray-400' }
      case 'lost':
        return { bg: 'bg-claro-red/10 dark:bg-claro-red/20', text: 'text-claro-red', icon: 'text-claro-red' }
      case 'damaged':
        return { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', icon: 'text-orange-600 dark:text-orange-400' }
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: 'text-gray-600 dark:text-gray-400' }
    }
  }

  // Render the category icon as emoji
  const renderCategoryIcon = () => {
    return (
      <span className="text-3xl" role="img" aria-label={itemType.category || 'Device'}>
        {displayIcon}
      </span>
    )
  }

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const statusColor = getStatusColor()

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
      {/* Icon and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${statusColor.bg}`}>
          <div className={statusColor.icon}>
            {renderCategoryIcon()}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-medium ${statusColor.text}`}>
            {getStatusLabel(toolInstance.status)}
          </span>
        </div>
      </div>

      {/* Device Info */}
      <div className="mb-3">
        <h3 className="font-semibold text-base mb-1 text-text-light dark:text-text-dark">{itemType.name || 'Unknown Device'}</h3>
        {itemType.description && (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
            {itemType.description}
          </p>
        )}
      </div>

      {/* Category, Brand, Model */}
      <div className="mb-3 space-y-1">
        {itemType.category && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Category:</span>
            <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs px-2 py-1 rounded">
              <span role="img" aria-hidden="true">{displayIcon}</span>
              {itemType.category}
            </span>
          </div>
        )}
        {device.brand && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">🛍️Brand:</span>
            <span className="text-xs font-medium text-text-light dark:text-text-dark">
              {device.brand}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">💾RAM Memory:</span>
          <span className="text-xs font-medium text-text-light dark:text-text-dark">
            {(() => {
              // First check custom fields for RAM Memory
              const customFields = (device as any).custom_fields
              if (customFields?.['RAM Memory']) {
                return customFields['RAM Memory']
              }
              // Fallback to direct memory fields
              if (device.memory_capacity && device.memory_unit) {
                return `${device.memory_capacity} ${device.memory_unit}`
              }
              return 'N/A'
            })()}
          </span>
        </div>
        {device.model && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">⚙️Assetag:</span>
            <span className="text-xs font-medium text-text-light dark:text-text-dark">
              {device.model}
            </span>
          </div>
        )}
        {toolInstance.serial_number && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">🔗Serial:</span>
            <span className="text-xs font-mono text-text-light dark:text-text-dark">
              {toolInstance.serial_number}
            </span>
          </div>
        )}
      </div>

      {/* Assignment Info */}
      {(device as any).current_assignment && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Asignada: {(device as any).current_assignment.classroom?.name || 'Aula desconocida'}
            </span>
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {(device as any).custom_fields && Object.keys((device as any).custom_fields).length > 0 && (
        <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Campos adicionales:</p>
          <CustomFieldsDisplay
            customFields={(device as any).custom_fields}
            variant="compact"
            maxFields={3}
          />
        </div>
      )}

      {/* Condition Notes */}
      {toolInstance.condition_notes && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
          <span className="text-text-secondary-light dark:text-text-secondary-dark">Note: </span>
          <span className="text-text-light dark:text-text-dark line-clamp-2">{toolInstance.condition_notes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onViewDetails}
          className="w-full claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  )
}
