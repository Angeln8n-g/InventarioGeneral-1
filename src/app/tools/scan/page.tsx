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
import { isValidUUID } from '@/lib/supabase-client'
import { useLanguage } from '@/contexts/LanguageContext'
import { BagProvider, useBag } from '@/contexts/BagContext'
import { BagButton } from '@/components/bag/BagButton'
import { toastSuccess, toastError } from '@/lib/toast'
import { useCreateBatchLoansMutation, useGetMyLoansQuery } from '@/services/api'
import { OptimizedBackgroundImage } from '@/components/ui/OptimizedBackgroundImage'
import { BACKGROUND_IMAGES } from '@/types/images'
import { SwipeContainer } from '@/components/ui/SwipeContainer'

// Lazy load modals
const BagModal = dynamic(() => import('@/components/bag/BagModal').then(mod => ({ default: mod.BagModal })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
})

const LoanConfirmationModal = dynamic(() => import('@/components/bag/LoanConfirmationModal').then(mod => ({ default: mod.LoanConfirmationModal })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
})

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
}

function ToolsScanPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { startTransition } = useViewTransition({ speed: 'fast', direction: 'backward' })
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

  // RTK Query hooks
  const [createBatchLoans, { isLoading: isCreatingLoans }] = useCreateBatchLoansMutation()
  const { data: loansData } = useGetMyLoansQuery(undefined, {
    refetchOnFocus: false, // Prevent refetch when keyboard closes on mobile
  })
  
  // Check if user has active loans
  const loansResponse = loansData?.data as unknown as { active?: unknown[] } | undefined
  const hasActiveLoan = (loansResponse?.active && loansResponse.active.length > 0) || false

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      startScanner()
    }
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [isScanning])

  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
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

      // Validate tool is available for loan
      if (tool.status !== 'available') {
        setError(`Herramienta está ${tool.status}, no disponible para préstamo`)
        setTimeout(() => setError(null), 3000)
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
      setError((err instanceof Error ? err.message : 'Error al buscar herramienta'))
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
    if (bagItems.length === 0 || !user) return

    setError(null)

    try {
      // Build array of tool instance IDs
      const tool_instance_ids = bagItems.map(item => item.tool_id)

      // Create batch loans using RTK Query mutation
      const result = await createBatchLoans({
        tool_instance_ids,
        notes: notes || 'Préstamo vía escáner QR',
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

      // Redirect to my loans (cache will be automatically invalidated)
      setTimeout(() => {
        startTransition(() => router.push('/my-loans?success=loan_created'))
      }, 500)
    } catch (err) {
      console.error('Loan confirmation error:', err)
      setError(err instanceof Error ? err.message : 'Error al confirmar préstamo')
    }
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  return (
    <ProtectedRoute>
      <SwipeContainer enabled={true}>
        <AppLayout title="Escanear Herramientas">
        <OptimizedBackgroundImage
          src={BACKGROUND_IMAGES.toolsScan.src}
          alt={BACKGROUND_IMAGES.toolsScan.alt}
          priority={BACKGROUND_IMAGES.toolsScan.priority}
          quality={BACKGROUND_IMAGES.toolsScan.quality}
          overlayOpacity={BACKGROUND_IMAGES.toolsScan.overlayOpacity}
          darkOverlayOpacity={BACKGROUND_IMAGES.toolsScan.darkOverlayOpacity}
        >
          <div className="px-4 py-6 max-w-md mx-auto">
          {/* Tool Modal */}
          {pendingTool && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

                  <Button 
                    variant="secondary" 
                    onClick={() => setPendingTool(null)} 
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Scanner Options */}
          {!isScanning && (
            <div className="space-y-4">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">
                  Escanear Herramientas
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                  Escanea códigos QR de herramientas para agregarlas al bulto y crear un préstamo consolidado.
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
              <div className="bg-blue-50/95 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 Cómo usar el escáner
                </h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Escanea el código QR de la herramienta o equipo</li>
                  <li>Click en "Agregar al Bulto"</li>
                  <li>Repite para más herramientas</li>
                  <li>Click en el bulto 🛍️ para confirmar préstamo</li>
                </ol>
              </div>
            </div>
          )}

          {/* Active Scanner */}
          {isScanning && (
            <div className="space-y-4">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text-light dark:text-text-dark">
                    Escaneando...
                  </h3>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    {bagItems.length} herramientas en bulto
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
              <div className="bg-gray-50/95 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                  💡 El escáner permanece activo. Escanea múltiples herramientas y luego confirma todo desde el bulto.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isLoading || isCreatingLoans) && !pendingTool && (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red dark:border-claro-red mx-auto"></div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  {isCreatingLoans ? 'Creando préstamos...' : t('common.loading')}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && !isCreatingLoans && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          </div>
        </OptimizedBackgroundImage>

        {/* Bag Button - Always visible */}
        <BagButton onClick={() => setShowBag(true)} />

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
      </AppLayout>
      </SwipeContainer>
    </ProtectedRoute>
  )
}

export default function ToolsScanPage() {
  return (
    <BagProvider>
      <ToolsScanPageContent />
    </BagProvider>
  )
}
