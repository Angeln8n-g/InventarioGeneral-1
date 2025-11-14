'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useReturnCart } from '@/contexts/ReturnCartContext'
import { isValidUUID } from '@/lib/supabase-client'

interface ReturnScannerProps {
  selectedDate: string | null
  onItemScanned?: () => void
}

export function ReturnScanner({ selectedDate, onItemScanned }: ReturnScannerProps) {
  const { addItem } = useReturnCart()
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingScanRef = useRef(false)

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      startScanner()
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [isScanning])

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
    }

    const scanner = new Html5QrcodeScanner(
      'return-qr-reader',
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
    if (isProcessingScanRef.current) {
      return
    }

    if (!selectedDate) {
      setError('Por favor selecciona una fecha de consumo primero')
      return
    }

    isProcessingScanRef.current = true
    setError(null)

    try {
      // Validate QR format (UUID or CONSUMABLE-X format)
      const isUUID = isValidUUID(decodedText)
      const isConsumableFormat = decodedText.startsWith('CONSUMABLE-')
      
      if (!isUUID && !isConsumableFormat) {
        setError('Código QR inválido. Debe ser un UUID o formato CONSUMABLE-X')
        setTimeout(() => setError(null), 3000)
        return
      }

      setIsLoading(true)

      // Look up consumable by QR code
      const response = await fetch(`/api/consumables/qr/${encodeURIComponent(decodedText)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'No se encontró el consumible')
      }

      const data = await response.json()
      const consumable = data.data

      // Check if this item was consumed on the selected date
      const consumptionResponse = await fetch(
        `/api/consumables/my-consumption?start_date=${selectedDate}&end_date=${selectedDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!consumptionResponse.ok) {
        throw new Error('Error al verificar el consumo')
      }

      const consumptionData = await consumptionResponse.json()
      
      if (!consumptionData.data || consumptionData.data.length === 0) {
        setError('No consumiste items en esta fecha')
        setTimeout(() => setError(null), 3000)
        return
      }

      const dateData = consumptionData.data[0]
      const consumedItem = dateData.items.find(
        (item: any) => item.item_type_id === consumable.item_type_id
      )

      if (!consumedItem) {
        setError(`No consumiste "${consumable.item_type?.name}" en esta fecha`)
        setTimeout(() => setError(null), 3000)
        return
      }

      if (consumedItem.returnable_quantity <= 0) {
        setError('Ya devolviste todo lo consumido de este item')
        setTimeout(() => setError(null), 3000)
        return
      }

      // Prompt for quantity
      const quantityStr = prompt(
        `¿Cuántos ${consumedItem.item_name} deseas devolver?\n\n` +
        `Máximo devolvible: ${consumedItem.returnable_quantity} ${consumedItem.unit_of_measure}`,
        '1'
      )

      if (!quantityStr) {
        // User cancelled
        return
      }

      const quantity = parseInt(quantityStr, 10)
      
      if (isNaN(quantity) || quantity <= 0) {
        setError('Cantidad inválida')
        setTimeout(() => setError(null), 3000)
        return
      }

      if (quantity > consumedItem.returnable_quantity) {
        setError(`No puedes devolver más de ${consumedItem.returnable_quantity} ${consumedItem.unit_of_measure}`)
        setTimeout(() => setError(null), 3000)
        return
      }

      // Add to cart with specified quantity
      addItem(
        {
          id: consumedItem.item_type_id,
          name: consumedItem.item_name,
          description: consumedItem.item_description,
          consumption_date: selectedDate,
          max_returnable: consumedItem.returnable_quantity,
          unit_of_measure: consumedItem.unit_of_measure,
          consumable_stock_id: consumedItem.consumable_stock_id,
        },
        quantity
      )

      // Show success feedback
      setError(null)
      if (onItemScanned) {
        onItemScanned()
      }

      // Show success message briefly
      const successMsg = `✅ ${consumedItem.item_name} (${quantity} ${consumedItem.unit_of_measure}) agregado al carrito`
      setError(successMsg)
      setTimeout(() => setError(null), 2000)

    } catch (err: unknown) {
      console.error('Scan error:', err)
      setError(err instanceof Error ? err.message : 'Error al procesar el escaneo')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 1000)
    }
  }

  const onScanFailure = (error: unknown) => {
    // Silently handle scan failures (happens frequently during scanning)
    console.log('Scan error:', error)
  }

  const handleManualEntry = () => {
    const code = prompt('Ingresa el código QR manualmente:')
    if (code) {
      onScanSuccess(code)
    }
  }

  if (!selectedDate) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Selecciona una fecha de consumo primero para escanear items
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
          Escanear Consumible
        </h3>
        {!isScanning && (
          <button
            onClick={handleManualEntry}
            className="text-sm text-claro-blue hover:text-blue-700 transition-colors"
          >
            Entrada Manual
          </button>
        )}
      </div>

      {!isScanning ? (
        <div className="space-y-3">
          <button
            onClick={() => setIsScanning(true)}
            className="w-full bg-claro-red hover:bg-red-700 text-white px-6 py-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Iniciar Escáner QR</span>
          </button>
          
          <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark">
            Escanea el código QR del consumible que deseas devolver
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div id="return-qr-reader" className="w-full"></div>
          
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red"></div>
              <span className="ml-3 text-text-secondary-light dark:text-text-secondary-dark">
                Procesando...
              </span>
            </div>
          )}

          {error && (
            <div className={`p-3 rounded-lg ${
              error.startsWith('✅') 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`text-sm ${
                error.startsWith('✅') 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {error}
              </p>
            </div>
          )}

          <button
            onClick={() => {
              setIsScanning(false)
              setError(null)
            }}
            className="w-full claro-button-secondary px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Detener Escáner
          </button>
        </div>
      )}
    </div>
  )
}
