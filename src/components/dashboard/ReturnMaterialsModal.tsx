'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { ShoppingCart } from 'lucide-react'
import { ReturnCartProvider, useReturnCart } from '@/contexts/ReturnCartContext'
import { ConsumptionDatePicker } from '@/components/returns/ConsumptionDatePicker'
import { ReturnableItemsList } from '@/components/returns/ReturnableItemsList'
import { ReturnCartModal } from '@/components/returns/ReturnCartModal'
import { toastSuccess, toastError } from '@/lib/toast'
import { useReturnConsumableMutation, useGetMyConsumptionsQuery } from '@/services/api'

interface ReturnMaterialsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function ReturnMaterialsModalContent({
  isOpen,
  onClose,
  onSuccess,
}: ReturnMaterialsModalProps) {
  const { items: cartItems, clearCart } = useReturnCart()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // RTK Query hooks
  const [returnConsumable] = useReturnConsumableMutation()
  const { data: consumptionsData, isLoading: isLoadingItems, refetch } = useGetMyConsumptionsQuery()

  // Filter consumption items by selected date
  const consumptionItems = selectedDate
    ? (consumptionsData?.data.find(d => d.consumption_date === selectedDate)?.items || [])
    : []

  const handleConfirmReturn = async () => {
    if (cartItems.length === 0) return

    setError(null)

    try {
      const returns = cartItems.map((item) => ({
        item_type_id: item.id,
        returned_quantity: item.quantity,
        consumption_date: item.consumption_date,
        notes: `Devolución de ${item.quantity} ${item.unit_of_measure} de ${item.name}`,
      }))

      // Use RTK Query mutation
      const result = await returnConsumable({ returns }).unwrap()

      // Clear cart and show success
      clearCart()
      toastSuccess(`${result.message} - Total devuelto: ${result.total_returned} tipo(s) de items`)

      // Refetch consumption items (cache will be automatically invalidated)
      refetch()

      // Close modal and refresh dashboard
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 450)
    } catch (error) {
      console.error('Error processing returns:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      toastError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
        <ModalHeader
          title="Devolver Materiales"
          onClose={onClose}
        />

        <div className="p-6">
          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  ¿Cómo funciona?
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Selecciona la fecha en que tomaste los materiales.</li>
                  <li>Elige los materiales que deseas devolver y las cantidades.</li>
                  <li>Agrégalos al carrito de devolución.</li>
                  <li>Confirma la devolución para actualizar el stock.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Date Picker */}
            <div className="lg:col-span-1">
              <ConsumptionDatePicker
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            </div>

            {/* Right Column: Items List */}
            <div className="lg:col-span-2">
              {!selectedDate ? (
                <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-12 border border-gray-200 dark:border-gray-700 text-center">
                  <svg
                    className="w-20 h-20 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
                    Selecciona una fecha
                  </h3>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    Elige una fecha de consumo para ver los items que puedes devolver
                  </p>
                </div>
              ) : (
                <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-text-light dark:text-text-dark">
                      Items Consumidos
                    </h2>
                    <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {selectedDate}
                    </span>
                  </div>

                  {isLoadingItems ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
                      <span className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">
                        Cargando items...
                      </span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-claro-red mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-claro-red mb-4">{error}</p>
                      <button
                        onClick={() => refetch()}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  ) : (
                    <ReturnableItemsList
                      items={consumptionItems}
                      consumptionDate={selectedDate}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart Footer - Show when there are items in cart */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                  Carrito de Devoluciones
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • {cartItems.reduce((sum, item) => sum + item.quantity, 0)} unidades totales
                </p>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ver Carrito</span>
              </button>
            </div>

            {/* Quick preview of cart items */}
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {cartItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded px-2 py-1">
                  <span className="text-text-light dark:text-text-dark truncate flex-1">
                    {item.name}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark ml-2">
                    {item.quantity} {item.unit_of_measure}
                  </span>
                </div>
              ))}
              {cartItems.length > 3 && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                  +{cartItems.length - 3} más...
                </p>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Return Cart Modal */}
      <ReturnCartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onConfirm={handleConfirmReturn}
      />
    </>
  )
}

// Wrapper with ReturnCartProvider
export const ReturnMaterialsModal: React.FC<ReturnMaterialsModalProps> = (props) => {
  return (
    <ReturnCartProvider>
      <ReturnMaterialsModalContent {...props} />
    </ReturnCartProvider>
  )
}
