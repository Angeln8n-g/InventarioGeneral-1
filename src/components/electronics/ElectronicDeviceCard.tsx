import React from 'react'
import { ElectronicDeviceWithDetails } from '@/types/database'
import { ELECTRONIC_CATEGORY_ICONS, getDeviceData } from '@/types/electronics'

interface ElectronicDeviceCardProps {
  device: ElectronicDeviceWithDetails
  onViewDetails: () => void
}

export const ElectronicDeviceCard: React.FC<ElectronicDeviceCardProps> = ({ device, onViewDetails }) => {
  // Extract device data with type safety
  const { toolInstance, itemType } = getDeviceData(device)

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

  const getCategoryIcon = () => {
    const iconType = ELECTRONIC_CATEGORY_ICONS[itemType.category as keyof typeof ELECTRONIC_CATEGORY_ICONS]
    
    switch (iconType) {
      case 'laptop':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'tablet':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'smartphone':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'keyboard':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        )
      case 'camera':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        )
    }
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
            {getCategoryIcon()}
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
            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs px-2 py-1 rounded">
              {itemType.category}
            </span>
          </div>
        )}
        {device.brand && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Brand:</span>
            <span className="text-xs font-medium text-text-light dark:text-text-dark">
              {device.brand}
            </span>
          </div>
        )}
        {device.model && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Model:</span>
            <span className="text-xs font-medium text-text-light dark:text-text-dark">
              {device.model}
            </span>
          </div>
        )}
        {toolInstance.serial_number && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Serial:</span>
            <span className="text-xs font-mono text-text-light dark:text-text-dark">
              {toolInstance.serial_number}
            </span>
          </div>
        )}
      </div>

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
