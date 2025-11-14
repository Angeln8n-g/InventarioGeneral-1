'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface QuantityModalProps {
  isOpen: boolean
  itemName: string
  availableStock: number
  unitOfMeasure?: string
  initialQuantity?: number
  onConfirm: (quantity: number) => void
  onCancel: () => void
}

export const QuantityModal: React.FC<QuantityModalProps> = ({
  isOpen,
  itemName,
  availableStock,
  unitOfMeasure = 'units',
  initialQuantity = 1,
  onConfirm,
  onCancel,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity)

  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity)
    }
  }, [isOpen, initialQuantity])

  if (!isOpen) return null

  const handleConfirm = () => {
    if (quantity > 0 && quantity <= availableStock) {
      onConfirm(quantity)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className="bg-card-light dark:bg-card-dark rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-scale-in"
        onKeyDown={handleKeyPress}
      >
        <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4">
          {itemName}
        </h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
          Available: {availableStock} {unitOfMeasure}
        </p>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Quantity to consume
          </label>
          <input
            type="number"
            min="1"
            max={availableStock}
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1
              setQuantity(Math.max(1, Math.min(availableStock, value)))
            }}
            className="w-full px-4 py-2 bg-card-light dark:bg-card-dark border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-claro-red focus:border-transparent text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark transition-all"
            autoFocus
          />
          {quantity > availableStock && (
            <p className="text-xs text-claro-red mt-1">
              Quantity exceeds available stock
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={onCancel} 
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirm} 
            className="flex-1"
            disabled={quantity < 1 || quantity > availableStock}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  )
}
