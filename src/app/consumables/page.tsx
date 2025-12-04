'use client'

import React, { useState, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { useGetConsumablesQuery } from '@/services/api'
import { CartProvider, useCart } from '@/contexts/CartContext'
import { CartButton } from '@/components/cart/CartButton'
import { ConsumableSummary, QuickActions, ReservationButtons, ConsumableList } from '@/components/consumables'
import { ConsumableItem } from '@/types/consumables'
import { toastSuccess, toastError, toastInfo } from '@/lib/toast'
import { SwipeContainer } from '@/components/ui/SwipeContainer'

// Shared loading spinner component
const ModalSpinner = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
  </div>
)

// Lazy load heavy components with shared spinner - Simplified for Turbopack
const CartModal = dynamic(() => import('@/components/cart/CartModal').then(mod => ({ default: mod.CartModal })), {
  loading: ModalSpinner,
  ssr: false
})
const CategoryConsumablesModal = dynamic(() => import('@/components/consumables').then(mod => ({ default: mod.CategoryConsumablesModal })), {
  loading: ModalSpinner,
  ssr: false
})
const ReturnMaterialsModal = dynamic(() => import('@/components/dashboard/ReturnMaterialsModal').then(mod => ({ default: mod.ReturnMaterialsModal })), {
  loading: ModalSpinner,
  ssr: false
})
const MyReservationsModal = dynamic(() => import('@/components/reservations').then(mod => ({ default: mod.MyReservationsModal })), {
  loading: ModalSpinner,
  ssr: false
})
const AllReservationsModal = dynamic(() => import('@/components/reservations').then(mod => ({ default: mod.AllReservationsModal })), {
  loading: ModalSpinner,
  ssr: false
})
const ReservationsHistoryModal = dynamic(() => import('@/components/reservations').then(mod => ({ default: mod.ReservationsHistoryModal })), {
  loading: ModalSpinner,
  ssr: false
})

