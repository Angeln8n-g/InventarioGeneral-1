// Phase 2, Task 7: ConsumableCard component

import React, { useState } from 'react'
import { ConsumableItem, ConsumableStockAdmin, UserRole, StockAdjustmentAction } from '@/types/consumables'
import { ConsumableActions } from './ConsumableActions'
import { StockAdjustmentForm } from './StockAdjustmentForm'

interface CableMarkers {
  startMarker: number
  endMarker: number
}

interface ConsumableCardProps {
  item: ConsumableItem | ConsumableStockAdmin
  role: UserRole
  onRequest?: (quantity: number, markers?: CableMarkers) => void
  onAddToCart?: (quantity: number, markers?: CableMarkers) => void
  onAdjustStock?: (action: StockAdjustmentAction, quantity: number) => void
  onViewDetails?: () => void
  onEdit?: () => void
  onUploadImage?: () => void
  onDelete?: () => void
  isRequesting?: boolean
  isAdjusting?: boolean
  isDeleting?: boolean
  reservedQuantity?: number
  activeReservations?: Array<{ username: string; quantity: number }>
}

export const ConsumableCard = React.memo<ConsumableCardProps>(({
  item,
  role,
  onRequest,
  onAddToCart,
  onAdjustStock,
  onViewDetails,
  onEdit,
  onUploadImage,
  onDelete,
  isRequesting = false,
  isAdjusting = false,
  isDeleting = false,
  reservedQuantity = 0,
  activeReservations = [],
}) => {
  const [showActions, setShowActions] = useState(false)
  const [showAdjustForm, setShowAdjustForm] = useState(false)

  // Extract common properties
  const isAdminItem = 'item_type' in item
  const name = isAdminItem ? item.item_type.name : item.name
  const description = isAdminItem ? item.item_type.description : item.description
  const category = isAdminItem ? item.item_type.category : item.category

  const currentStock = isAdminItem ? item.current_quantity : (item.stock?.current_quantity || 0)
  const unitOfMeasure = isAdminItem ? item.unit_of_measure : item.stock?.unit_of_measure
  const availableStock = currentStock - reservedQuantity
  const isAvailable = availableStock > 0
  const isLowStock = isAdminItem ? item.is_low_stock : (item.stock?.is_low_stock || false)

  const getStatusColor = () => {
    if (!isAvailable) return { bg: 'bg-claro-red/10 dark:bg-claro-red/20', text: 'text-claro-red', icon: 'text-claro-red' }
    if (isLowStock) return { bg: 'bg-claro-warning/10 dark:bg-claro-warning/20', text: 'text-claro-warning', icon: 'text-claro-warning' }
    return { bg: 'bg-claro-green/10 dark:bg-claro-green/20', text: 'text-claro-green', icon: 'text-claro-green' }
  }

  const statusColor = getStatusColor()

  const handleAdjustStock = (action: StockAdjustmentAction, quantity: number) => {
    if (onAdjustStock) {
      onAdjustStock(action, quantity)
      setShowAdjustForm(false)
    }
  }

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
      {/* Icon and Stock */}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${statusColor.bg}`}>
          <svg className={`w-8 h-8 ${statusColor.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div className="text-right">
          <div className={`text-xl font-bold ${statusColor.text}`}>
            {availableStock}
          </div>
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            {unitOfMeasure || 'units'} disponibles
          </div>
          {reservedQuantity > 0 && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
              📦 {reservedQuantity} reservadas
            </div>
          )}
        </div>
      </div>

      {/* Item Info */}
      <div className="mb-3">
        <h3 className="font-semibold text-base mb-1 text-text-light dark:text-text-dark">{name}</h3>
        {description && (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Category and Status */}
      <div className="flex items-center justify-between mb-3">

        <span className={`text-xs font-medium ${statusColor.text}`}>
          {!isAvailable ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
        </span>
      </div>

      {/* Active Reservations Info */}
      {activeReservations.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Reservas Activas ({activeReservations.length})
            </span>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {activeReservations.slice(0, 3).map((reservation, index) => (
              <div key={index} className="text-xs text-blue-600 dark:text-blue-400 flex items-center justify-between">
                <span className="truncate">{reservation.username}</span>
                <span className="font-medium ml-2">{reservation.quantity} {unitOfMeasure}</span>
              </div>
            ))}
            {activeReservations.length > 3 && (
              <div className="text-xs text-blue-500 dark:text-blue-400 text-center">
                +{activeReservations.length - 3} más...
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Role Actions */}
      {role === 'user' && !showActions && (
        <button
          onClick={() => setShowActions(true)}
          disabled={!isAvailable || isRequesting}
          className="w-full claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Request
        </button>
      )}

      {role === 'user' && showActions && onRequest && onAddToCart && (
        <ConsumableActions
          item={item as ConsumableItem}
          onRequest={(quantity, markers) => {
            onRequest(quantity, markers)
            setShowActions(false)
          }}
          onAddToCart={(quantity, markers) => {
            onAddToCart(quantity, markers)
            setShowActions(false)
          }}
          isRequesting={isRequesting}
        />
      )}

      {/* Admin Role Actions */}
      {role === 'admin' && (
        <div className="space-y-2">
          {/* Quick Action Buttons */}
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 claro-button-secondary px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                title="Edit Details"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onUploadImage && (
              <button
                onClick={onUploadImage}
                className="flex-1 claro-button-secondary px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                title="Upload Image"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                title="Delete Consumable"
              >
                {isDeleting ? (
                  <div className="w-3.5 h-3.5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="w-full claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              View Details
            </button>
          )}
          {!showAdjustForm ? (
            <button
              onClick={() => setShowAdjustForm(true)}
              disabled={isAdjusting}
              className="w-full claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adjust Stock
            </button>
          ) : (
            <StockAdjustmentForm
              stock={item as ConsumableStockAdmin}
              onAdjust={handleAdjustStock}
              onCancel={() => setShowAdjustForm(false)}
              isAdjusting={isAdjusting}
            />
          )}
        </div>
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian propiedades relevantes
  const prevItem = 'item_type' in prevProps.item ? prevProps.item : prevProps.item
  const nextItem = 'item_type' in nextProps.item ? nextProps.item : nextProps.item

  return (
    prevItem.id === nextItem.id &&
    prevProps.isRequesting === nextProps.isRequesting &&
    prevProps.isAdjusting === nextProps.isAdjusting &&
    prevProps.reservedQuantity === nextProps.reservedQuantity &&
    prevProps.activeReservations?.length === nextProps.activeReservations?.length
  )
})

ConsumableCard.displayName = 'ConsumableCard'
