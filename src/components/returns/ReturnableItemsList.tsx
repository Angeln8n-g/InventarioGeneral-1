'use client'

import React, { useState } from 'react'
import { useReturnCart } from '@/contexts/ReturnCartContext'
import { isCableUnit } from '@/utils/cableDetection'
import { CableMeasurementCalculator } from '@/components/consumables/CableMeasurementCalculator'

interface ReturnableItem {
  item_type_id: number
  consumable_stock_id: number
  item_name: string
  item_description?: string
  consumed_quantity: number
  returned_quantity: number
  returnable_quantity: number
  unit_of_measure: string
}

interface ReturnableItemsListProps {
  items: ReturnableItem[]
  consumptionDate: string
}

export function ReturnableItemsList({ items, consumptionDate }: ReturnableItemsListProps) {
  const { addItem } = useReturnCart()
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [segments, setSegments] = useState<Record<number, { startMarker: number; endMarker: number; length: number } | null>>({})
  const [legacyMode, setLegacyMode] = useState<Record<number, boolean>>({})

  const handleQuantityChange = (itemId: number, value: string, maxReturnable: number) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0) {
      // Limit to max returnable quantity
      const validQuantity = Math.min(num, maxReturnable)
      setQuantities((prev) => ({ ...prev, [itemId]: validQuantity }))
    }
  }

  const handleAddToCart = (item: ReturnableItem) => {
    const isCable = isCableUnit(item.unit_of_measure || null)
    const isLegacy = legacyMode[item.consumable_stock_id] === true
    if (isCable && !isLegacy) {
      const payload = segments[item.consumable_stock_id]
      const length = payload?.length || 0
      if (!payload || length <= 0 || length > item.returnable_quantity) {
        alert(`Segmento inválido. Máximo devolvible: ${item.returnable_quantity} ${item.unit_of_measure}`)
        return
      }
      addItem(
        {
          id: item.item_type_id,
          name: item.item_name,
          description: item.item_description,
          consumption_date: consumptionDate,
          max_returnable: item.returnable_quantity,
          unit_of_measure: item.unit_of_measure,
          consumable_stock_id: item.consumable_stock_id,
          segment_start: payload.startMarker,
          segment_end: payload.endMarker,
        },
        length
      )
      alert(`✅ ${item.item_name} agregado al carrito (${length} ${item.unit_of_measure}) segmento ${payload.startMarker}→${payload.endMarker}`)
      setSegments((prev) => ({ ...prev, [item.consumable_stock_id]: null }))
      return
    }

    const quantity = quantities[item.item_type_id] || 1
    if (quantity > item.returnable_quantity) {
      alert(`No puedes devolver más de ${item.returnable_quantity} ${item.unit_of_measure}`)
      return
    }
    addItem(
      {
        id: item.item_type_id,
        name: item.item_name,
        description: item.item_description,
        consumption_date: consumptionDate,
        max_returnable: item.returnable_quantity,
        unit_of_measure: item.unit_of_measure,
        consumable_stock_id: item.consumable_stock_id,
      },
      quantity
    )
    setQuantities((prev) => ({ ...prev, [item.item_type_id]: 1 }))
    alert(`✅ ${item.item_name} agregado al carrito (${quantity} ${item.unit_of_measure})`)
  }

  const setQuickQuantity = (itemId: number, value: number, maxReturnable: number) => {
    const validValue = Math.min(value, maxReturnable)
    setQuantities((prev) => ({ ...prev, [itemId]: validValue }))
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <svg 
          className="w-16 h-16 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
          />
        </svg>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          No hay items devolvibles para esta fecha
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const quantity = quantities[item.item_type_id] || 1
        const canReturn = item.returnable_quantity > 0

        return (
          <div
            key={item.item_type_id}
            className={`bg-card-light dark:bg-card-dark rounded-lg p-4 border-2 transition-all ${
              canReturn
                ? 'border-gray-200 dark:border-gray-700 hover:border-claro-green/50'
                : 'border-gray-200 dark:border-gray-700 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-text-light dark:text-text-dark mb-1">
                  {item.item_name}
                </h4>
                {item.item_description && (
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">
                    {item.item_description}
                  </p>
                )}
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">
                    Consumido: <span className="font-semibold text-text-light dark:text-text-dark">{item.consumed_quantity}</span>
                  </span>
                  {item.returned_quantity > 0 && (
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      Ya devuelto: <span className="font-semibold text-claro-warning">{item.returned_quantity}</span>
                    </span>
                  )}
                  <span className={canReturn ? 'text-claro-green font-semibold' : 'text-claro-red font-semibold'}>
                    Devolvible: {item.returnable_quantity} {item.unit_of_measure}
                  </span>
                  {isCableUnit(item.unit_of_measure || null) && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] ${
                      legacyMode[item.consumable_stock_id]
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'border-blue-500 text-blue-600 dark:text-blue-400'
                    }`}>
                      {legacyMode[item.consumable_stock_id] ? 'Legado (sin marcadores)' : 'Marcadores activos'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {canReturn && (
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                {isCableUnit(item.unit_of_measure || null) && !legacyMode[item.consumable_stock_id] ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        <input
                          type="checkbox"
                          checked={legacyMode[item.consumable_stock_id] === true}
                          onChange={(e) => setLegacyMode((prev) => ({ ...prev, [item.consumable_stock_id]: e.target.checked }))}
                        />
                        Devolver sin marcadores (legado)
                      </label>
                    </div>
                    <CableMeasurementCalculator
                      mode="return"
                      unitOfMeasure={item.unit_of_measure}
                      consumedLength={item.consumed_quantity}
                      alreadyReturned={item.returned_quantity}
                      onValidChange={(payload) => {
                        setSegments((prev) => ({ ...prev, [item.consumable_stock_id]: payload }))
                      }}
                    />
                  </div>
                ) : (
                  <>
                    {/* Quick Quantity Buttons */}
                    <div className="flex gap-2">
                      {[1, 5, 10].map((value) => (
                        <button
                          key={value}
                          onClick={() => setQuickQuantity(item.item_type_id, value, item.returnable_quantity)}
                          disabled={value > item.returnable_quantity}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            quantity === value
                              ? 'bg-claro-red text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>

                    {/* Quantity Input */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantities((prev) => ({ ...prev, [item.item_type_id]: Math.max(1, quantity - 1) }))}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-bold text-lg"
                      >
                        −
                      </button>

                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleQuantityChange(item.item_type_id, e.target.value, item.returnable_quantity)}
                        onBlur={() => {
                          // Ensure minimum value of 1 on blur
                          if (!quantity || quantity === 0) {
                            setQuantities((prev) => ({ ...prev, [item.item_type_id]: 1 }))
                          }
                        }}
                        min={1}
                        max={item.returnable_quantity}
                        className="flex-1 text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-semibold bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:border-claro-red focus:ring-2 focus:ring-claro-red/20 transition-all"
                      />

                      <button
                        onClick={() => setQuantities((prev) => ({ ...prev, [item.item_type_id]: Math.min(item.returnable_quantity, quantity + 1) }))}
                        disabled={quantity >= item.returnable_quantity}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>

                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark min-w-[60px]">
                        {item.unit_of_measure}
                      </span>
                    </div>
                  </>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={
                    isCableUnit(item.unit_of_measure || null) && !legacyMode[item.consumable_stock_id]
                      ? !segments[item.consumable_stock_id] || (segments[item.consumable_stock_id]?.length || 0) <= 0 || (segments[item.consumable_stock_id]?.length || 0) > item.returnable_quantity
                      : quantity <= 0 || quantity > item.returnable_quantity
                  }
                  className="w-full bg-claro-red hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Agregar al Carrito</span>
                </button>
              </div>
            )}

            {!canReturn && (
              <div className="mt-3 text-center py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Ya has devuelto todo lo consumido
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
