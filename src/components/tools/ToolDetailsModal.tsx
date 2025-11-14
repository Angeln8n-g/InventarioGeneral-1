import React, { useState, useEffect } from 'react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/Button'

interface ToolInstance {
  id: number
  item_type: {
    id: number
    name: string
    description?: string
    category?: string
    default_loan_duration_days?: number
  }
  qr_code: string
  serial_number?: string
  status: 'available' | 'loaned' | 'out-of-service' | 'lost' | 'damaged'
  condition_notes?: string
  created_at: string
  updated_at: string
}

interface ToolDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  toolId: number | null
  allToolIds?: number[]
  onNavigate?: (id: number) => void
  onToolUpdated?: () => void
}

export const ToolDetailsModal: React.FC<ToolDetailsModalProps> = ({
  isOpen,
  onClose,
  toolId,
  allToolIds = [],
  onNavigate,
  onToolUpdated,
}) => {
  const [tool, setTool] = useState<ToolInstance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [statusNotes, setStatusNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)

  const currentIndex = allToolIds.findIndex(id => id === toolId)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < allToolIds.length - 1

  const fetchToolDetails = async (id: number) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/tools/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTool(data.data)

        if (data.data.qr_code) {
          const url = await QRCode.toDataURL(data.data.qr_code, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setQrCodeUrl(url)
        }
      }
    } catch (error) {
      console.error('Failed to fetch tool details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && toolId) {
      fetchToolDetails(toolId)
    }
  }, [isOpen, toolId])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || showStatusModal) return

      if (e.key === 'ArrowLeft' && hasPrevious && onNavigate) {
        onNavigate(allToolIds[currentIndex - 1])
      } else if (e.key === 'ArrowRight' && hasNext && onNavigate) {
        onNavigate(allToolIds[currentIndex + 1])
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showStatusModal, hasPrevious, hasNext, currentIndex, allToolIds, onNavigate])

  const handleDownloadQR = () => {
    if (qrCodeUrl && tool) {
      const link = document.createElement('a')
      link.download = `qr-${tool.item_type.name.replace(/\s+/g, '-')}-${tool.id}.png`
      link.href = qrCodeUrl
      link.click()
    }
  }

  const handlePrintQR = () => {
    if (qrCodeUrl && tool) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${tool.item_type.name}</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                .container { text-align: center; padding: 20px; max-width: 600px; }
                h1 { margin-bottom: 10px; font-size: 24px; font-weight: bold; }
                .qr-code { margin: 20px 0; }
                .info { margin-top: 10px; font-size: 14px; color: #666; }
                .description { margin: 15px 0; font-size: 14px; color: #333; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${tool.item_type.name}</h1>
                ${tool.item_type.description ? `<p class="description">${tool.item_type.description}</p>` : ''}
                <div class="qr-code"><img src="${qrCodeUrl}" alt="QR Code" /></div>
                <div class="info">
                  <p>QR Code: ${tool.qr_code}</p>
                  ${tool.serial_number
            ? `<p>Serial: ${tool.serial_number}</p>`
            : (tool.item_type.category ? `<p>Category: ${tool.item_type.category}</p>` : '')
          }
                </div>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleUpdateStatus = async () => {
    if (!tool || !newStatus) return

    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/tools/${tool.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          condition_notes: statusNotes || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTool(data.data)
        setUpdateSuccess('Status updated successfully!')
        setShowStatusModal(false)
        setNewStatus('')
        setStatusNotes('')

        if (onToolUpdated) {
          onToolUpdated()
        }

        setTimeout(() => setUpdateSuccess(null), 3000)
      } else {
        let errorMessage = 'Failed to update status'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorMessage
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }
        setUpdateError(errorMessage)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setUpdateError('An error occurred while updating status')
    } finally {
      setIsUpdating(false)
    }
  }

  const openStatusModal = () => {
    if (tool) {
      setNewStatus(tool.status)
      setStatusNotes(tool.condition_notes || '')
      setUpdateError(null)
      setShowStatusModal(true)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-claro-green' }
      case 'loaned':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-claro-warning' }
      case 'out-of-service':
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' }
      case 'lost':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-claro-red' }
      case 'damaged':
        return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' }
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' }
    }
  }

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  if (!tool && !isLoading) return null

  const statusColor = tool ? getStatusColor(tool.status) : { bg: '', text: '' }

  return (
    <TransitionDialog 
      open={isOpen} 
      onClose={onClose} 
      animationType="fade" 
      speed="fast"
      title={tool?.item_type.name}
      className="!max-w-4xl"
    >
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-4">Loading...</p>
        </div>
      ) : tool ? (
        <div className="space-y-6">
          {/* Navigation arrows */}
          {(hasPrevious || hasNext) && (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => hasPrevious && onNavigate && onNavigate(allToolIds[currentIndex - 1])}
                disabled={!hasPrevious}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Previous tool (←)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {currentIndex + 1} of {allToolIds.length}
              </span>
              <button
                onClick={() => hasNext && onNavigate && onNavigate(allToolIds[currentIndex + 1])}
                disabled={!hasNext}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Next tool (→)"
              >
                <span>Next</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {updateSuccess && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-accent rounded-lg">
              <p className="text-sm text-green-accent font-medium">✓ {updateSuccess}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Card */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Status</h3>
                  <Button onClick={openStatusModal} size="sm">
                    Change Status
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium ${statusColor.bg} ${statusColor.text}`}>
                    {getStatusLabel(tool.status)}
                  </span>
                </div>

                {tool.condition_notes && (
                  <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      Condition Notes
                    </label>
                    <p className="text-sm mt-1">{tool.condition_notes}</p>
                  </div>
                )}
              </div>

              {/* Details Card */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-4">
                  {tool.item_type.description && (
                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Description
                      </label>
                      <p className="mt-1">{tool.item_type.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {tool.item_type.category && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Category
                        </label>
                        <p className="mt-1">{tool.item_type.category}</p>
                      </div>
                    )}

                    {tool.serial_number && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Serial Number
                        </label>
                        <p className="mt-1 font-mono text-sm">{tool.serial_number}</p>
                      </div>
                    )}

                    {tool.item_type.default_loan_duration_days && (
                      <div>
                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                          Default Loan Duration
                        </label>
                        <p className="mt-1">{tool.item_type.default_loan_duration_days} days</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Added
                      </label>
                      <p className="mt-1">{new Date(tool.created_at).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Last Updated
                      </label>
                      <p className="mt-1">{new Date(tool.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Card */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">QR Code</h3>

                {qrCodeUrl && (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                      <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-[250px]" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        QR Code Value
                      </label>
                      <div className="mt-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs font-mono break-all">{tool.qr_code}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button onClick={handleDownloadQR} className="w-full" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download QR Code
                      </Button>
                      <Button onClick={handlePrintQR} variant="secondary" className="w-full" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Print QR Code
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Update Modal */}
          {showStatusModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Change Tool Status</h3>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      Current Status: <span className="font-semibold text-text-light dark:text-text-dark">
                        {getStatusLabel(tool.status)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      New Status<span className="text-red-accent ml-1">*</span>
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                    >
                      <option value="available">Available</option>
                      <option value="loaned">Loaned</option>
                      <option value="out-of-service">Out of Service</option>
                      <option value="damaged">Damaged</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Condition Notes (Optional)</label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="e.g., Minor scratches, needs calibration, etc."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent resize-none"
                    />
                  </div>

                  {updateError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-accent rounded-lg">
                      <p className="text-sm text-red-accent">{updateError}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <Button onClick={() => setShowStatusModal(false)} variant="secondary" className="flex-1" disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateStatus} className="flex-1" disabled={isUpdating || !newStatus}>
                      {isUpdating ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </TransitionDialog>
  )
}
