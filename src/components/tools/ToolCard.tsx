import React from 'react'

interface ToolInstance {
  id: number
  item_type: {
    id: number
    name: string
    description?: string
    category?: string
  }
  qr_code: string
  serial_number?: string
  status: 'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'
  condition_notes?: string
  created_at: string
}

interface ToolCardProps {
  tool: ToolInstance
  onViewDetails: () => void
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onViewDetails }) => {
  const getStatusColor = () => {
    switch (tool.status) {
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

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const statusColor = getStatusColor()

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
      {/* Icon and Status */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${statusColor.bg}`}>
          <svg className={`w-8 h-8 ${statusColor.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <div className="text-right">
          <span className={`text-xs font-medium ${statusColor.text}`}>
            {getStatusLabel(tool.status)}
          </span>
        </div>
      </div>

      {/* Tool Info */}
      <div className="mb-3">
        <h3 className="font-semibold text-base mb-1 text-text-light dark:text-text-dark">{tool.item_type.name}</h3>
        {tool.item_type.description && (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
            {tool.item_type.description}
          </p>
        )}
      </div>

      {/* Category and Serial */}
      <div className="mb-3 space-y-1">
        {tool.item_type.category && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Category:</span>
            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs px-2 py-1 rounded">
              {tool.item_type.category}
            </span>
          </div>
        )}
        {tool.serial_number && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Serial:</span>
            <span className="text-xs font-mono text-text-light dark:text-text-dark">
              {tool.serial_number}
            </span>
          </div>
        )}
      </div>

      {/* Condition Notes */}
      {tool.condition_notes && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
          <span className="text-text-secondary-light dark:text-text-secondary-dark">Note: </span>
          <span className="text-text-light dark:text-text-dark line-clamp-2">{tool.condition_notes}</span>
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
