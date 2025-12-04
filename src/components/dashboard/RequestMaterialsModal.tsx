'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { ShoppingCart } from 'lucide-react'
import { CartProvider, useCart } from '@/contexts/CartContext'
import { CartModal } from '@/components/cart/CartModal'
import { toastSuccess, toastWarning } from '@/lib/toast'
import { useConsumeConsumableMutation } from '@/services/api'
import { isCableUnit } from '@/utils/cableDetection'
import { CableMeasurementCalculator } from '@/components/consumables/CableMeasurementCalculator'

interface RequestMaterialsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

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

function RequestMaterialsModalContent({
  isOpen,
  onClose,
  onSuccess,
}: RequestMaterialsModalProps) {
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
  const [calcResult, setCalcResult] = useState<{ startMarker: number; endMarker: number; length: number } | null>(null)

  // RTK Query hook
  const [consumeConsumable, { isLoading: isConsuming }] = useConsumeConsumableMutation()

  // Cable calculation handler
  const handleCableCalculation = useCallback((result: { startMarker: number; endMarker: number; length: number }) => {
    setCalcResult(result)
  }, [])

  // Scanner lifecycle
  useEffect(() => {
    if (isScanning && !scannerRef.current && isOpen) {
      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => { })
        scannerRef.current = null
      }
    }
  }, [isScanning, isOpen])

  // Pause scanner when quantity modal is open
  useEffect(() => {
    if (showQuantityModal) {
      // Block any new scans
      isProcessingScanRef.current = true
    } else {
      // Allow new scans after a short delay
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 300)
    }
  }, [showQuantityModal])

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopScanning()
      setError(null)
      setShowQuantityModal(false)
      setPendingConsumable(null)
      setQuantity(1)
    }
  }, [isOpen])





  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { })
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader-modal',
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
    // Prevent processing if already processing or if quantity modal is open
    if (isProcessingScanRef.current || showQuantityModal) {
      return
    }

    isProcessingScanRef.current = true
    setError(null)

    try {
      // Validate consumable QR format
      if (!decodedText.startsWith('CONSUMABLE-')) {
        setError('Código QR inválido. Por favor escanea un código QR de consumible válido.')
        setTimeout(() => setError(null), 3000)
        return
      }

      // Look up consumable information
      await lookupConsumable(decodedText)
    } finally {
      // Reset the processing flag after a short delay
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 500)
    }
  }

  const onScanFailure = () => {
    // Handle scan failure silently
  }

  const lookupConsumable = async (qrCode: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch(`/api/consumables/qr/${qrCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const consumable = data.data

        if (consumable.current_quantity === 0) {
          setError('Item sin stock disponible')
          setTimeout(() => setError(null), 3000)
          return
        }

        // Show quantity modal
        setPendingConsumable(consumable)
        setShowQuantityModal(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || 'Consumible no encontrado')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      console.error('Lookup error:', err)
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tiempo de espera agotado. Intenta de nuevo.')
      } else {
        setError('Error al buscar consumible. Por favor intenta de nuevo.')
      }
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!pendingConsumable) return

    const isCable = isCableUnit(pendingConsumable.unit_of_measure || null)

    if (isCable) {
      // Handle cable items
      if (!calcResult || calcResult.length <= 0 || calcResult.length > pendingConsumable.current_quantity) {
        toastWarning('Valores de marcador inválidos o exceden el stock')
        return
      }

      addItem({
        id: pendingConsumable.item_type.id,
        qr_code: pendingConsumable.qr_code,
        name: pendingConsumable.item_type.name,
        description: pendingConsumable.item_type.description,
        category: pendingConsumable.item_type.category,
        unit_of_measure: pendingConsumable.unit_of_measure,
        available_stock: pendingConsumable.current_quantity,
        start_marker: calcResult.startMarker,
        end_marker: calcResult.endMarker,
      }, calcResult.length)

      // Show success feedback
      const itemName = pendingConsumable.item_type.name
      const unit = pendingConsumable.unit_of_measure || 'unidades'
      toastSuccess(`${itemName} agregado al carrito (${calcResult.length} ${unit}, segmento ${calcResult.startMarker}→${calcResult.endMarker})`)

      // Reset
      setShowQuantityModal(false)
      setPendingConsumable(null)
      setCalcResult(null)
      return
    }

    // Handle non-cable items
    const finalQuantity = quantity === '' ? 1 : (typeof quantity === 'number' ? quantity : parseInt(quantity))

    if (finalQuantity <= 0 || finalQuantity > pendingConsumable.current_quantity) {
      return
    }

    addItem({
      id: pendingConsumable.item_type.id,
      qr_code: pendingConsumable.qr_code,
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
    setQuantity(1)
  }

  const handleConfirmCart = async () => {
    if (cartItems.length === 0) return

    setError(null)

    try {
      // Consume all items using RTK Query mutation
      const promises = cartItems.map((item) =>
        consumeConsumable({
          qr_code: item.qr_code || '',
          quantity: item.quantity,
          notes: `Utilizado vía modal dashboard`,
        }).unwrap()
      )

      const results = await Promise.allSettled(promises)

      // Check results
      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (failed > 0) {
        setError(`${failed} consumos fallaron. ${successful} fueron exitosos.`)
        return
      }

      // All successful
      toastSuccess(`Todos los consumos procesados! (${cartItems.length} items)`)
      clearCart()
      setShowCart(false)

      // Close modal and refresh dashboard
      setTimeout(() => {
        onSuccess()
        onClose()
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
    <>
      <Dialog isOpen={isOpen} onClose={onClose} size="lg" showCloseButton={false}>
        <ModalHeader
          title="Solicitar Materiales"
          onClose={onClose}
        />

        <div className="p-6">
          {/* Quantity Modal */}
          {showQuantityModal && pendingConsumable && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
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
                  {isCableUnit(pendingConsumable.unit_of_measure || null) ? (
                    /* Cable Measurement Calculator */
                    <CableMeasurementCalculator
                      mode="consumption"
                      unitOfMeasure={pendingConsumable.unit_of_measure || 'unidades'}
                      maxAvailableLength={pendingConsumable.current_quantity}
                      onValidChange={handleCableCalculation}
                    />
                  ) : (
                    <>
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
                          pattern="[0-9]*"
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
                          onFocus={(e) => {
                            e.target.select()
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddToCart()
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
                    </>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={
                        isCableUnit(pendingConsumable.unit_of_measure || null)
                          ? !calcResult || calcResult.length <= 0 || calcResult.length > pendingConsumable.current_quantity
                          : quantity === '' || quantity === 0 || (typeof quantity === 'number' && quantity > pendingConsumable.current_quantity)
                      }
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Agregar al Carrito</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowQuantityModal(false)
                        setPendingConsumable(null)
                        setQuantity(1)
                        setCalcResult(null)
                      }}
                      className="w-full bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Options */}
          {!isScanning && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                  Escanear Materiales
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Escanea códigos QR del o los materiales para agregarlos al carrito y solicitar todo de una vez.
                </p>
              </div>

              <button
                onClick={() => setIsScanning(true)}
                className="w-full bg-claro-red hover:bg-claro-red/90 text-white px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Iniciar Escáner</span>
              </button>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 ¿Cómo usar el escáner?
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Escanea el código QR del material</li>
                  <li>Ingresa la cantidad deseada</li>
                  <li>Has clic en "Agregar al Carrito"</li>
                  <li>Repite para más items</li>
                  <li>Clic en el carrito 🛒 para confirmar todo</li>
                </ol>
              </div>
            </div>
          )}

          {/* Active Scanner */}
          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-light dark:text-text-dark">
                  {showQuantityModal ? 'Escáner pausado...' : 'Escaneando...'}
                </h3>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {cartItems.length} items en carrito
                </span>
              </div>
              <div id="qr-reader-modal" className="w-full"></div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={stopScanning}
                  className="bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Detener Escáner
                </button>
                <button
                  onClick={() => setShowCart(true)}
                  disabled={cartItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Ver Carrito ({cartItems.length})</span>
                </button>
              </div>

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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                {isConsuming ? 'Procesando consumos...' : 'Cargando...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && !isConsuming && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Cart Footer - Show when there are items in cart */}
        {cartItems.length > 0 && !showQuantityModal && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                  Carrito de Materiales
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} • {cartItems.reduce((sum, item) => sum + item.quantity, 0)} unidades totales
                </p>
              </div>
              <button
                onClick={() => setShowCart(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
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

      {/* Cart Modal */}
      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onConfirm={handleConfirmCart}
      />
    </>
  )
}

// Wrapper with CartProvider
export const RequestMaterialsModal: React.FC<RequestMaterialsModalProps> = (props) => {
  return (
    <CartProvider>
      <RequestMaterialsModalContent {...props} />
    </CartProvider>
  )
}
