// Phase 2, Task 6: StockAdjustmentForm component (admin role)

import React, { useState } from 'react'
import { ConsumableStockAdmin, StockAdjustmentAction } from '@/types/consumables'

interface StockAdjustmentFormProps {
  stock: ConsumableStockAdmin
  onAdjust: (action: StockAdjustmentAction, quantity: number) => void
  onCancel: () => void
  isAdjusting: boolean
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  stock,
  onAdjust,
  onCancel,
  isAdjusting,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentAction>('adjust')
  const [quantity, setQuantity] = useState(0)

  const handleApply = () => {
    if (quantity !== 0 || adjustmentType === 'set') {
      onAdjust(adjustmentType, quantity)
    }
  }

  const getLabel = () => {
    switch (adjustmentType) {
      case 'adjust':
        return 'Adjustment (+/-)'
      case 'set':
        return 'New Quantity'
      case 'restock':
        return 'Restock Amount'
    }
  }

  const getPlaceholder = () => {
    switch (adjustmentType) {
      case 'adjust':
        return 'Enter +/- amount'
      case 'set':
        return 'Enter new quantity'
      case 'restock':
        return 'Enter restock amount'
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Action
          </label>
          <select
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value as StockAdjustmentAction)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            <option value="adjust">Adjust (+/-)</option>
            <option value="set">Set Exact Amount</option>
            <option value="restock">Restock (+)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            {getLabel()}
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder={getPlaceholder()}
          />
        </div>

        {/* Current Stock Info */}
        <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Current Stock: <span className="font-medium text-text-light dark:text-text-dark">{stock.current_quantity} {stock.unit_of_measure || 'units'}</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleApply}
            disabled={isAdjusting || (adjustmentType !== 'set' && quantity === 0)}
            className="flex-1 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdjusting ? 'Adjusting...' : 'Apply'}
          </button>
          <button
            onClick={onCancel}
            disabled={isAdjusting}
            className="flex-1 claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
