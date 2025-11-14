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
import { VaultProvider, useVault } from '@/contexts/VaultContext'
import { VaultButton } from '@/components/vault/VaultButton'
import { OptimizedBackgroundImage } from '@/components/ui/OptimizedBackgroundImage'
import { toastSuccess, toastError } from '@/lib/toast'
import { BACKGROUND_IMAGES } from '@/types/images'
import { SwipeContainer } from '@/components/ui/SwipeContainer'

// Lazy load modal
const VaultModal = dynamic(() => import('@/components/vault/VaultModal').then(mod => ({ default: mod.VaultModal })), {
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
})

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

function ToolsReturnPageContent() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { startTransition } = useViewTransition({ speed: 'fast', direction: 'backward' })
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingScanRef = useRef(false)
  const [toolData, setToolData] = useState<ToolData | null>(null)

  // Vault integration
  const [showVault, setShowVault] = useState(false)
  const { addItem, items: vaultItems, clearVault } = useVault()
  const [pendingTool, setPendingTool] = useState<ToolData & { loan_id: number } | null>(null)

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
        setTimeout(() => setError(null), 3000)
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
        setTimeout(() => setError(null), 3000)
        return
      }

      // Show modal to add to vault
      setPendingTool({ ...tool, loan_id: activeLoan.id })
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : 'Error al buscar herramienta'))
      setTimeout(() => {
        setError(null)
        setIsScanning(true)
      }, 3000)
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
    if (vaultItems.length === 0 || !user) return

    setIsLoading(true)
    setError(null)

    try {
      // Return all tools in parallel
      const promises = vaultItems.map(item =>
        fetch(`/api/loans/${item.loan_id}/return`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            notes: 'Devuelto vía escáner QR (vault)',
          }),
        })
      )

      const results = await Promise.all(promises)
      const allSuccessful = results.every(res => res.ok)

      if (!allSuccessful) {
        const failedCount = results.filter(res => !res.ok).length
        const errorMessage = `${failedCount} devoluciones fallaron`
        toastError(errorMessage, 'Por favor, intenta de nuevo')
        throw new Error(errorMessage)
      }

      toastSuccess(`${vaultItems.length} herramientas devueltas exitosamente`)

      // Clear vault and close modal
      clearVault()
      setShowVault(false)

      // Redirect to my loans
      setTimeout(() => {
        startTransition(() => router.push('/my-loans?success=tools_returned'))
      }, 500)
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
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  return (
    <ProtectedRoute>
      <SwipeContainer enabled={true}>
        <AppLayout title="Devolver Herramientas">
        <OptimizedBackgroundImage
          src={BACKGROUND_IMAGES.toolsReturn.src}
          alt={BACKGROUND_IMAGES.toolsReturn.alt}
          priority={BACKGROUND_IMAGES.toolsReturn.priority}
          quality={BACKGROUND_IMAGES.toolsReturn.quality}
          overlayOpacity={BACKGROUND_IMAGES.toolsReturn.overlayOpacity}
          darkOverlayOpacity={BACKGROUND_IMAGES.toolsReturn.darkOverlayOpacity}
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
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center space-x-2"
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
                    <span>Agregar al Vault</span>
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
          {!isScanning && !toolData && (
            <div className="space-y-4">
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-text-light dark:text-text-dark mb-4">
                  Devolver Herramientas
                </h2>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                  Escanea el código QR de la herramienta que deseas devolver.
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
              <div className="bg-green-50/95 dark:bg-green-900/30 backdrop-blur-sm border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                  💡 Cómo devolver herramientas
                </h3>
                <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside">
                  <li>Escanea el código QR de la herramienta</li>
                  <li>Click en "Agregar al Vault"</li>
                  <li>Repite para más herramientas</li>
                  <li>Click en el vault 🏦 para confirmar todo</li>
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
                    {vaultItems.length} herramientas en vault
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
                Cancelar
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !toolData && (
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red dark:border-claro-red mx-auto"></div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  {t('common.loading')}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce max-w-sm text-center">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          </div>
        </OptimizedBackgroundImage>

        {/* Vault Button - Always visible */}
        <VaultButton onClick={() => setShowVault(true)} />

        {/* Vault Modal */}
        <VaultModal
          isOpen={showVault}
          onClose={() => setShowVault(false)}
          onConfirm={handleConfirmVault}
        />
      </AppLayout>
      </SwipeContainer>
    </ProtectedRoute>
  )
}

export default function ToolsReturnPage() {
  return (
    <VaultProvider>
      <ToolsReturnPageContent />
    </VaultProvider>
  )
}
