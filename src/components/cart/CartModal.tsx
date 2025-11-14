'use client'

import React, { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { X, ShoppingCart, Trash2, Plus, Minus, Calendar, Zap } from 'lucide-react'
import { RESERVATION_CONFIG } from '@/config/reservations.config'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  onReserve?: (expirationDate: string, purpose?: string) => Promise<void>
}

export function CartModal({ isOpen, onClose, onConfirm, onReserve }: CartModalProps) {
  const { items, removeItem, updateQuantity, clearCart, getTotalItems } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionType, setActionType] = useState<'consume' | 'reserve'>('consume')
  const [expirationDays, setExpirationDays] = useState(RESERVATION_CONFIG.DEFAULT_RESERVATION_DAYS)
  const [purpose, setPurpose] = useState('')

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      if (actionType === 'reserve' && onReserve) {
        // Calculate expiration date
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + expirationDays)
        await onReserve(expirationDate.toISOString(), purpose || undefined)
      } else {
        await onConfirm()
      }
      onClose()
      // Reset form
      setActionType('consume')
      setPurpose('')
      setExpirationDays(7)
    } catch (error) {
      console.error('Error confirming cart:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearCart = () => {
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      clearCart()
    }
  }

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="scale"
      speed="normal"
      enableHaptics={true}
      className="!max-w-md !w-full !h-[85vh] !max-h-[85vh] flex flex-col !rounded-2xl !overflow-hidden !mx-4"
      data-cart-modal="true"
    >
      <div className="flex flex-col h-full max-h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Mi Carrito
            </h2>
            <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs font-medium px-2 py-1 rounded-full">
              {items.length}
            </span>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Carrito Vacío
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Agrega materiales para solicitar
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                    {item.category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        updateQuantity(item.id, value)
                      }}
                      className="w-16 text-center border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      min="1"
                      max={item.available_stock}
                    />
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.available_stock}
                      className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.unit_of_measure || 'units'}
                  </span>
                </div>

                {/* Stock Warning */}
                {item.quantity >= item.available_stock && (
                  <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Cantidad máxima disponible
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 flex-shrink-0 max-h-[50vh] overflow-y-auto overflow-x-hidden min-h-0">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total de items:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {getTotalItems()} unidades
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tipos de materiales:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {items.length}
                </span>
              </div>
            </div>

            {/* Action Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de acción:
              </label>

              {/* Consume Option */}
              <button
                onClick={() => setActionType('consume')}
                className={`w-full p-3 rounded-lg border-2 transition-all ${actionType === 'consume'
                  ? 'border-red-600 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${actionType === 'consume' ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                    <Zap className={`w-5 h-5 ${actionType === 'consume' ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${actionType === 'consume' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                      }`}>
                      Consumir Ahora
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Solicitar y usar inmediatamente
                    </div>
                  </div>
                </div>
              </button>

              {/* Reserve Option */}
              {onReserve && (
                <button
                  onClick={() => setActionType('reserve')}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${actionType === 'reserve'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${actionType === 'reserve' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                      <Calendar className={`w-5 h-5 ${actionType === 'reserve' ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                        }`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${actionType === 'reserve' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                        }`}>
                        Reservar para Después
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Apartar materiales para recoger más tarde
                      </div>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Reservation Options */}
            {actionType === 'reserve' && onReserve && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Válido por:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {RESERVATION_CONFIG.QUICK_DURATION_OPTIONS.map((days) => (
                      <button
                        key={days}
                        onClick={() => setExpirationDays(days)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${expirationDays === days
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                          }`}
                      >
                        {days} días
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Expira: {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Propósito (opcional):
                  </label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="¿Para qué necesitas estos materiales?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {purpose.length}/200 caracteres
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`w-full font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${actionType === 'reserve'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
              >
                {isSubmitting
                  ? 'Procesando...'
                  : actionType === 'reserve'
                    ? '📅 Crear Reserva'
                    : '⚡ Confirmar Solicitud'}
              </button>
              <button
                onClick={handleClearCart}
                disabled={isSubmitting}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Vaciar Carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </TransitionDialog>
  )
}
