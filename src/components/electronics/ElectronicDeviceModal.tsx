import React, { useState } from 'react'
import { ElectronicDeviceWithDetails } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'
import { getDeviceData } from '@/types/electronics'
import QRCode from 'qrcode'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface ElectronicDeviceModalProps {
  device: ElectronicDeviceWithDetails
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}

export const ElectronicDeviceModal: React.FC<ElectronicDeviceModalProps> = ({
  device,
  onClose,
  onEdit,
  onDelete,
  isDeleting,
}) => {
  const { t, formatDate } = useLanguage()
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Extract device data with type safety
  const { toolInstance, itemType } = getDeviceData(device)

  React.useEffect(() => {
    // Generate QR code
    if (toolInstance.qr_code) {
      QRCode.toDataURL(toolInstance.qr_code, { width: 200, margin: 1 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating QR code:', err))
    }
  }, [toolInstance.qr_code])

  const getStatusColor = () => {
    switch (toolInstance.status) {
      case 'available':
        return 'bg-claro-green/10 dark:bg-claro-green/20 text-claro-green'
      case 'loaned':
        return 'bg-claro-warning/10 dark:bg-claro-warning/20 text-claro-warning'
      case 'out-of-service':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
      case 'lost':
        return 'bg-claro-red/10 dark:bg-claro-red/20 text-claro-red'
      case 'damaged':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const handleDelete = () => {
    if (device.current_loan) {
      alert('Cannot delete device with active loan')
      return
    }
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    onDelete()
    setShowDeleteConfirm(false)
  }

  return (
    <TransitionDialog
      open={true}
      onClose={onClose}
      animationType="fade"
      speed="fast"
      title="Device Details"
      className="!max-w-2xl"
    >

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info Section */}
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-2">
                  {itemType.name || 'Unknown Device'}
                </h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                  {getStatusLabel(toolInstance.status)}
                </span>
              </div>
              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 border border-gray-200 dark:border-gray-700 rounded" />
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 font-mono">
                    {toolInstance.qr_code}
                  </span>
                </div>
              )}
            </div>

            {itemType.description && (
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                {itemType.description}
              </p>
            )}
          </div>

          {/* Device Specifications */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-text-light dark:text-text-dark mb-3">Specifications</h4>
            <div className="grid grid-cols-2 gap-3">
              {itemType.category && (
                <div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Category</span>
                  <p className="text-sm font-medium text-text-light dark:text-text-dark">{itemType.category}</p>
                </div>
              )}
              {device.brand && (
                <div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Brand</span>
                  <p className="text-sm font-medium text-text-light dark:text-text-dark">{device.brand}</p>
                </div>
              )}
              {device.model && (
                <div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Model</span>
                  <p className="text-sm font-medium text-text-light dark:text-text-dark">{device.model}</p>
                </div>
              )}
              {toolInstance.serial_number && (
                <div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Serial Number</span>
                  <p className="text-sm font-mono text-text-light dark:text-text-dark">{toolInstance.serial_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Condition Notes */}
          {toolInstance.condition_notes && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-2">Condition Notes</h4>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {toolInstance.condition_notes}
              </p>
            </div>
          )}

          {/* Current Loan Info */}
          {device.current_loan && (
            <div className="bg-claro-warning/10 dark:bg-claro-warning/20 border border-claro-warning rounded-lg p-4">
              <h4 className="font-semibold text-text-light dark:text-text-dark mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2 text-claro-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Currently Loaned
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  <span className="font-medium">User:</span> {device.current_loan.user?.username || 'Unknown'}
                </p>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  <span className="font-medium">Loaned:</span> {formatDate(device.current_loan.loan_date)}
                </p>
                <p className="text-text-secondary-light dark:text-text-secondary-dark">
                  <span className="font-medium">Due:</span> {formatDate(device.current_loan.due_date)}
                </p>
                {device.current_loan.notes && (
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    <span className="font-medium">Notes:</span> {device.current_loan.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark space-y-1">
            <p>Added: {formatDate(toolInstance.created_at)}</p>
            {toolInstance.updated_at && <p>Last Updated: {formatDate(toolInstance.updated_at)}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 p-4 flex space-x-3">
          <button
            onClick={onEdit}
            className="flex-1 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            Edit Device
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !!device.current_loan}
            className="flex-1 bg-claro-red hover:bg-claro-red/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Device'}
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
                Confirm Deletion
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                Are you sure you want to delete this device? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-claro-red hover:bg-claro-red/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </TransitionDialog>
  )
}
