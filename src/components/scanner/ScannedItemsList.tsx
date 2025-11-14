'use client'

import React, { memo } from 'react'
import { ScannedItem } from '@/utils/scannerStorage'

interface ScannedItemsListProps {
  items: ScannedItem[]
  onRemove: (id: string) => void
  action: 'loan' | 'return' | 'consume'
}

const ScannedItemsListComponent: React.FC<ScannedItemsListProps> = ({
  items,
  onRemove,
  action,
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary-light dark:text-text-secondary-dark">
        <svg
          className="mx-auto h-12 w-12 mb-3 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
          />
        </svg>
        <p className="text-sm">Scan items to begin</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-background-light dark:bg-background-dark rounded-lg border border-gray-200 dark:border-gray-700 claro-card-hover transition-all duration-300 animate-slide-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-claro-red flex items-center justify-center text-white font-bold shadow-md">
                {index + 1}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                {item.item_type.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {item.serial_number && (
                  <span>S/N: {item.serial_number}</span>
                )}
                {item.status && action !== 'consume' && (
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-claro-green dark:text-claro-green">
                    {item.status}
                  </span>
                )}
                {action === 'consume' && item.quantity && (
                  <span className="claro-badge-active">
                    Qty: {item.quantity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onRemove(item.id)}
            className="flex-shrink-0 ml-2 p-2 text-claro-red hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            aria-label={`Remove ${item.item_type.name}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}

ScannedItemsListComponent.displayName = 'ScannedItemsList'

export const ScannedItemsList = memo(ScannedItemsListComponent)
