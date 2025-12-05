'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

import { ShoppingCart } from 'lucide-react'
import { BagProvider, useBag } from '@/contexts/BagContext'
import { BagModal } from '@/components/bag/BagModal'
import { LoanConfirmationModal } from '@/components/bag/LoanConfirmationModal'
import { toastSuccess, toastError } from '@/lib/toast'
import { useCreateBatchLoansMutation, useGetMyLoansQuery } from '@/services/api'
import { isValidUUID } from '@/lib/supabase-client'

interface RequestToolsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface ToolData {
  id: number
  qr_code: string
  status: string
  serial_number?: string
  can_be_loaned?: boolean
  item_type?: {
    id: number
    name: string
    description?: string
    category?: string
  }
  active_loan?: {
    id: number
    loan_date: string
    due_date: string
    user: {
      id: number
      username: string
      email: string
    }
  }
}

function RequestToolsModalContent({
  isOpen,
  onClose,
  onSuccess,
}: RequestToolsModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingScanRef = useRef(false)

  // Bag integration
  const [showBag, setShowBag] = useState(false)
  const [showLoanConfirmation, setShowLoanConfirmation] = useState(false)
  const { addItem, items: bagItems, clearBag } = useBag()
  const [pendingTool, setPendingTool] = useState<ToolData | null>(null)
  const [loanedToolInfo, setLoanedToolInfo] = useState<ToolData | null>(null)

  // RTK Query hooks
  const [createBatchLoans, { isLoading: isCreatingLoans }] = useCreateBatchLoansMutation()
  const { data: loansData } = useGetMyLoansQuery()

  // Check if user has active loans
  const loansResponse = loansData?.data as unknown as { active?: unknown[] } | undefined
  const hasActiveLoan = (loansResponse?.active && loansResponse.active.length > 0) || false

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
    }
  }, [isOpen])

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => { })
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader-tools-modal',
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

      // Look up tool information
      await lookupTool(decodedText)
    } finally {
      setTimeout(() => {
        isProcessingScanRef.current = false
      }, 500)
    }
  }

  const onScanFailure = (error: unknown) => {
    console.log('Scan error:', error)
  }

  const lookupTool = async (uuid: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch(`/api/tools/qr/${uuid}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to lookup tool')
      }

      const data = await response.json()
      const tool = data.data

      // Validate tool is available for loan
      if (tool.status !== 'available') {
        // If loaned, show informative popup
        if (tool.status === 'loaned' && tool.active_loan) {
          setLoanedToolInfo(tool)
        } else {
          // For other statuses (maintenance, damaged, etc.)
          const statusLabels: Record<string, string> = {
            'maintenance': 'en mantenimiento',
            'damaged': 'dañada',
            'out-of-service': 'fuera de servicio',
            'reserved': 'reservada',
            'loaned': 'prestada',
          }
          const statusLabel = statusLabels[tool.status] || tool.status
          setError(`Esta herramienta está ${statusLabel} y no está disponible para préstamo`)
          setTimeout(() => setError(null), 4000)
        }
        return
      }

      if (!tool.can_be_loaned) {
        setError('Esta herramienta no está disponible para préstamo')
        setTimeout(() => setError(null), 3000)
        return
      }

      // Show modal to add to bag
      setPendingTool(tool)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tiempo de espera agotado. Intenta de nuevo.')
      } else {
        setError((err instanceof Error ? err.message : 'Error al buscar herramienta'))
      }
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToBag = () => {
    if (!pendingTool) return

    addItem({
      id: pendingTool.id,
      tool_id: pendingTool.id,
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
    toastSuccess(`${toolName}${serial} agregado al bulto`)

    // Reset and continue scanning
    setPendingTool(null)
  }

  const handleConfirmBag = async (dueDate: string, notes?: string) => {
    if (bagItems.length === 0) return

    setError(null)

    try {
      // Build array of tool instance IDs
      const tool_instance_ids = bagItems.map(item => item.tool_id)

      // Create batch loans using RTK Query mutation
      const result = await createBatchLoans({
        tool_instance_ids,
        notes: notes || 'Préstamo activo',
      }).unwrap()

      // Check if all loans were successful
      if (result.data.failed.length > 0) {
        const failedCount = result.data.failed.length
        throw new Error(`${failedCount} herramientas no pudieron ser prestadas`)
      }

      // Success - show feedback
      toastSuccess(`${result.data.created.length} préstamos creados exitosamente`)

      // Clear bag and close modals
      clearBag()
      setShowBag(false)
      setShowLoanConfirmation(false)

      // Close modal and refresh dashboard
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } catch (err) {
      console.error('Loan confirmation error:', err)
      setError(err instanceof Error ? err.message : 'Error al confirmar préstamo')
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
        title="Solicitar Herramientas o equipo"
      >

        <div className="p-6">
          {/* Tool Modal */}
          {pendingTool && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setPendingTool(null)
                }
              }}
            >
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
                      <span className="ml-2 text-xs font-medium text-claro-green">
                        Disponible
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleAddToBag}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2"
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    <span>Agregar al Bulto</span>
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

          {/* Loaned Tool Info Modal */}
          {loanedToolInfo && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setLoanedToolInfo(null)
                }
              }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4" style={{ backgroundColor: '#F59E0B' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Herramienta Prestada</h3>
                      <p className="text-white/80 text-sm">No disponible para préstamo</p>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Tool Info */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {loanedToolInfo.item_type?.name || 'Herramienta'}
                    </h4>
                    {loanedToolInfo.serial_number && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Serial: <span className="font-mono">{loanedToolInfo.serial_number}</span>
                      </p>
                    )}
                    {loanedToolInfo.item_type?.category && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Categoría: {loanedToolInfo.item_type.category}
                      </p>
                    )}
                  </div>

                  {/* Loan Info */}
                  {loanedToolInfo.active_loan && (
                    <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium text-amber-800 dark:text-amber-200">Prestada a:</span>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {loanedToolInfo.active_loan.user.username}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {loanedToolInfo.active_loan.user.email}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-700 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Fecha préstamo:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(loanedToolInfo.active_loan.loan_date).toLocaleDateString('es', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Fecha devolución:</span>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(loanedToolInfo.active_loan.due_date).toLocaleDateString('es', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setLoanedToolInfo(null)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Options */}
          {!isScanning && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">
                  Escanear Herramientas o equipos
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Escanea códigos QR de herramientas o equipo para agregarlas al bulto y crear un préstamo consolidado.
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
                  <li>Escanea el código QR de la herramienta o equipo</li>
                  <li>Has clic en "Agregar al Bulto"</li>
                  <li>Repite para más herramientas</li>
                  <li>Clic en el bulto 👜 para confirmar préstamo</li>
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
                  {bagItems.length} herramientas en bulto
                </span>
              </div>
              <div id="qr-reader-tools-modal" className="w-full"></div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={stopScanning}
                  className="bg-gray-100 dark:bg-gray-800 text-text-light dark:text-text-dark px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  Detener Escáner
                </button>
                <button
                  onClick={() => setShowBag(true)}
                  disabled={bagItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Ver Bulto ({bagItems.length})</span>
                </button>
              </div>

              {/* Tip */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                  💡 El escáner permanece activo. Escanea múltiples herramientas y luego confirma todo desde el bulto.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isLoading || isCreatingLoans) && !pendingTool && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                {isCreatingLoans ? 'Creando préstamos...' : 'Cargando...'}
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && !isCreatingLoans && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Bag Footer - Show when there are items in bag */}
        {bagItems.length > 0 && !pendingTool && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-light dark:text-text-dark">
                  Bulto de Herramientas
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  {bagItems.length} {bagItems.length === 1 ? 'herramienta' : 'herramientas'}
                </p>
              </div>
              <button
                onClick={() => setShowBag(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Ver Bulto</span>
              </button>
            </div>

            {/* Quick preview of bag items */}
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {bagItems.slice(0, 3).map((item, index) => (
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
              {bagItems.length > 3 && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                  +{bagItems.length - 3} más...
                </p>
              )}
            </div>
          </div>
        )}
      </TransitionDialog>

      {/* Bag Modal */}
      <BagModal
        isOpen={showBag}
        onClose={() => setShowBag(false)}
        onConfirm={() => {
          setShowBag(false)
          setShowLoanConfirmation(true)
        }}
      />

      {/* Loan Confirmation Modal */}
      <LoanConfirmationModal
        isOpen={showLoanConfirmation}
        onClose={() => setShowLoanConfirmation(false)}
        onConfirm={handleConfirmBag}
        toolCount={bagItems.length}
        hasActiveLoan={hasActiveLoan}
        isLoading={isCreatingLoans}
      />
    </>
  )
}

// Wrapper with BagProvider
export const RequestToolsModal: React.FC<RequestToolsModalProps> = (props) => {
  return (
    <BagProvider>
      <RequestToolsModalContent {...props} />
    </BagProvider>
  )
}
