'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { RequiredQRBanner, type RequiredQRInfo } from '@/components/reservations/RequiredQRBanner'

interface QRScannerProps {
  onScan: (code: string) => void
  onError?: (error: Error) => void
  onCancel: () => void
  isActive: boolean
  placeholder?: string
  scannerId?: string
  requiredQR?: RequiredQRInfo // NEW: Optional required QR information
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onError,
  onCancel,
  isActive,
  placeholder = 'Escanea el código QR',
  scannerId = 'qr-scanner-reader',
  requiredQR, // NEW: Required QR information
}) => {
  const [showRequiredQR, setShowRequiredQR] = useState(true)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingScanRef = useRef(false)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // Only initialize once when becoming active
    if (isActive && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      console.log('useEffect: Initializing scanner for the first time')
      startScanner()
    }

    return () => {
      console.log('useEffect: Cleanup called')
      if (scannerRef.current) {
        console.log('useEffect: Clearing scanner')
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
      // Reset on unmount
      if (!isActive) {
        hasInitializedRef.current = false
      }
    }
  }, [isActive])

  const startScanner = async () => {
    try {
      // Prevent multiple initializations
      if (scannerRef.current) {
        console.log('startScanner: Scanner already exists, aborting')
        return
      }

      // Check if the scanner element exists in the DOM
      const scannerElement = document.getElementById(scannerId)
      if (!scannerElement) {
        console.warn(`startScanner: Scanner element with id="${scannerId}" not found, retrying...`)
        // Retry after a short delay to allow DOM to render
        setTimeout(() => {
          if (isActive && !scannerRef.current && hasInitializedRef.current) {
            startScanner()
          }
        }, 100)
        return
      }

      console.log('startScanner: Starting scanner initialization...')

      // Check camera permissions with better error handling
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          // First, try to enumerate devices to check if camera exists
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter(device => device.kind === 'videoinput')

          if (videoDevices.length === 0) {
            console.error('startScanner: No camera devices found')
            setHasPermission(false)
            setError('No se encontró ninguna cámara en este dispositivo.')
            onError?.(new Error('No camera devices found'))
            return
          }

          console.log(`startScanner: Found ${videoDevices.length} camera(s)`)

          // Try to get camera access with specific constraints
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment', // Prefer back camera on mobile
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          })

          // Stop the stream immediately - we just needed to check permissions
          stream.getTracks().forEach(track => track.stop())

          setHasPermission(true)
          console.log('startScanner: Camera permission granted')
        } catch (err: any) {
          console.error('startScanner: Camera access error:', err)
          setHasPermission(false)

          // Provide specific error messages based on error type
          let errorMessage = 'Error al acceder a la cámara.'

          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.'
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage = 'No se encontró ninguna cámara en este dispositivo.'
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones que puedan estar usando la cámara e intenta de nuevo.'
          } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
            errorMessage = 'La cámara no cumple con los requisitos necesarios.'
          } else if (err.name === 'TypeError') {
            errorMessage = 'Error de configuración de la cámara.'
          } else if (err.name === 'AbortError') {
            errorMessage = 'Acceso a la cámara interrumpido.'
          }

          setError(errorMessage)
          onError?.(new Error(errorMessage))
          return
        }
      } else {
        console.error('startScanner: getUserMedia not supported')
        setHasPermission(false)
        setError('Tu navegador no soporta el acceso a la cámara.')
        onError?.(new Error('getUserMedia not supported'))
        return
      }

      // Double check we don't have a scanner already
      if (scannerRef.current) {
        console.log('startScanner: Scanner created while we were checking permissions, aborting')
        return
      }

      console.log('startScanner: Creating Html5QrcodeScanner instance...')
      const scanner = new Html5QrcodeScanner(
        scannerId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // Add more configuration for better compatibility
          rememberLastUsedCamera: true,
          supportedScanTypes: [],
        },
        false
      )

      console.log('startScanner: Rendering scanner...')
      scanner.render(onScanSuccess, onScanFailure)
      scannerRef.current = scanner
      console.log('startScanner: Scanner initialized successfully')
    } catch (err: any) {
      console.error('startScanner: Scanner initialization error:', err)

      let errorMessage = 'Error al inicializar el escáner.'
      if (err.name === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación. Por favor, cierra otras aplicaciones e intenta de nuevo.'
      }

      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error('Scanner initialization failed'))
    }
  }

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingScanRef.current) {
      return
    }

    isProcessingScanRef.current = true
    setError(null)

    try {
      onScan(decodedText)

      // Provide haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200)
      }
    } catch (err) {
      console.error('Scan processing error:', err)
      setError('Error al procesar el código')
      onError?.(err instanceof Error ? err : new Error('Scan processing failed'))
    } finally {
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 1000)
    }
  }

  const onScanFailure = (error: unknown) => {
    // Silently handle scan failures (happens frequently during scanning)
    console.log('Scan attempt:', error)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) {
      onScan(manualCode.trim())
      setManualCode('')
    }
  }

  const handleCancel = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }
    setError(null)
    setRetryCount(0)
    onCancel()
  }

  const handleRetry = () => {
    setError(null)
    setHasPermission(null)
    setRetryCount(prev => prev + 1)
    hasInitializedRef.current = false

    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }

    // Retry initialization
    setTimeout(() => {
      hasInitializedRef.current = true
      startScanner()
    }, 500)
  }

  if (!isActive) {
    return null
  }

  if (hasPermission === false) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                Error de cámara
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                {error || 'No se pudo acceder a la cámara.'}
              </p>

              {/* Troubleshooting tips */}
              <details className="text-xs text-red-600 dark:text-red-400">
                <summary className="cursor-pointer hover:text-red-800 dark:hover:text-red-200 mb-2">
                  💡 Soluciones posibles
                </summary>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Cierra otras aplicaciones que puedan estar usando la cámara</li>
                  <li>Verifica los permisos de cámara en la configuración del navegador</li>
                  <li>Recarga la página e intenta de nuevo</li>
                  <li>Si estás en un navegador, asegúrate de estar usando HTTPS</li>
                  <li>Intenta con otro navegador si el problema persiste</li>
                </ul>
              </details>

              <button
                onClick={handleRetry}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors w-full sm:w-auto"
              >
                🔄 Reintentar
              </button>
            </div>
          </div>
        </div>

        {/* Manual entry fallback */}
        <div className="bg-card-light dark:bg-card-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-text-light dark:text-text-dark mb-3">
            Entrada manual
          </h4>
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ingresa el código manualmente"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-claro-red focus:border-transparent text-text-light dark:text-text-dark"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="flex-1 px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* NEW: Show required QR banner if provided */}
      {requiredQR && showRequiredQR && (
        <div className="space-y-2">
          <RequiredQRBanner requiredQR={requiredQR} />
          <button
            onClick={() => setShowRequiredQR(false)}
            className="w-full px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Ocultar ubicación
          </button>
        </div>
      )}

      {/* NEW: Option to show/hide required QR info */}
      {requiredQR && !showRequiredQR && (
        <button
          onClick={() => setShowRequiredQR(true)}
          className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
        >
          📍 Ver ubicación requerida nuevamente
        </button>
      )}

      <div className="text-center">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
          {placeholder}
        </p>
      </div>

      {/* Always render the scanner div when active, even before scanning starts */}
      <div id={scannerId} className="w-full rounded-lg overflow-hidden"></div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Manual entry option */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <details className="group">
          <summary className="cursor-pointer text-sm text-claro-blue hover:text-blue-700 transition-colors list-none flex items-center justify-center gap-2">
            <span>Entrada manual</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <form onSubmit={handleManualSubmit} className="mt-3 space-y-3">
            {/* NEW: Show hint about required QR code */}
            {requiredQR && (
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                💡 Ingresa el código de: <strong>{requiredQR.location_name}</strong>
              </p>
            )}
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ingresa el código manualmente"
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-claro-red focus:border-transparent text-text-light dark:text-text-dark"
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full px-4 py-2 bg-claro-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Buscar
            </button>
          </form>
        </details>
      </div>

      <button
        onClick={handleCancel}
        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        Cancelar
      </button>
    </div>
  )
}
