'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { ReturnCartProvider, useReturnCart } from '@/contexts/ReturnCartContext'
import { ConsumptionDatePicker } from '@/components/returns/ConsumptionDatePicker'
import { ReturnableItemsList } from '@/components/returns/ReturnableItemsList'
import { ReturnButton } from '@/components/returns/ReturnButton'
import { ReturnScanner } from '@/components/returns/ReturnScanner'
import { useReturnConsumableMutation, useGetMyConsumptionsQuery } from '@/services/api'
import { OptimizedBackgroundImage } from '@/components/ui/OptimizedBackgroundImage'
import { SwipeContainer } from '@/components/ui/SwipeContainer'
import { toastSuccess, toastError } from '@/lib/toast'
import { BACKGROUND_IMAGES } from '@/types/images'

// Lazy load modal
const ReturnCartModal = dynamic(() => import('@/components/returns/ReturnCartModal').then(mod => ({ default: mod.ReturnCartModal })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
})



function ReturnPageContent() {
  const router = useRouter()
  const { items: cartItems, clearCart } = useReturnCart()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // RTK Query hooks
  const [returnConsumable] = useReturnConsumableMutation()
  const { data: consumptionsData, isLoading: isLoadingItems, refetch } = useGetMyConsumptionsQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
  })

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
        segment_start: item.segment_start,
        segment_end: item.segment_end,
      }))

      // Use RTK Query mutation
      const result = await returnConsumable({ returns }).unwrap()

      // Clear cart and show success
      clearCart()
      toastSuccess(`${result.message} - Total devuelto: ${result.total_returned} tipo(s) de items`)

      // Refetch consumption items (cache will be automatically invalidated)
      refetch()

      // Optionally redirect to dashboard
      // router.push('/dashboard?success=returns_processed')
    } catch (error) {
      console.error('Error processing returns:', error)
      setError(error instanceof Error ? error.message : 'Unknown error')
      toastError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  return (
    <ProtectedRoute>
      <SwipeContainer enabled={true}>
        <AppLayout title="Devolver Materiales">
        <OptimizedBackgroundImage
          src={BACKGROUND_IMAGES.consumablesReturn.src}
          alt={BACKGROUND_IMAGES.consumablesReturn.alt}
          priority={BACKGROUND_IMAGES.consumablesReturn.priority}
          quality={BACKGROUND_IMAGES.consumablesReturn.quality}
          overlayOpacity={BACKGROUND_IMAGES.consumablesReturn.overlayOpacity}
          darkOverlayOpacity={BACKGROUND_IMAGES.consumablesReturn.darkOverlayOpacity}
        >
          <div className="px-4 py-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.back()}
                  className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-text-light dark:text-text-dark">
                    Devolver Materiales
                  </h1>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Devuelve los materiales no utilizados de tus prácticas
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                  <li>Selecciona la fecha en que consumiste los items</li>
                  <li>Elige los items que deseas devolver y las cantidades</li>
                  <li>Agrégalos al carrito de devolución</li>
                  <li>Confirma la devolución para actualizar el stock</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Date Picker */}
            <div className="lg:col-span-1 space-y-6">
              <ConsumptionDatePicker
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />

              {/* Scanner QR */}
              <ReturnScanner
                selectedDate={selectedDate}
                onItemScanned={() => {
                  // Refresh items when something is scanned (cache will auto-invalidate)
                  refetch()
                }}
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
                      <Button
                        variant="secondary"
                        onClick={() => refetch()}
                      >
                        Reintentar
                      </Button>
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
        </OptimizedBackgroundImage>

        {/* Return Cart Button */}
        <ReturnButton onClick={() => setShowCart(true)} />

        {/* Return Cart Modal */}
        <ReturnCartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          onConfirm={handleConfirmReturn}
        />
      </AppLayout>
      </SwipeContainer>
    </ProtectedRoute>
  )
}

export default function ReturnPage() {
  return (
    <ReturnCartProvider>
      <ReturnPageContent />
    </ReturnCartProvider>
  )
}
