'use client'

import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useViewTransition } from '@/hooks/useViewTransition'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { CartProvider, useCart } from '@/contexts/CartContext'
import { CartButton } from '@/components/cart/CartButton'
import { ShoppingCart } from 'lucide-react'
import { SwipeContainer } from '@/components/ui/SwipeContainer'
import { useConsumeConsumableMutation } from '@/services/api'
import { toastSuccess, toastError, toastWarning } from '@/lib/toast'
import { OptimizedBackgroundImage } from '@/components/ui/OptimizedBackgroundImage'
import { BACKGROUND_IMAGES } from '@/types/images'

// Lazy load modal
const CartModal = dynamic(() => import('@/components/cart/CartModal').then(mod => ({ default: mod.CartModal })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
})

interface ConsumableData {
  id: number
  qr_code: string
  current_quantity: number
  minimum_threshold: number
  unit_of_measure?: string
  item_type: {
    id: number
    name: string
    description?: string
    category?: string
  }
}

function ConsumableScanPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { startTransition } = useViewTransition({ speed: 'fast', direction: 'backward' })
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [quantity, setQuantity] = useState<number | ''>(1)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingScanRef = useRef(false)

  // Cart integration
  const [showCart, setShowCart] = useState(false)
  const { addItem, items: cartItems, clearCart } = useCart()
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [pendingConsumable, setPendingConsumable] = useState<ConsumableData | null>(null)

  // RTK Query hook
  const [consumeConsumable, { isLoading: isConsuming }] = useConsumeConsumableMutation()

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => { })
        scannerRef.current = null
      }
    }
  }, [isScanning])

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { })
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    )

    scanner.render(onScanSuccess, onScanFailure)
    scannerRef.current = scanner
  }

  const onScanSuccess = async (decodedText: string) => {
    // Prevent processing the same scan multiple times
    if (isProcessingScanRef.current) {
      return
    }

    isProcessingScanRef.current = true
    setError(null)

    try {
      // Validate consumable QR format
      if (!decodedText.startsWith('CONSUMABLE-')) {
        setError('Código QR inválido. Por favor escanea un código QR de material válido.')
        setTimeout(() => setError(null), 3000)
        return
      }

      // Look up consumable information
      await lookupConsumable(decodedText)
    } finally {
      // Reset the processing flag after a short delay
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 1000)
    }
  }

  const onScanFailure = (error: unknown) => {
    // Handle scan failure silently
    console.log('Scan error:', error)
  }

  const lookupConsumable = async (qrCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/consumables/qr/${qrCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const consumable = data.data

        if (consumable.current_quantity === 0) {
          setError('Item sin stock disponible')
          setTimeout(() => setError(null), 30000)
          return
        }

        // Show quantity modal
        setPendingConsumable(consumable)
        setShowQuantityModal(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || 'Material no encontrado')
        setTimeout(() => setError(null), 30000)
      }
    } catch (err) {
      console.error('Lookup error:', err)
      setError('Error al buscar msterial. Por favor intenta de nuevo.')
      setTimeout(() => setError(null), 30000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!pendingConsumable) return

    // Get final quantity (default to 1 if empty)
    const finalQuantity = quantity === '' ? 1 : (typeof quantity === 'number' ? quantity : parseInt(quantity))

    if (finalQuantity <= 0 || finalQuantity > pendingConsumable.current_quantity) {
      return
    }

    addItem({
      id: pendingConsumable.item_type.id,
      qr_code: pendingConsumable.qr_code, // Store QR code for consumption
      name: pendingConsumable.item_type.name,
      description: pendingConsumable.item_type.description,
      category: pendingConsumable.item_type.category,
      unit_of_measure: pendingConsumable.unit_of_measure,
      available_stock: pendingConsumable.current_quantity,
    }, finalQuantity)

    // Show success feedback
    const itemName = pendingConsumable.item_type.name
    const unit = pendingConsumable.unit_of_measure || 'unidades'
    toastSuccess(`${itemName} agregado al carrito (${finalQuantity} ${unit})`)

    // Reset and continue scanning
    setShowQuantityModal(false)
    setPendingConsumable(null)
    setQuantity(1) // ✅ RESET EXPLÍCITO A 1
  }

  const handleConfirmCart = async () => {
    if (cartItems.length === 0 || !user) return

    setError(null)

    try {
      // Consume all items using RTK Query mutation
      const promises = cartItems.map((item) =>
        consumeConsumable({
          qr_code: item.qr_code || '',
          quantity: item.quantity,
          notes: `Consumido vía escáner QR por ${user.email}`,
        }).unwrap()
      )

      const results = await Promise.allSettled(promises)

      // Check results
      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (failed > 0) {
        setError(`${failed} consumos fallaron. ${successful} fueron exitosos.`)
        // Don't clear cart if there were failures
        return
      }

      // All successful
      toastSuccess(`Todos los consumos procesados! (${cartItems.length} items)`)
      clearCart()
      setShowCart(false)

      // Redirect to dashboard with success message (cache automatically invalidated)
      setTimeout(() => {
        startTransition(() => router.push(`/dashboard?success=consumables_consumed&count=${cartItems.length}`))
      }, 500)
    } catch (err) {
      console.error('Cart confirmation error:', err)
      setError('Error al confirmar el carrito. Por favor intenta de nuevo.')
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { })
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  return (
    <ProtectedRoute>
      <SwipeContainer enabled={true}>
        <AppLayout title={t('scanner.scanSupplies')}>
        <OptimizedBackgroundImage
          src={BACKGROUND_IMAGES.consumablesScan.src}
          alt={BACKGROUND_IMAGES.consumablesScan.alt}
          priority={BACKGROUND_IMAGES.consumablesScan.priority}
          quality={BACKGROUND_IMAGES.consumablesScan.quality}
          overlayOpacity={BACKGROUND_IMAGES.consumablesScan.overlayOpacity}
          darkOverlayOpacity={BACKGROUND_IMAGES.consumablesScan.darkOverlayOpacity}
        >
          <div className="px-4 py-6 max-w-md mx-auto">
            {/* Quantity Modal */}
            {showQuantityModal && pendingConsumable && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-card-dark rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-scale-in">
                  {/* Header with Icon and Stock */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-1">
                        {pendingConsumable.item_type.name}
                      </h3>
                      {pendingConsumable.item_type.description && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {pendingConsumable.item_type.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-claro-green">
                        {pendingConsumable.current_quantity}
                      </div>
                      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {pendingConsumable.unit_of_measure || 'unidades'}
                      </div>
                    </div>
                  </div>

                  {/* Category Badge */}
                  {pendingConsumable.item_type.category && (
                    <div className="mb-4">
                      <span className="inline-block bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs px-2 py-1 rounded">
                        {pendingConsumable.item_type.category}
                      </span>
                      <span className="ml-2 text-xs font-medium text-claro-green">
                        In Stock
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {/* Quick Quantity Buttons */}
                    <div className="flex gap-2">
                      {[1, 5, 10].map((value) => (
                        <button
                          key={value}
                          onClick={() => setQuantity(Math.min(value, pendingConsumable.current_quantity))}
                          disabled={value > pendingConsumable.current_quantity}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${quantity === value
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
                        onClick={() => {
                          const current = quantity === '' ? 0 : (typeof quantity === 'number' ? quantity : parseInt(quantity))
                          setQuantity(Math.max(0, current - 1))
                        }}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-text-light dark:text-text-dark transition-all font-bold text-lg"
                      >
                        −
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={quantity}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '') {
                            setQuantity('')
                            return
                          }
                          const numValue = parseInt(value)
                          if (!isNaN(numValue) && numValue >= 0) {
                            setQuantity(Math.min(numValue, pendingConsumable.current_quantity))
                          }
                        }}
                        onBlur={() => {
                          if (quantity === '' || quantity === 0) {
                            setQuantity(1)
                          }
                        }}
                        placeholder="1"
                        className="w-20 text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-base font-semibold bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          const current = quantity === '' ? 0 : (typeof quantity === 'number' ? quantity : parseInt(quantity))
                          setQuantity(Math.min(current + 1, pendingConsumable.current_quantity))
                        }}
                        disabled={(quantity === '' ? 0 : (typeof quantity === 'number' ? quantity : parseInt(quantity))) >= pendingConsumable.current_quantity}
                        className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-text-light dark:text-text-dark transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>

                    {/* Stock Info */}
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                      Available: {pendingConsumable.current_quantity} {pendingConsumable.unit_of_measure || 'unidades'}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={handleAddToCart}
                        disabled={quantity === '' || quantity === 0 || (typeof quantity === 'number' && quantity > pendingConsumable.current_quantity)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Agregar al Carrito</span>
                      </button>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowQuantityModal(false)
                          setPendingConsumable(null)
                          setQuantity(1)
                        }}
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scanner Options */}
            {!isScanning && (
              <div className="space-y-4">
                <div className="bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">
                    {t('scanner.scanSupplies')}
                  </h2>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                    Escanea códigos QR del o los materiales para agregarlos al carrito y solicitar todo de una vez.
                  </p>

                  <Button
                    onClick={() => setIsScanning(true)}
                    className="w-full"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    Iniciar Escáner
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    💡 ¿Cómo usar el escáner?
                  </h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Escanea el código QR del material</li>
                    <li>Ingresa la cantidad deseada</li>
                    <li>Click en "Agregar al Carrito"</li>
                    <li>Repite para más items</li>
                    <li>Click en el carrito 🛒 para confirmar todo</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Active Scanner */}
            {isScanning && (
              <div className="space-y-4">
                <div className="bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-text-light dark:text-text-dark">
                      Escaneando...
                    </h3>
                    <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {cartItems.length} items en carrito
                    </span>
                  </div>
                  <div id="qr-reader" className="w-full"></div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={stopScanning}
                  variant="secondary"
                  className="w-full"
                >
                  Detener Escáner
                </Button>

                {/* Tip */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                    💡 El escáner permanece activo. Escanea múltiples items y luego confirma todo desde el carrito.
                  </p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {(isLoading || isConsuming) && !showQuantityModal && (
              <div className="bg-card-light/95 dark:bg-card-dark/95 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red dark:border-claro-red mx-auto"></div>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                    {isConsuming ? 'Procesando consumos...' : t('common.loading')}
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && !isConsuming && (
              <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>
        </OptimizedBackgroundImage>

        {/* Cart Button - Always visible */}
        <CartButton onClick={() => setShowCart(true)} />

        {/* Cart Modal */}
        <CartModal
          isOpen={showCart}
          onClose={() => setShowCart(false)}
          onConfirm={handleConfirmCart}
        />
      </AppLayout>
      </SwipeContainer>
    </ProtectedRoute>
  )
}

export default function ConsumableScanPage() {
  return (
    <CartProvider>
      <ConsumableScanPageContent />
    </CartProvider>
  )
}
