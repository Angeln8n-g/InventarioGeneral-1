'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { BulkImportConsumables } from '@/components/admin/BulkImportConsumables'
import { ConsumableSummary, ConsumableFilters, ConsumableList, BackordersTab, ConsumableDetailsModal } from '@/components/consumables'
import { useConsumableFilters, useStockAdjustment } from '@/hooks/consumables'
import { ConsumableStockAdmin, BackorderRequest } from '@/types/consumables'
import { toastError, toastSuccess } from '@/lib/toast'

function AdminConsumablesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isAdmin, isLoading } = useRequireAdmin()
  const [stocks, setStocks] = useState<ConsumableStockAdmin[]>([])
  const [backorders, setBackorders] = useState<BackorderRequest[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'inventory' | 'backorders'>('inventory')
  const [selectedConsumableId, setSelectedConsumableId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingConsumableId, setEditingConsumableId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editUnitOfMeasure, setEditUnitOfMeasure] = useState('')
  const [editMinThreshold, setEditMinThreshold] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Upload image modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadingConsumableId, setUploadingConsumableId] = useState<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingConsumableId, setDeletingConsumableId] = useState<number | null>(null)
  const [deletingConsumableName, setDeletingConsumableName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Use shared filters hook
  const { filters, setFilters, filteredItems, categories, clearFilters, hasActiveFilters } =
    useConsumableFilters<ConsumableStockAdmin>(stocks)

  // Use stock adjustment hook
  const { adjustStock, adjustingStockId } = useStockAdjustment({
    onSuccess: fetchData,
  })

  async function fetchData() {
    setIsLoadingData(true)

    try {
      // Fetch consumable stocks
      const stocksResponse = await fetch('/api/admin/consumables?include_requests=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (stocksResponse.ok) {
        const stocksData = await stocksResponse.json()
        setStocks(stocksData.data || [])
      }

      // Fetch backorders
      const backordersResponse = await fetch('/api/admin/consumables/backorders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (backordersResponse.ok) {
        const backordersData = await backordersResponse.json()
        setBackorders(backordersData.data || [])
      }
    } catch (error: unknown) {
      console.error('Data fetch error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toastError(`Failed to fetch data: ${errorMessage}`)
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchData()
    }
  }, [isAuthenticated, isAdmin])

  // Handle URL query parameter for deep linking
  useEffect(() => {
    const viewParam = searchParams.get('view')
    if (viewParam) {
      const id = parseInt(viewParam, 10)
      if (!isNaN(id)) {
        setSelectedConsumableId(id)
        setIsModalOpen(true)
      }
    }
  }, [searchParams])

  const handleViewDetails = (stockId: number) => {
    setSelectedConsumableId(stockId)
    setIsModalOpen(true)
    // Update URL for deep linking
    const url = new URL(window.location.href)
    url.searchParams.set('view', stockId.toString())
    window.history.pushState({}, '', url.toString())
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedConsumableId(null)
    // Remove query parameter from URL
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    window.history.pushState({}, '', url.toString())
    // Refresh data to show any changes made in the modal
    fetchData()
  }

  const handleNavigateConsumable = (id: number) => {
    setSelectedConsumableId(id)
    // Update URL
    const url = new URL(window.location.href)
    url.searchParams.set('view', id.toString())
    window.history.pushState({}, '', url.toString())
  }

  const handleProcessBackorders = async (itemTypeId: number, newStockQuantity: number) => {
    try {
      const response = await fetch('/api/admin/consumables/backorders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'process_backorders',
          item_type_id: itemTypeId,
          new_stock_quantity: newStockQuantity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to process backorders')
      }

      const data = await response.json()
      toastSuccess(`Backorders processed successfully! ${data.summary.requests_processed} requests fulfilled.`)

      // Refresh data
      fetchData()
    } catch (error: unknown) {
      console.error('Backorder processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toastError(`Failed to process backorders: ${errorMessage}`)
    }
  }

  const handleEdit = (stockId: number) => {
    const consumable = stocks.find(s => s.id === stockId)
    if (!consumable) return

    setEditingConsumableId(stockId)
    setEditName(consumable.item_type.name)
    setEditDescription(consumable.item_type.description || '')
    setEditCategory(consumable.item_type.category || '')
    setEditUnitOfMeasure(consumable.unit_of_measure || '')
    setEditMinThreshold(consumable.minimum_threshold.toString())
    setEditError(null)
    setShowEditModal(true)
  }

  const handleEditConsumable = async () => {
    if (!editingConsumableId || !editName.trim()) {
      setEditError('Name is required')
      return
    }

    setIsEditing(true)
    setEditError(null)

    try {
      const response = await fetch(`/api/admin/consumables/${editingConsumableId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          category: editCategory.trim() || undefined,
          unit_of_measure: editUnitOfMeasure.trim() || undefined,
          minimum_threshold: parseFloat(editMinThreshold) || undefined,
        }),
      })

      if (response.ok) {
        toastSuccess('Consumable updated successfully!')
        setShowEditModal(false)
        fetchData()
      } else {
        const errorData = await response.json()
        setEditError(errorData.error?.message || 'Failed to update consumable')
      }
    } catch (error: unknown) {
      console.error('Error updating consumable:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setEditError(`An error occurred: ${errorMessage}`)
    } finally {
      setIsEditing(false)
    }
  }

  const handleUploadImage = (stockId: number) => {
    setUploadingConsumableId(stockId)
    setSelectedFile(null)
    setImagePreview(null)
    setUploadError(null)
    setShowUploadModal(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setUploadError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadImageSubmit = async () => {
    if (!selectedFile || !uploadingConsumableId) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('consumable_id', uploadingConsumableId.toString())

      const response = await fetch('/api/admin/consumables/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (response.ok) {
        toastSuccess('Image uploaded successfully!')
        setShowUploadModal(false)
        fetchData()
      } else {
        const errorData = await response.json()
        setUploadError(errorData.error?.message || 'Failed to upload image')
      }
    } catch (error: unknown) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setUploadError(`An error occurred: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = (stockId: number) => {
    const consumable = stocks.find(s => s.id === stockId)
    if (!consumable) return

    setDeletingConsumableId(stockId)
    setDeletingConsumableName(consumable.item_type.name)
    setDeleteError(null)
    setShowDeleteModal(true)
  }

  const handleDeleteConsumable = async () => {
    if (!deletingConsumableId) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/admin/consumables/${deletingConsumableId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        toastSuccess('Consumable deleted successfully!')
        setShowDeleteModal(false)
        setDeletingConsumableId(null)
        fetchData()
      } else {
        const errorData = await response.json()
        setDeleteError(errorData.error?.message || 'Failed to delete consumable')
      }
    } catch (error: unknown) {
      console.error('Error deleting consumable:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setDeleteError(`An error occurred: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Consumables Management">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <ProtectedRoute>
      <AppLayout title="Consumables Management">
        <div className="px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Materials Management</h1>
            <div className="flex space-x-2">
              <BulkImportConsumables onImportComplete={fetchData} />
              <Button onClick={() => router.push('/consumables/scan')} size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan QR
              </Button>
              <Button
                onClick={() => router.push('/admin/item-types/new')}
                size="sm"
                variant="secondary"
                title="Configuración avanzada: Crear tipos de items manualmente para consumibles"
              >
                ⚙️ Manage Types
              </Button>
              <Button onClick={() => router.push('/admin/dashboard')} variant="secondary" size="sm">
                🔙 Dashboard
              </Button>
            </div>
          </div>

          {/* Summary - Using shared component */}
          <ConsumableSummary
            items={stocks}
            role="admin"
            backordersCount={backorders.length}
          />

          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory'
                ? 'bg-primary text-white'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                }`}
            >
              Inventory ({stocks.length})
            </button>
            <button
              onClick={() => setActiveTab('backorders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'backorders'
                ? 'bg-primary text-white'
                : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark'
                }`}
            >
              Backorders ({backorders.length})
            </button>
          </div>

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <>
              {/* Filters - Using shared component */}
              <ConsumableFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                resultCount={filteredItems.length}
                totalCount={stocks.length}
              />

              {/* Stock Items - Using shared component */}
              <ConsumableList
                items={filteredItems}
                role="admin"
                onAdjustStock={adjustStock}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onUploadImage={handleUploadImage}
                onDelete={handleDelete}
                adjustingStockId={adjustingStockId}
                deletingStockId={isDeleting ? deletingConsumableId : null}
                isLoading={isLoadingData}
                onClearFilters={hasActiveFilters ? clearFilters : undefined}
              />
            </>
          )}

          {/* Backorders Tab - Using shared component */}
          {activeTab === 'backorders' && (
            <BackordersTab
              backorders={backorders}
              isLoading={isLoadingData}
              onProcessBackorders={handleProcessBackorders}
            />
          )}

          {/* Consumable Details Modal */}
          <ConsumableDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            consumableId={selectedConsumableId}
            allConsumableIds={filteredItems.map(item => item.id)}
            onNavigate={handleNavigateConsumable}
            onStockUpdated={fetchData}
          />

          {/* Edit Consumable Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit Consumable Details</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Name <span className="text-red-accent">*</span>
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g., Screws, Bolts, etc."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Detailed description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="e.g., Hardware, Supplies"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Unit of Measure</label>
                    <input
                      type="text"
                      value={editUnitOfMeasure}
                      onChange={(e) => setEditUnitOfMeasure(e.target.value)}
                      placeholder="e.g., units, kg, liters"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Threshold</label>
                    <input
                      type="number"
                      value={editMinThreshold}
                      onChange={(e) => setEditMinThreshold(e.target.value)}
                      placeholder="e.g., 10"
                      min="0"
                      step="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-claro-red focus:border-transparent"
                    />
                  </div>

                  {editError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-accent rounded-lg">
                      <p className="text-sm text-red-accent">{editError}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={() => setShowEditModal(false)}
                      variant="secondary"
                      className="flex-1"
                      disabled={isEditing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleEditConsumable}
                      className="flex-1"
                      disabled={isEditing || !editName.trim()}
                    >
                      {isEditing ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Image Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Upload Consumable Image</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Image</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                          Click to select an image
                        </span>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                          PNG, JPG, GIF up to 5MB
                        </span>
                      </label>
                    </div>
                  </div>

                  {imagePreview && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Preview</label>
                      <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain" />
                        <button
                          onClick={() => {
                            setSelectedFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {selectedFile && (
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                    </div>
                  )}

                  {uploadError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-accent rounded-lg">
                      <p className="text-sm text-red-accent">{uploadError}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={() => setShowUploadModal(false)}
                      variant="secondary"
                      className="flex-1"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUploadImageSubmit}
                      className="flex-1"
                      disabled={isUploading || !selectedFile}
                    >
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Delete Consumable</h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-text-light dark:text-text-dark mb-2">
                      Are you sure you want to delete
                    </p>
                    <p className="font-semibold text-lg text-text-light dark:text-text-dark">
                      "{deletingConsumableName}"?
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                      This action cannot be undone. All stock movements and history for this item will also be deleted.
                    </p>
                  </div>

                  {deleteError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-accent rounded-lg">
                      <p className="text-sm text-red-accent">{deleteError}</p>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={() => {
                        setShowDeleteModal(false)
                        setDeletingConsumableId(null)
                        setDeleteError(null)
                      }}
                      variant="secondary"
                      className="flex-1"
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <button
                      onClick={handleDeleteConsumable}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

export default function AdminConsumablesPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <AppLayout title="Consumables Management">
          <div className="px-4 py-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    }>
      <AdminConsumablesContent />
    </Suspense>
  )
}
