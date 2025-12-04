'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { TransitionDialog } from '@/components/ui/TransitionDialog'
import { ShoppingCart } from 'lucide-react'
import { VaultProvider, useVault } from '@/contexts/VaultContext'
import { VaultModal } from '@/components/vault/VaultModal'
import { isValidUUID } from '@/lib/supabase-client'
import { toastSuccess, toastError } from '@/lib/toast'

interface ReturnToolsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ToolData {
  id: number
  qr_code: string
  status: string
  serial_number?: string
  item_type?: {
    id: number
    name: string
    description?: string
    category?: string
  }
}

function ReturnToolsModalContent({
  isOpen,
  onClose,
  onSuccess,
}: ReturnToolsModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingScanRef = useRef(false)
  const [toolData, setToolData] = useState<ToolData | null>(null)

  // Vault integration
  const [showVault, setShowVault] = useState(false)
  const { addItem, items: vaultItems, clearVault, removeItem } = useVault()
  const [pendingTool, setPendingTool] = useState<ToolData & { loan_id: number } | null>(null)

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

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopScanning()
      setError(null)
      setPendingTool(null)
      setToolData(null)
    }
  }, [isOpen])

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { })
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader-return-tools-modal',
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

    isProcessingScanRef.current = true
    setError(null)

    try {
      // Validate UUID format
      if (!isValidUUID(decodedText)) {
        setError('Código QR inválido. Por favor escanea un código QR de herramienta válido.')
        setTimeout(() => setError(null), 3000)
        return
      }

      // Look up tool information (keep scanner running)
      await lookupTool(decodedText)
    } finally {
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 1000)
    }
  }

  const onScanFailure = (error: unknown) => {
    console.log('Scan error:', error)
  }

  const lookupTool = async (uuid: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/tools/qr/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to lookup tool')
      }

      const data = await response.json()
      const tool = data.data

      // Validate tool is loaned (can be returned)
      if (tool.status !== 'loaned') {
        setError(`Esta herramienta está ${tool.status}, no puede ser devuelta`)
        setTimeout(() => setError(null), 1000)
        return
      }

      // Get loan ID
      const loansResponse = await fetch('/api/loans/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!loansResponse.ok) {
        throw new Error('Error al obtener préstamos')
      }

      const loansData = await loansResponse.json()
      const activeLoan = loansData.data?.active?.find((loan: { tool_instance_id: number }) =>
        loan.tool_instance_id === tool.id
      )

      if (!activeLoan) {
        setError('No se encontró un préstamo activo para esta herramienta')
        setTimeout(() => setError(null), 1000)
        return
      }

      // Show modal to add to vault
      setPendingTool({ ...tool, loan_id: activeLoan.id })
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error al buscar herramienta'))
      setTimeout(() => {
        setError(null)
        setIsScanning(true)
      }, 1000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToVault = () => {
    if (!pendingTool) return

    addItem({
      id: pendingTool.id,
      tool_id: pendingTool.id,
      loan_id: pendingTool.loan_id,
      name: pendingTool.item_type?.name || 'Unknown',
      description: pendingTool.item_type?.description,
      category: pendingTool.item_type?.category,
      serial_number: pendingTool.serial_number,
      qr_code: pendingTool.qr_code,
      status: pendingTool.status,
    })

    // Show success feedback
    const toolName = pendingTool.item_type?.name || 'Herramienta'
    const serial = pendingTool.serial_number ? ` (#${pendingTool.serial_number})` : ''
    toastSuccess(`${toolName}${serial} agregado al vault`)

    // Reset and continue scanning
    setPendingTool(null)
  }

  const handleConfirmVault = async () => {
    if (vaultItems.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      // Return all tools in parallel
      const promises = vaultItems.map(async (item) => {
        try {
          const response = await fetch(`/api/loans/${item.loan_id}/return`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
              notes: 'Devuelto vía modal dashboard',
            }),
          })
          
          // Parse response to get error details
          const text = await response.text()
          let data = {}
          try {
            data = text ? JSON.parse(text) : {}
          } catch {
            console.error('Failed to parse response:', text)
          }
          
          return { 
            response, 
            item, 
            data,
            ok: response.ok,
            statusText: response.statusText,
          }
        } catch (fetchError) {
          console.error('Fetch error for loan', item.loan_id, fetchError)
          return {
            response: { ok: false, status: 0, statusText: 'Network Error' } as Response,
            item,
            data: { error: { message: 'Error de conexión' } } as Record<string, unknown>,
            ok: false,
            statusText: 'Network Error',
          }
        }
      })

      const results = await Promise.all(promises)
      const failedResults = results.filter(r => !r.ok)
      const successResults = results.filter(r => r.ok)

      if (failedResults.length > 0) {
        // Log detailed errors
        failedResults.forEach((result) => {
          const { item, data, response, statusText } = result
          const errorData = data as Record<string, unknown>
          const errorObj = errorData?.error as Record<string, unknown> | undefined
          
          // Log all available info
          console.error(`Failed to return loan ${item.loan_id}:`)
          console.error('  - HTTP Status:', response?.status)
          console.error('  - Status Text:', statusText || response?.statusText)
          console.error('  - Response Data:', JSON.stringify(data))
          console.error('  - Error Message:', errorObj?.message || errorData?.message || 'Unknown error')
          console.error('  - Tool Name:', item.name)
        })

        // Remove successful items from vault
        if (successResults.length > 0) {
          successResults.forEach(({ item }) => {
            removeItem(item.tool_id)
          })
          toastSuccess(`${successResults.length} herramientas devueltas exitosamente`)
        }

        // Show specific error message
        const firstFailedData = failedResults[0]?.data as Record<string, unknown>
        const firstErrorObj = firstFailedData?.error as Record<string, unknown> | undefined
        const firstError = (firstErrorObj?.message as string) || (firstFailedData?.message as string) || `Error HTTP ${failedResults[0]?.response?.status}`
        const errorMessage = failedResults.length === 1 
          ? `Error: ${firstError}`
          : `${failedResults.length} devoluciones fallaron. ${firstError}`
        
        setError(errorMessage)
        toastError(errorMessage, 'Verifica el estado de los préstamos')
        return // Don't close modal if there were failures
      }

      toastSuccess(`${vaultItems.length} herramientas devueltas exitosamente`)

      // Clear vault and close modal
      clearVault()
      setShowVault(false)

      // Close modal and refresh dashboard
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 400)
    } catch (err) {
      console.error('Vault confirmation error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al confirmar devoluciones'
      setError(errorMessage)
      toastError(errorMessage, 'Por favor, intenta de nuevo')
    } finally {
      setIsLoading(false)
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
      <TransitionDialog
        open={isOpen}
        onClose={onClose}
        animationType="auto"
        speed="normal"
        enableHaptics={true}
        className="!max-w-lg"
        title="Devolver Herramientas"
      >

        <div className="p-6">
          {/* Tool Modal */}
          {pendingTool && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-white dark:bg-card-dark rounded-lg shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-scale-in">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-1">
                      {pendingTool.item_type?.name || 'Herramienta'}
                    </h3>
                    {pendingTool.item_type?.description && (
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        {pendingTool.item_type.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="mb-4 space-y-2">
                  {pendingTool.serial_number && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">
                        Serial:
                      </span>
                      <span className="font-semibold text-text-light dark:text-text-dark">
                        #{pendingTool.serial_number}
                      </span>
                    </div>
                  )}
                  {pendingTool.item_type?.category && (
                    <div>
                      <span className="inline-block bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs px-2 py-1 rounded">
                        {pendingTool.item_type.category}
                      </span>
                      <span className="ml-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        Prestada
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleAddToVault}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    <span>Agregar al bulto</span>
                  </button>

                  <button
                    onClick={() => setPendingTool(null)}
                    className="w-full bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Options */}
          {!isScanning && !toolData && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                  Devolver Herramientas
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Escanea el código QR de la herramienta que deseas devolver.
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
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                  💡 ¿Cómo devolver herramientas?
                </h3>
                <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
                  <li>Escanea el código QR de la herramienta</li>
                  <li>Has clic en "Agregar al bulto"</li>
                  <li>Repite para más herramientas</li>
                  <li>Clic en el bulto 👜 para confirmar todo</li>
                </ol>
              </div>
            </div>
          )}

          {/* Active Scanner */}
          {isScanning && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-light dark:text-text-dark">
                  Escaneando...
                </h3>
                <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {vaultItems.length} herramientas en el bulto
                </span>
              </div>
              <div id="qr-reader-return-tools-modal" className="w-full"></div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={stopScanning}
                  className="bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Detener Escáner
                </button>
                <button
                  onClick={() => setShowVault(true)}
                  disabled={vaultItems.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Ver bulto ({vaultItems.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !toolData && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                Cargando...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Vault Footer - Show when there are items in vault */}
        {vaultItems.length > 0 && !pendingTool && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                  Bulto de Devoluciones
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {vaultItems.length} {vaultItems.length === 1 ? 'herramienta' : 'herramientas'}
                </p>
              </div>
              <button
                onClick={() => setShowVault(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ver bulto</span>
              </button>
            </div>

            {/* Quick preview of vault items */}
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {vaultItems.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded px-2 py-1">
                  <span className="text-text-light dark:text-text-dark truncate flex-1">
                    {item.name}
                  </span>
                  {item.serial_number && (
                    <span className="text-text-secondary-light dark:text-text-secondary-dark ml-2">
                      #{item.serial_number}
                    </span>
                  )}
                </div>
              ))}
              {vaultItems.length > 3 && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                  +{vaultItems.length - 3} más...
                </p>
              )}
            </div>
          </div>
        )}
      </TransitionDialog>

      {/* Vault Modal */}
      <VaultModal
        isOpen={showVault}
        onClose={() => setShowVault(false)}
        onConfirm={handleConfirmVault}
      />
    </>
  )
}

// Wrapper with VaultProvider
export const ReturnToolsModal: React.FC<ReturnToolsModalProps> = (props) => {
  return (
    <VaultProvider>
      <ReturnToolsModalContent {...props} />
    </VaultProvider>
  )
}
