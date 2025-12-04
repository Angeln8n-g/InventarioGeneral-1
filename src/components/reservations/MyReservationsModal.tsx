'use client'

import React, { useState, useEffect } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { QRScanner } from '@/components/shared/QRScanner'
import type { RequiredQRInfo } from '@/components/reservations/RequiredQRBanner'
import { Package, Clock, CheckCircle, XCircle, AlertTriangle, Scan } from 'lucide-react'
import type { ReservationDetails } from '@/types/database'

interface MyReservationsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: number
}

export function MyReservationsModal({ isOpen, onClose, userId }: MyReservationsModalProps) {
  const [reservations, setReservations] = useState<ReservationDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'fulfilled' | 'cancelled' | 'expired'>('active')
  const [showScanner, setShowScanner] = useState(false)
  const [reservationToFulfill, setReservationToFulfill] = useState<number | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const [requiredQR, setRequiredQR] = useState<RequiredQRInfo | null>(null) // NEW
  const [isLoadingQR, setIsLoadingQR] = useState(false) // NEW
  const [wrongQRDetails, setWrongQRDetails] = useState<{ scanned: string; required: string } | null>(null) // NEW
  const [scanTimeoutWarning, setScanTimeoutWarning] = useState(false) // Timeout warning state
  const [scanTimeRemaining, setScanTimeRemaining] = useState<number | null>(null) // Time remaining in seconds

  useEffect(() => {
    if (isOpen) {
      fetchReservations()
    }
  }, [isOpen, userId])

  // Timeout management for scanner
  useEffect(() => {
    if (!showScanner || isLoadingQR) {
      // Clear any existing timers when scanner is closed or loading
      setScanTimeoutWarning(false)
      setScanTimeRemaining(null)
      return
    }

    const SCAN_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
    const WARNING_TIME = 4 * 60 * 1000 // 4 minutes in milliseconds
    const startTime = Date.now()

    // Timer to show warning at 4 minutes
    const warningTimer = setTimeout(() => {
      setScanTimeoutWarning(true)
      setScanTimeRemaining(60) // 1 minute remaining
    }, WARNING_TIME)

    // Countdown timer for remaining time (updates every second after warning)
    let countdownInterval: NodeJS.Timeout | null = null
    
    const startCountdown = () => {
      countdownInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, Math.ceil((SCAN_TIMEOUT - elapsed) / 1000))
        setScanTimeRemaining(remaining)
        
        if (remaining === 0) {
          // Time's up - auto close with message
          if (countdownInterval) clearInterval(countdownInterval)
          setScanError('El tiempo de escaneo ha expirado. Por favor, intenta nuevamente.')
          setTimeout(() => {
            handleCancelScan()
          }, 3000)
        }
      }, 1000)
    }

    // Start countdown after warning is shown
    const countdownStartTimer = setTimeout(() => {
      startCountdown()
    }, WARNING_TIME)

    // Cleanup function
    return () => {
      clearTimeout(warningTimer)
      clearTimeout(countdownStartTimer)
      if (countdownInterval) clearInterval(countdownInterval)
    }
  }, [showScanner, isLoadingQR])

  const fetchReservations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reservations?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setReservations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return

    try {
      const response = await fetch(`/api/reservations/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        fetchReservations()
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error)
    }
  }

  const handleFulfill = async (id: number) => {
    // NEW: Fetch required QR code before opening scanner
    setReservationToFulfill(id)
    setIsLoadingQR(true)
    setScanError(null)
    setWrongQRDetails(null)
    setRequiredQR(null)
    setShowScanner(true) // Show modal immediately with loading state

    try {
      const response = await fetch(`/api/reservations/${id}/required-qr`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setRequiredQR(result.data)
      } else {
        const errorData = await response.json()
        setScanError(errorData.error?.message || 'Error al obtener código QR requerido')
      }
    } catch (error) {
      console.error('Error fetching required QR:', error)
      setScanError('Error al cargar la información del código QR')
    } finally {
      setIsLoadingQR(false)
    }
  }

  const handleWarehouseScan = async (qrCode: string) => {
    if (!reservationToFulfill) return

    try {
      // First, validate the warehouse QR code
      const validateResponse = await fetch('/api/warehouse/validate-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ qr_code: qrCode }),
      })

      if (!validateResponse.ok) {
        const errorData = await validateResponse.json()
        setScanError(errorData.message || errorData.error || 'Código QR no válido')
        // Vibrate on error
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100])
        }
        return
      }

      const { data: warehouseQR } = await validateResponse.json()

      // NEW: Prepare body with required_qr_code_id if available
      const fulfillBody: { warehouse_qr_code_id: number; required_qr_code_id?: number } = {
        warehouse_qr_code_id: warehouseQR.id,
      }

      if (requiredQR) {
        fulfillBody.required_qr_code_id = requiredQR.required_qr_code_id
      }

      // If valid, fulfill the reservation with the warehouse QR code ID
      const fulfillResponse = await fetch(`/api/reservations/${reservationToFulfill}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(fulfillBody),
      })

      if (fulfillResponse.ok) {
        // Success! Vibrate success pattern
        if (navigator.vibrate) {
          navigator.vibrate([50, 100, 50])
        }
        
        // Close scanner and refresh (this will trigger cleanup of timers)
        setShowScanner(false)
        setReservationToFulfill(null)
        setScanError(null)
        setRequiredQR(null)
        setWrongQRDetails(null)
        setScanTimeoutWarning(false)
        setScanTimeRemaining(null)
        fetchReservations()
      } else {
        const errorData = await fulfillResponse.json()
        
        // NEW: Handle wrong QR code error with detailed information
        if (errorData.error?.code === 'WRONG_QR_CODE') {
          setScanError(errorData.error.message)
          setWrongQRDetails({
            scanned: errorData.error.details?.scanned?.location || 'Desconocido',
            required: errorData.error.details?.required?.location || 'Desconocido',
          })
          
          // Vibrate error pattern
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100])
          }
        } else if (errorData.error?.code === 'RATE_LIMIT_EXCEEDED') {
          setScanError(errorData.error.message)
          // Vibrate long error
          if (navigator.vibrate) {
            navigator.vibrate(500)
          }
        } else {
          setScanError(errorData.error?.message || 'Error al confirmar la reserva')
          // Vibrate on error
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100])
          }
        }
      }
    } catch (error) {
      console.error('Error fulfilling reservation:', error)
      setScanError('Error al procesar la solicitud')
      // Vibrate on error
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
    }
  }

  const handleCancelScan = () => {
    setShowScanner(false)
    setReservationToFulfill(null)
    setScanError(null)
    setRequiredQR(null) // NEW
    setWrongQRDetails(null) // NEW
    setIsLoadingQR(false) // NEW
    setScanTimeoutWarning(false) // Clear timeout warning
    setScanTimeRemaining(null) // Clear time remaining
  }

  const handleViewLocationAgain = () => {
    // Dismiss the warning and let user continue scanning
    setScanTimeoutWarning(false)
    // Keep the timer running in the background
  }

  const filteredReservations = reservations.filter(r => 
    filter === 'all' ? true : r.status === filter
  )

  const getStatusBadge = (status: string, daysUntilExpiration: number) => {
    switch (status) {
      case 'active':
        if (daysUntilExpiration <= 1) {
          return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Expira Pronto
            </span>
          )
        }
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
            <Clock className="w-3 h-3 mr-1" />
            Activa
          </span>
        )
      case 'fulfilled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Recogida
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Expirada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} size="xl" showCloseButton={false}>
        <ModalHeader title="📦 Mis Reservas" onClose={onClose} />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'active', label: 'Activas' },
            { value: 'fulfilled', label: 'Recogidas' },
            { value: 'cancelled', label: 'Canceladas' },
            { value: 'expired', label: 'Expiradas' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f.label} ({reservations.filter(r => f.value === 'all' ? true : r.status === f.value).length})
            </button>
          ))}
        </div>

        {/* Reservations List */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando reservas...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay reservas
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter === 'active' 
                  ? 'No tienes reservas activas en este momento'
                  : `No tienes reservas ${filter === 'all' ? '' : filter}`}
              </p>
            </div>
          ) : (
            filteredReservations.map((reservation, index) => (
              <div
                key={`${reservation.id}-${reservation.item_type_id}-${index}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {reservation.item_name}
                    </h3>
                    {reservation.item_category && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {reservation.item_category}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(reservation.status, reservation.days_until_expiration)}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Cantidad:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {reservation.reserved_quantity} {reservation.unit_of_measure || 'unidades'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Reservado:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {new Date(reservation.reservation_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  {reservation.status === 'active' && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Expira:</span>
                      <span className={`ml-2 font-medium ${
                        reservation.days_until_expiration <= 1
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {new Date(reservation.expiration_date).toLocaleDateString('es-ES')}
                        {reservation.days_until_expiration >= 0 && (
                          <span className="text-xs ml-1">
                            ({Math.ceil(reservation.days_until_expiration)} días)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {reservation.pickup_date && (
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Recogido:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {new Date(reservation.pickup_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                </div>

                {reservation.purpose && (
                  <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Propósito:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{reservation.purpose}</p>
                  </div>
                )}

                {reservation.status === 'active' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleFulfill(reservation.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      ✓ Marcar como Recogida
                    </button>
                    <button
                      onClick={() => handleCancel(reservation.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>

    {/* Warehouse QR Scanner Modal */}
    <Dialog isOpen={showScanner} onClose={handleCancelScan} size="md" showCloseButton={false}>
      <ModalHeader 
        title="🏢 Verificación de Almacén" 
        onClose={handleCancelScan}
      />
      
      <div className="p-6">
        {/* Loading state for required QR */}
        {isLoadingQR && (
          <div className="mb-4 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Obteniendo ubicación requerida...
            </p>
          </div>
        )}

        {/* Show content only when not loading */}
        {!isLoadingQR && (
          <>
            {/* Timeout Warning */}
            {scanTimeoutWarning && scanTimeRemaining !== null && scanTimeRemaining > 0 && (
              <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      ⏰ El tiempo se está agotando
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                      Te quedan <span className="font-bold">{scanTimeRemaining} segundos</span> para completar el escaneo.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-3">
                      {requiredQR && (
                        <button
                          onClick={handleViewLocationAgain}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          📍 Ver ubicación nuevamente
                        </button>
                      )}
                      <button
                        onClick={handleCancelScan}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3">
                <Scan className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {requiredQR ? 'Escanea el código QR específico' : 'Escanea un código QR del almacén'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {requiredQR 
                  ? 'Debes escanear el código QR de la ubicación específica mostrada abajo.'
                  : 'Para confirmar la recogida, debes estar físicamente en el almacén y escanear uno de los códigos QR ubicados en las diferentes zonas.'}
              </p>
              
              {/* Show time remaining indicator when warning is active */}
              {scanTimeoutWarning && scanTimeRemaining !== null && scanTimeRemaining > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    {Math.floor(scanTimeRemaining / 60)}:{String(scanTimeRemaining % 60).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Error message with wrong QR details */}
            {scanError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 animate-shake">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-red-900 dark:text-red-100 mb-2">
                      ❌ Error de validación
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                      {scanError}
                    </p>
                    
                    {/* Show comparison if wrong QR was scanned */}
                    {wrongQRDetails && (
                      <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-700 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-red-700 dark:text-red-300">❌ Escaneaste:</span>
                          <span className="font-bold text-red-900 dark:text-red-100">{wrongQRDetails.scanned}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-700 dark:text-green-300">✅ Debes escanear:</span>
                          <span className="font-bold text-green-900 dark:text-green-100">{wrongQRDetails.required}</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setScanError(null)
                        setWrongQRDetails(null)
                      }}
                      className="mt-3 text-xs text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
                    >
                      Cerrar mensaje
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Show available locations only if no required QR */}
            {!requiredQR && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📍 Ubicaciones de códigos QR:
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Entrada principal del almacén</li>
                  <li>• Zona de herramientas</li>
                  <li>• Zona de consumibles</li>
                  <li>• Zona de electrónicos</li>
                  <li>• Salida del almacén</li>
                </ul>
              </div>
            )}

            <QRScanner
              isActive={showScanner && !isLoadingQR}
              onScan={handleWarehouseScan}
              onCancel={handleCancelScan}
              placeholder={requiredQR ? 'Escanea el código QR requerido' : 'Escanea cualquier código QR del almacén'}
              scannerId="warehouse-qr-scanner"
              requiredQR={requiredQR || undefined}
            />
          </>
        )}
      </div>
    </Dialog>
    </>
  )
}
