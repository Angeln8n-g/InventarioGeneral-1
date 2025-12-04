// Phase 2, Task 5: ConsumableActions component (user role)

import React, { useState, useCallback } from 'react'
import { ShoppingCart } from 'lucide-react'
import { ConsumableItem } from '@/types/consumables'
import { isCableUnit } from '@/utils/cableDetection'
import { CableMeasurementCalculator } from './CableMeasurementCalculator'

interface CableCalculationResult {
  startMarker: number
  endMarker: number
  length: number
}

interface ConsumableActionsProps {
  item: ConsumableItem
  onRequest: (quantity: number, markers?: { startMarker: number; endMarker: number }) => void
  onAddToCart: (quantity: number, markers?: { startMarker: number; endMarker: number }) => void
  isRequesting: boolean
}

export const ConsumableActions: React.FC<ConsumableActionsProps> = ({
  item,
  onRequest,
  onAddToCart,
  isRequesting,
}) => {
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [cableResult, setCableResult] = useState<CableCalculationResult | null>(null)
  const currentStock = item.stock?.current_quantity || 0
  const unitOfMeasure = item.stock?.unit_of_measure || 'units'
  const isCable = isCableUnit(unitOfMeasure)

  const handleCableCalculation = useCallback((result: CableCalculationResult) => {
    setCableResult(result)
  }, [])

  const handleQuantityChange = (value: string) => {
    if (value === '') {
      setQuantity('')
      return
    }
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantity(Math.min(numValue, currentStock))
    }
  }

  const incrementQuantity = () => {
    const current = quantity === '' ? 0 : quantity
    setQuantity(Math.min(current + 1, currentStock))
  }

  const decrementQuantity = () => {
    const current = quantity === '' ? 0 : quantity
    setQuantity(Math.max(0, current - 1))
  }

  const setQuickQuantity = (value: number) => {
    setQuantity(Math.min(value, currentStock))
  }

  const handleRequest = () => {
    if (isCable) {
      if (cableResult && cableResult.length > 0) {
        onRequest(cableResult.length, { startMarker: cableResult.startMarker, endMarker: cableResult.endMarker })
        setCableResult(null)
      }
    } else {
      const finalQuantity = quantity === '' ? 1 : quantity
      if (finalQuantity > 0) {
        onRequest(finalQuantity)
        setQuantity(1)
      }
    }
  }

  const handleAddToCart = () => {
    if (isCable) {
      if (cableResult && cableResult.length > 0) {
        onAddToCart(cableResult.length, { startMarker: cableResult.startMarker, endMarker: cableResult.endMarker })
        setCableResult(null)
      }
    } else {
      const finalQuantity = quantity === '' ? 1 : quantity
      if (finalQuantity > 0) {
        onAddToCart(finalQuantity)
        setQuantity(1)
      }
    }
  }

  // Render cable calculator for meters/feet units
  if (isCable) {
    return (
      <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        <CableMeasurementCalculator
          mode="consumption"
          unitOfMeasure={unitOfMeasure}
          maxAvailableLength={currentStock}
          onValidChange={handleCableCalculation}
        />

        {/* Action Buttons for Cable */}
        <div className="space-y-2">
          <button
            onClick={handleAddToCart}
            disabled={!cableResult || cableResult.length <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar al Carrito</span>
          </button>

          <button
            onClick={handleRequest}
            disabled={isRequesting || !cableResult || cableResult.length <= 0}
            className="w-full claro-button-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'Requesting...' : 'Solicitar Ahora'}
          </button>
        </div>
      </div>
    )
  }

  // Standard quantity selector for non-cable items
  return (
    <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
      {/* Quick Quantity Buttons */}
      <div className="flex gap-2">
        {[1, 5, 10].map((value) => (
          <button
            key={value}
            onClick={() => setQuickQuantity(value)}
            disabled={value > currentStock}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              quantity === value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Quantity Input with +/- Buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={decrementQuantity}
          className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-text-light dark:text-text-dark transition-all font-bold text-lg"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          onBlur={() => {
            if (quantity === '' || quantity === 0) {
              setQuantity(1)
            }
          }}
          placeholder="1"
          className="w-20 text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-semibold bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
          aria-label="Quantity"
        />
        <button
          onClick={incrementQuantity}
          disabled={(quantity === '' ? 0 : quantity) >= currentStock}
          className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-text-light dark:text-text-dark transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Stock Info */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        Available: {currentStock} {unitOfMeasure}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleAddToCart}
          disabled={quantity === '' || quantity === 0 || (quantity as number) > currentStock}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Agregar al Carrito</span>
        </button>

        <button
          onClick={handleRequest}
          disabled={isRequesting || quantity === '' || quantity === 0 || (quantity as number) > currentStock}
          className="w-full claro-button-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequesting ? 'Requesting...' : 'Solicitar Ahora'}
        </button>
      </div>
    </div>
  )
}
