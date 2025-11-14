// Phase 2, Task 9: BackordersTab component (admin only)

import React from 'react'
import { BackorderRequest } from '@/types/consumables'

interface BackordersTabProps {
  backorders: BackorderRequest[]
  isLoading: boolean
  onProcessBackorders: (itemTypeId: number, newStockQuantity: number) => void
}

export const BackordersTab: React.FC<BackordersTabProps> = ({
  backorders,
  isLoading,
  onProcessBackorders,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Loading backorders...
        </p>
      </div>
    )
  }

  if (backorders.length === 0) {
    return (
      <div className="text-center py-12 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
        <svg className="w-12 h-12 text-claro-green mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium mb-2 text-text-light dark:text-text-dark">
          No Backorders
        </h3>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          All requests have been fulfilled. Great job!
        </p>
      </div>
    )
  }

  // Group backorders by item type
  const groupedBackorders = backorders.reduce((acc, backorder) => {
    const itemTypeId = backorder.item_type.id
    if (!acc[itemTypeId]) {
      acc[itemTypeId] = {
        itemTypeName: backorder.item_type.name,
        itemTypeId,
        requests: [],
      }
    }
    acc[itemTypeId].requests.push(backorder)
    return acc
  }, {} as Record<number, { itemTypeName: string; itemTypeId: number; requests: BackorderRequest[] }>)

  return (
    <div className="space-y-6">
      {Object.values(groupedBackorders).map((group) => {
        const totalQuantity = group.requests.reduce((sum, req) => sum + req.requested_quantity, 0)

        return (
          <div
            key={group.itemTypeId}
            className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-1">
                  {group.itemTypeName}
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {group.requests.length} pending request{group.requests.length !== 1 ? 's' : ''} • Total: {totalQuantity} units
                </p>
              </div>
              <button
                onClick={() => {
                  const newStock = prompt(
                    `Enter new stock quantity for ${group.itemTypeName}:`,
                    totalQuantity.toString()
                  )
                  if (newStock && !isNaN(parseInt(newStock))) {
                    onProcessBackorders(group.itemTypeId, parseInt(newStock))
                  }
                }}
                className="claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                Process Backorders
              </button>
            </div>

            <div className="space-y-3">
              {group.requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-light dark:text-text-dark">
                          {request.user.username}
                        </p>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {request.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text-light dark:text-text-dark">
                      {request.requested_quantity} units
                    </p>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {new Date(request.request_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
