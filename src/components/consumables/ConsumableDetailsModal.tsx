import React, { useState, useEffect } from 'react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/Button'

interface ConsumableStock {
    id: number
    item_type: {
        id: number
        name: string
        description?: string
        category?: string
    }
    current_quantity: number
    minimum_threshold: number
    unit_of_measure?: string
    qr_code: string
    created_at: string
    updated_at: string
}

interface ConsumableDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    consumableId: number | null
    allConsumableIds?: number[]
    onNavigate?: (id: number) => void
    onStockUpdated?: () => void
}

export const ConsumableDetailsModal: React.FC<ConsumableDetailsModalProps> = ({
    isOpen,
    onClose,
    consumableId,
    allConsumableIds = [],
    onNavigate,
    onStockUpdated,
}) => {
    const [consumable, setConsumable] = useState<ConsumableStock | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [updateAction, setUpdateAction] = useState<'set_stock' | 'adjust_stock' | 'restock'>('restock')
    const [updateQuantity, setUpdateQuantity] = useState<string>('')
    const [updateNotes, setUpdateNotes] = useState('')
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [supplierName, setSupplierName] = useState('')
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateError, setUpdateError] = useState<string | null>(null)
    const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)

    const currentIndex = allConsumableIds.findIndex(id => id === consumableId)
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < allConsumableIds.length - 1

    const fetchConsumableDetails = async (id: number) => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`/api/admin/consumables/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setConsumable(data.data)

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
            console.error('Failed to fetch consumable details:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen && consumableId) {
            fetchConsumableDetails(consumableId)
        }
    }, [isOpen, consumableId])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen || showUpdateModal) return

            if (e.key === 'ArrowLeft' && hasPrevious && onNavigate) {
                onNavigate(allConsumableIds[currentIndex - 1])
            } else if (e.key === 'ArrowRight' && hasNext && onNavigate) {
                onNavigate(allConsumableIds[currentIndex + 1])
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, showUpdateModal, hasPrevious, hasNext, currentIndex, allConsumableIds, onNavigate])

    const handleDownloadQR = () => {
        if (qrCodeUrl && consumable) {
            const link = document.createElement('a')
            link.download = `qr-${consumable.item_type.name.replace(/\s+/g, '-')}-${consumable.id}.png`
            link.href = qrCodeUrl
            link.click()
        }
    }

    const handlePrintQR = () => {
        if (qrCodeUrl && consumable) {
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${consumable.item_type.name}</title>
              <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                .container { text-align: center; padding: 20px; }
                h1 { margin-bottom: 10px; font-size: 24px; }
                .qr-code { margin: 20px 0; }
                .info { margin-top: 10px; font-size: 14px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>${consumable.item_type.name}</h1>
                <div class="qr-code"><img src="${qrCodeUrl}" alt="QR Code" /></div>
                <div class="info">
                  <p>Type: Consumable</p>
                  <p>QR Code: ${consumable.qr_code}</p>
                  <p>Current Stock: ${consumable.current_quantity} ${consumable.unit_of_measure || 'units'}</p>
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

    const handleUpdateStock = async () => {
        if (!consumable || !updateQuantity) return

        setIsUpdating(true)
        setUpdateError(null)
        setUpdateSuccess(null)

        try {
            const quantity = parseFloat(updateQuantity)

            if (isNaN(quantity)) {
                setUpdateError('Please enter a valid number')
                return
            }

            if (updateAction === 'set_stock' && quantity < 0) {
                setUpdateError('Stock quantity cannot be negative')
                return
            }

            if (updateAction === 'restock' && quantity <= 0) {
                setUpdateError('Restock amount must be positive')
                return
            }

            const isStockIncrease = updateAction === 'restock' || (updateAction === 'adjust_stock' && quantity > 0)
            if (isStockIncrease && !invoiceNumber.trim()) {
                setUpdateError('Invoice number is required when adding stock')
                return
            }

            const token = localStorage.getItem('token')
            const response = await fetch('/api/admin/consumables', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: updateAction,
                    stock_id: consumable.id,
                    quantity,
                    notes: updateNotes || undefined,
                    invoice_number: invoiceNumber.trim() || undefined,
                    supplier_name: supplierName.trim() || undefined,
                    purchase_date: purchaseDate || undefined,
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setConsumable(data.data)
                setUpdateSuccess('Stock updated successfully!')
                setShowUpdateModal(false)
                setUpdateQuantity('')
                setUpdateNotes('')
                setInvoiceNumber('')
                setSupplierName('')
                setPurchaseDate(new Date().toISOString().split('T')[0])

                if (onStockUpdated) {
                    onStockUpdated()
                }

                setTimeout(() => setUpdateSuccess(null), 3000)
            } else {
                const errorData = await response.json()
                setUpdateError(errorData.error?.message || 'Failed to update stock')
            }
        } catch (error) {
            console.error('Error updating stock:', error)
            setUpdateError('An error occurred while updating stock')
        } finally {
            setIsUpdating(false)
        }
    }

    const openUpdateModal = (action: 'set_stock' | 'adjust_stock' | 'restock') => {
        setUpdateAction(action)
        setUpdateQuantity('')
        setUpdateNotes('')
        setInvoiceNumber('')
        setSupplierName('')
        setPurchaseDate(new Date().toISOString().split('T')[0])
        setUpdateError(null)
        setShowUpdateModal(true)
    }

    if (!consumable && !isLoading) return null

    const isLowStock = consumable && consumable.current_quantity <= consumable.minimum_threshold
    const isOutOfStock = consumable && consumable.current_quantity === 0

    return (
        <TransitionDialog 
            open={isOpen} 
            onClose={onClose} 
            animationType="fade" 
            speed="fast"
            title={consumable?.item_type.name}
            className="!max-w-4xl"
        >
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-4">Loading...</p>
                </div>
            ) : consumable ? (
                <div className="space-y-6">
                    {/* Navigation arrows */}
                    {(hasPrevious || hasNext) && (
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => hasPrevious && onNavigate && onNavigate(allConsumableIds[currentIndex - 1])}
                                disabled={!hasPrevious}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Previous item (←)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span>Previous</span>
                            </button>
                            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                {currentIndex + 1} of {allConsumableIds.length}
                            </span>
                            <button
                                onClick={() => hasNext && onNavigate && onNavigate(allConsumableIds[currentIndex + 1])}
                                disabled={!hasNext}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                                title="Next item (→)"
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

                            {/* Stock Status Card */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">Stock Status</h3>
                                    <Button onClick={() => openUpdateModal('restock')} size="sm">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Update Stock
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                            Current Stock
                                        </label>
                                        <p className={`text-3xl font-bold mt-1 ${isOutOfStock ? 'text-red-accent' : isLowStock ? 'text-yellow-accent' : 'text-green-accent'}`}>
                                            {consumable.current_quantity}
                                        </p>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            {consumable.unit_of_measure || 'units'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                            Minimum Threshold
                                        </label>
                                        <p className="text-3xl font-bold mt-1">
                                            {consumable.minimum_threshold}
                                        </p>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            {consumable.unit_of_measure || 'units'}
                                        </p>
                                    </div>
                                </div>

                                {isOutOfStock && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-accent rounded-lg">
                                        <p className="text-sm text-red-accent font-medium">⚠️ Out of Stock - Restock needed immediately</p>
                                    </div>
                                )}

                                {isLowStock && !isOutOfStock && (
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-accent rounded-lg">
                                        <p className="text-sm text-yellow-accent font-medium">⚠️ Low Stock - Consider restocking soon</p>
                                    </div>
                                )}

                                {/* Quick Actions */}
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                                        Quick Actions
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => openUpdateModal('restock')}
                                            className="px-3 py-2 text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                        >
                                            + Add Stock
                                        </button>
                                        <button
                                            onClick={() => openUpdateModal('adjust_stock')}
                                            className="px-3 py-2 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                        >
                                            ± Adjust
                                        </button>
                                        <button
                                            onClick={() => openUpdateModal('set_stock')}
                                            className="px-3 py-2 text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                        >
                                            = Set Value
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Details Card */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold mb-4">Details</h3>
                                <div className="space-y-4">
                                    {consumable.item_type.description && (
                                        <div>
                                            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                                Description
                                            </label>
                                            <p className="mt-1">{consumable.item_type.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        {consumable.item_type.category && (
                                            <div>
                                                <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                                    Category
                                                </label>
                                                <p className="mt-1">{consumable.item_type.category}</p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                                Added
                                            </label>
                                            <p className="mt-1">{new Date(consumable.created_at).toLocaleDateString()}</p>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                                                Last Updated
                                            </label>
                                            <p className="mt-1">{new Date(consumable.updated_at).toLocaleDateString()}</p>
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
                                                <p className="text-xs font-mono break-all">{consumable.qr_code}</p>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-accent rounded-lg">
                                            <p className="text-xs text-blue-accent">
                                                Users can scan this QR code to consume materials directly
                                            </p>
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

                    {/* Update Stock Modal */}
                    {showUpdateModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold">
                                        {updateAction === 'restock' && 'Add Stock'}
                                        {updateAction === 'adjust_stock' && 'Adjust Stock'}
                                        {updateAction === 'set_stock' && 'Set Stock Value'}
                                    </h3>
                                    <button
                                        onClick={() => setShowUpdateModal(false)}
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
                                            Current Stock: <span className="font-semibold text-text-light dark:text-text-dark">
                                                {consumable.current_quantity} {consumable.unit_of_measure || 'units'}
                                            </span>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {updateAction === 'restock' && 'Amount to Add'}
                                            {updateAction === 'adjust_stock' && 'Adjustment Amount'}
                                            {updateAction === 'set_stock' && 'New Stock Quantity'}
                                            <span className="text-red-accent ml-1">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={updateQuantity}
                                            onChange={(e) => setUpdateQuantity(e.target.value)}
                                            placeholder={updateAction === 'adjust_stock' ? 'e.g., 10 or -5' : 'e.g., 50'}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                                        />
                                    </div>

                                    {(updateAction === 'restock' || (updateAction === 'adjust_stock' && parseFloat(updateQuantity) > 0)) && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Invoice Number<span className="text-red-accent ml-1">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={invoiceNumber}
                                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                                    placeholder="e.g., FAC-2025-001234"
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Supplier Name (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={supplierName}
                                                    onChange={(e) => setSupplierName(e.target.value)}
                                                    placeholder="e.g., ABC Supplies Inc."
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-2">Purchase Date (Optional)</label>
                                                <input
                                                    type="date"
                                                    value={purchaseDate}
                                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                                        <textarea
                                            value={updateNotes}
                                            onChange={(e) => setUpdateNotes(e.target.value)}
                                            placeholder="e.g., Received new shipment"
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
                                        <Button onClick={() => setShowUpdateModal(false)} variant="secondary" className="flex-1" disabled={isUpdating}>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleUpdateStock} className="flex-1" disabled={isUpdating || !updateQuantity}>
                                            {isUpdating ? 'Updating...' : 'Update Stock'}
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