function ConsumablesPageContent() {
  const { user } = useSelector((state: RootState) => state.auth)
  const [requestingItemId, setRequestingItemId] = useState<number | null>(null)
  const [showCart, setShowCart] = useState(false)
  const [isReturnMaterialsModalOpen, setIsReturnMaterialsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showMyReservations, setShowMyReservations] = useState(false)
  const [showAllReservations, setShowAllReservations] = useState(false)
  const [showReservationsHistory, setShowReservationsHistory] = useState(false)
  const { addItem, items: cartItems, clearCart } = useCart()

  const { data: consumablesData, isLoading, refetch } = useGetConsumablesQuery(undefined, {
    refetchOnFocus: false,
    refetchOnMountOrArgChange: 300,
  })

  const consumables = useMemo(
    () => (consumablesData?.data || []) as unknown as ConsumableItem[],
    [consumablesData]
  )

  // Memoized handlers to prevent unnecessary re-renders
  const handleRequestConsumable = useCallback(async (itemTypeId: number, quantity: number, markers?: { startMarker: number; endMarker: number }) => {
    setRequestingItemId(itemTypeId)

    try {
      const response = await fetch('/api/consumables/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          item_type_id: itemTypeId,
          requested_quantity: quantity,
          // Include cable markers if provided
          ...(markers && {
            start_marker: markers.startMarker,
            end_marker: markers.endMarker,
          }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to request consumable')
      }

      const data = await response.json()

      if (data.fulfilled) {
        toastSuccess('Request fulfilled successfully! Items have been allocated to you.')
      } else {
        toastInfo('Request created successfully! You will be notified when items are available.')
      }

      refetch()
    } catch (error: unknown) {
      console.error('Request error:', error)
      toastError(`Failed to request consumable: ${(error instanceof Error ? error.message : 'Unknown error')}`)
    } finally {
      setRequestingItemId(null)
    }
  }, [refetch])

  const handleAddToCart = useCallback((item: ConsumableItem, quantity: number, markers?: { startMarker: number; endMarker: number }) => {
    addItem({
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category,
      unit_of_measure: item.stock?.unit_of_measure,
      available_stock: item.stock?.current_quantity || 0,
      // Include cable markers if provided
      ...(markers && {
        start_marker: markers.startMarker,
        end_marker: markers.endMarker,
      }),
    }, quantity)

    toastSuccess(`${item.name} agregado al carrito (${quantity} ${item.stock?.unit_of_measure || 'units'})`)
  }, [addItem])

  const handleConfirmCart = useCallback(async () => {
    try {
      const promises = cartItems.map(item =>
        fetch('/api/consumables/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            item_type_id: item.id,
            requested_quantity: item.quantity,
            // Include cable markers if present
            ...(item.start_marker !== undefined && item.end_marker !== undefined && {
              start_marker: item.start_marker,
              end_marker: item.end_marker,
            }),
          }),
        })
      )

      const responses = await Promise.all(promises)

      // Build detailed failure messages mapped to items
      const detailedResults = await Promise.all(
        responses.map(async (response, index) => {
          if (response.ok) {
            return { ok: true, itemName: cartItems[index].name }
          }
          let message = response.statusText
          try {
            const errorData = await response.json()
            message = errorData?.error?.message || message
          } catch (_) {
            // ignore JSON parse errors
          }
          return { ok: false, itemName: cartItems[index].name, message }
        })
      )

      const failed = detailedResults.filter(r => !r.ok)

      if (failed.length === 0) {
        clearCart()
        toastSuccess(`Todas las solicitudes han sido enviadas exitosamente! (${cartItems.length} items)`) 
        refetch()
        return
      }

      // At least one request failed — show a helpful error and keep the cart intact
      const summary = failed
        .map(f => `${f.itemName}${f.message ? `: ${f.message}` : ''}`)
        .join('; ')
      toastError(`Algunas solicitudes fallaron. Revisa y vuelve a intentar. (${summary})`)
      return
    } catch (error) {
      console.error('Error confirming cart:', error)
      toastError('Error al procesar las solicitudes. Por favor, intenta de nuevo.')
      // Do not rethrow to avoid noisy console errors
      return
    }
  }, [cartItems, clearCart, refetch])

  const handleReserveCart = useCallback(async (expirationDate: string, purpose?: string) => {
    try {
      const promises = cartItems.map(item =>
        fetch('/api/reservations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            item_type_id: item.id,
            reserved_quantity: item.quantity,
            expiration_date: expirationDate,
            purpose,
            // Include cable markers if present
            ...(item.start_marker !== undefined && item.end_marker !== undefined && {
              start_marker: item.start_marker,
              end_marker: item.end_marker,
            }),
          }),
        })
      )

      const responses = await Promise.all(promises)
      const failedResponses = responses.filter(response => !response.ok)

      if (failedResponses.length === 0) {
        clearCart()
        toastSuccess(`¡Reservas creadas exitosamente! (${cartItems.length} items)`)
        refetch()
      } else {
        const errorData = await failedResponses[0].json()
        const errorMessage = errorData.error?.message || 'Error al crear las reservas'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error creating reservations:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al crear las reservas. Por favor, intenta de nuevo.'
      toastError(errorMessage)
      throw error
    }
  }, [cartItems, clearCart, refetch])

  // Optimized modal close handlers - only refetch when necessary
  const handleCloseWithRefresh = useCallback(() => {
    setShowCart(false)
    refetch()
  }, [refetch])

  const handleCloseCategoryModal = useCallback(() => {
    setSelectedCategory(null)
    refetch()
  }, [refetch])

  const handleCloseReturnModal = useCallback(() => {
    setIsReturnMaterialsModalOpen(false)
    refetch()
  }, [refetch])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Materiales y Reservas">
          <div className="px-4 py-6">
            {/* Skeleton loader for better UX */}
            <div className="space-y-6 animate-pulse">
              {/* Summary skeleton */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-24" />
                ))}
              </div>
              {/* Quick actions skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-32" />
                ))}
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout title="Materiales y Reservas">
        <div className="relative min-h-screen">
          {/* Background optimizado con Next.js Image */}
          <div className="fixed inset-0 -z-20">
            <Image
              src="/images/materiales-reservas-background.jpg"
              alt="Background"
              fill
              className="object-cover"
              priority
              quality={75}
              sizes="100vw"
            />
          </div>

          {/* Overlay fijo para mejorar legibilidad */}
          <div className="fixed inset-0 -z-10 bg-white/50 dark:bg-gray-900/50" />

          <SwipeContainer enabled={true}>
            {/* Contenido con padding inferior extra para la barra de navegación */}
            <div className="relative z-0 px-4 py-6 min-h-[calc(100vh-4rem)] pb-32">
              {/* Summary */}
              <ConsumableSummary items={consumables} role="user" />

              {/* Reservation Management Buttons */}
              {user && (
                <ReservationButtons
                  onMyReservationsClick={() => setShowMyReservations(true)}
                  onAllReservationsClick={() => setShowAllReservations(true)}
                  onHistoryClick={() => setShowReservationsHistory(true)}
                  userId={user.id}
                />
              )}

              {/* Quick Actions */}
              <QuickActions onCategoryClick={setSelectedCategory} />

              {/* Consumables List */}
              <ConsumableList
                items={consumables}
                role="user"
                onRequest={handleRequestConsumable}
                onAddToCart={handleAddToCart}
                requestingItemId={requestingItemId}
                isLoading={false}
              />
            </div>
          </SwipeContainer>
        </div>

        {/* Floating Action Buttons - Grouped */}
        <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-3">
          {/* Cart Button */}
          <CartButton onClick={() => setShowCart(true)} />

          {/* Return Materials Button */}
          <button
            onClick={() => setIsReturnMaterialsModalOpen(true)}
            className="bg-claro-red hover:bg-red-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 flex items-center justify-center group"
            aria-label="Devolver materiales"
            title="Devolver materiales no utilizados"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Modals - Only render when open for better performance */}
        {showCart && (
          <CartModal
            isOpen={showCart}
            onClose={handleCloseWithRefresh}
            onConfirm={handleConfirmCart}
            onReserve={handleReserveCart}
          />
        )}

        {isReturnMaterialsModalOpen && (
          <ReturnMaterialsModal
            isOpen={isReturnMaterialsModalOpen}
            onClose={handleCloseReturnModal}
            onSuccess={refetch}
          />
        )}

        {selectedCategory && (
          <CategoryConsumablesModal
            isOpen={!!selectedCategory}
            onClose={handleCloseCategoryModal}
            category={selectedCategory}
            items={consumables}
            onRequest={handleRequestConsumable}
            onAddToCart={handleAddToCart}
            requestingItemId={requestingItemId}
          />
        )}

        {user && (
          <>
            {showMyReservations && (
              <MyReservationsModal
                isOpen={showMyReservations}
                onClose={() => setShowMyReservations(false)}
                userId={user.id}
              />
            )}
            {showAllReservations && (
              <AllReservationsModal
                isOpen={showAllReservations}
                onClose={() => setShowAllReservations(false)}
              />
            )}
            {showReservationsHistory && (
              <ReservationsHistoryModal
                isOpen={showReservationsHistory}
                onClose={() => setShowReservationsHistory(false)}
              />
            )}
          </>
        )}
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function ConsumablesPage() {
  return (
    <CartProvider>
      <ConsumablesPageContent />
    </CartProvider>
  )
}
