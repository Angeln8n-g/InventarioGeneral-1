import React, { useState, useMemo } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { ModalHeader } from '@/components/shared/ModalHeader'
import { ConsumableItem } from '@/types/consumables'
import { ConsumableList } from '@/components/consumables'
import { Search } from 'lucide-react'

interface CableMarkers {
    startMarker: number
    endMarker: number
}

interface CategoryConsumablesModalProps {
    isOpen: boolean
    onClose: () => void
    category: string
    items: ConsumableItem[]
    onRequest: (itemTypeId: number, quantity: number, markers?: CableMarkers) => void
    onAddToCart: (item: ConsumableItem, quantity: number, markers?: CableMarkers) => void
    requestingItemId: number | null
}

export const CategoryConsumablesModal: React.FC<CategoryConsumablesModalProps> = ({
    isOpen,
    onClose,
    category,
    items,
    onRequest,
    onAddToCart,
    requestingItemId,
}) => {
    const [searchTerm, setSearchTerm] = React.useState('')
    const [showLowStockOnly, setShowLowStockOnly] = React.useState(false)

    // Filter items by category
    const categoryItems = React.useMemo(() => {
        return items.filter(item => item.category === category)
    }, [items, category])

    // Apply search and low stock filters
    const filteredItems = React.useMemo(() => {
        let result = [...categoryItems]

        // Search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim()
            result = result.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower)
            )
        }

        // Low stock filter
        if (showLowStockOnly) {
            result = result.filter(item => {
                const currentStock = item.stock?.current_quantity || 0
                const minThreshold = item.stock?.minimum_threshold || 0
                return currentStock <= minThreshold && currentStock > 0
            })
        }

        return result
    }, [categoryItems, searchTerm, showLowStockOnly])

    // Memoize search handler
    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
    }, [])

    // Memoize checkbox handler
    const handleLowStockToggle = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setShowLowStockOnly(e.target.checked)
    }, [])

    // Calculate stats
    const stats = React.useMemo(() => {
        const total = categoryItems.length
        const available = categoryItems.filter(item => (item.stock?.current_quantity || 0) > 0).length
        const lowStock = categoryItems.filter(item => {
            const currentStock = item.stock?.current_quantity || 0
            const minThreshold = item.stock?.minimum_threshold || 0
            return currentStock <= minThreshold && currentStock > 0
        }).length
        const outOfStock = categoryItems.filter(item => (item.stock?.current_quantity || 0) === 0).length

        return { total, available, lowStock, outOfStock }
    }, [categoryItems])

    const handleClose = React.useCallback(() => {
        setSearchTerm('')
        setShowLowStockOnly(false)
        onClose()
    }, [onClose])

    const handleClearFilters = React.useCallback(() => {
        setSearchTerm('')
        setShowLowStockOnly(false)
    }, [])

    return (
        <Dialog isOpen={isOpen} onClose={handleClose} size="xl" showCloseButton={false}>
            <ModalHeader title={category} onClose={handleClose} />

            <div className="p-6 max-h-[70vh] overflow-y-auto">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Total Items</p>
                                <p className="text-lg font-bold text-blue-700 dark:text-blue-200">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-green-600 dark:text-green-300 font-medium">Available</p>
                                <p className="text-lg font-bold text-green-700 dark:text-green-200">{stats.available}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center">
                                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-yellow-600 dark:text-yellow-300 font-medium">Low Stock</p>
                                <p className="text-lg font-bold text-yellow-700 dark:text-yellow-200">{stats.lowStock}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-600 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs text-red-600 dark:text-red-300 font-medium">Out of Stock</p>
                                <p className="text-lg font-bold text-red-700 dark:text-red-200">{stats.outOfStock}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-3 mb-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search consumables..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            autoComplete="off"
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Low Stock Toggle */}
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showLowStockOnly}
                            onChange={handleLowStockToggle}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-text-light dark:text-text-dark">
                            Show low stock only
                        </span>
                    </label>
                </div>

                {/* Items List */}
                <ConsumableList
                    items={filteredItems}
                    role="user"
                    onRequest={onRequest}
                    onAddToCart={onAddToCart}
                    requestingItemId={requestingItemId}
                    isLoading={false}
                    onClearFilters={searchTerm || showLowStockOnly ? handleClearFilters : undefined}
                />
            </div>
        </Dialog>
    )
}
