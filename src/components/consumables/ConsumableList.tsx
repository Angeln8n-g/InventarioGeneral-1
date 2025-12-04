// Phase 2, Task 8: ConsumableList component

import React from 'react'
import { ConsumableItem, ConsumableStockAdmin, UserRole, StockAdjustmentAction } from '@/types/consumables'
import { ConsumableCard } from './ConsumableCard'
import { useReservations } from '@/hooks/useReservations'

interface CableMarkers {
  startMarker: number
  endMarker: number
}

interface ConsumableListProps {
  items: ConsumableItem[] | ConsumableStockAdmin[]
  role: UserRole
  onRequest?: (itemId: number, quantity: number, markers?: CableMarkers) => void
  onAddToCart?: (item: ConsumableItem, quantity: number, markers?: CableMarkers) => void
  onAdjustStock?: (stockId: number, action: StockAdjustmentAction, quantity: number) => void
  onViewDetails?: (stockId: number) => void
  onEdit?: (stockId: number) => void
  onUploadImage?: (stockId: number) => void
  onDelete?: (stockId: number) => void
  requestingItemId?: number | null
  adjustingStockId?: number | null
  deletingStockId?: number | null
  isLoading?: boolean
  onClearFilters?: () => void
}

export const ConsumableList: React.FC<ConsumableListProps> = ({
  items,
  role,
  onRequest,
  onAddToCart,
  onAdjustStock,
  onViewDetails,
  onEdit,
  onUploadImage,
  onDelete,
  requestingItemId,
  adjustingStockId,
  deletingStockId,
  isLoading = false,
  onClearFilters,
}) => {
  const { getReservationsForItem, getTotalReservedForItem } = useReservations()
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Loading consumables...
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="col-span-2 text-center py-12">
        <svg className="w-12 h-12 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="text-lg font-medium mb-2 text-text-light dark:text-text-dark">
          No Items Found
        </h3>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
          {onClearFilters
            ? 'Try adjusting your filters to see more items.'
            : 'There are no consumable items configured in the system.'
          }
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="claro-button-secondary px-4 py-2 rounded-lg font-medium transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, index) => {
        // For ConsumableStockAdmin, use stock id; for ConsumableItem, use item id
        const itemId = 'item_type' in item ? item.id : item.id
        // Create unique key combining type and id to avoid duplicates
        const uniqueKey = 'item_type' in item ? `stock-${item.id}` : `item-${item.id}-${index}`
        const isRequesting = requestingItemId === itemId
        const isAdjusting = adjustingStockId === itemId
        const isDeleting = deletingStockId === itemId

        const reservationsForItem = getReservationsForItem(itemId)
        const totalReserved = getTotalReservedForItem(itemId)
        const activeReservations = reservationsForItem.map(r => ({
          username: r.username,
          quantity: r.reserved_quantity,
        }))

        return (
          <ConsumableCard
            key={uniqueKey}
            item={item}
            role={role}
            onRequest={onRequest ? (quantity, markers) => onRequest(itemId, quantity, markers) : undefined}
            onAddToCart={onAddToCart ? (quantity, markers) => onAddToCart(item as ConsumableItem, quantity, markers) : undefined}
            onAdjustStock={onAdjustStock ? (action, quantity) => onAdjustStock(itemId, action, quantity) : undefined}
            onViewDetails={onViewDetails ? () => onViewDetails(itemId) : undefined}
            onEdit={onEdit ? () => onEdit(itemId) : undefined}
            onUploadImage={onUploadImage ? () => onUploadImage(itemId) : undefined}
            onDelete={onDelete ? () => onDelete(itemId) : undefined}
            isRequesting={isRequesting}
            isAdjusting={isAdjusting}
            isDeleting={isDeleting}
            reservedQuantity={totalReserved}
            activeReservations={activeReservations}
          />
        )
      })}
    </div>
  )
}
