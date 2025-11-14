// Phase 2, Task 3: ConsumableSummary component

import React from 'react'
import { ConsumableItem, ConsumableStockAdmin, UserRole } from '@/types/consumables'

interface ConsumableSummaryProps {
    items: ConsumableItem[] | ConsumableStockAdmin[]
    role: UserRole
    backordersCount?: number
}

export const ConsumableSummary: React.FC<ConsumableSummaryProps> = ({ items, role, backordersCount }) => {
    const totalItems = items.length

    const available = items.filter(item => {
        if ('item_type' in item) {
            // Admin item (ConsumableStockAdmin)
            return item.current_quantity > 0
        }
        // User item (ConsumableItem)
        return item.stock?.is_available
    }).length

    const lowStock = items.filter(item => {
        if ('item_type' in item) {
            // Admin item (ConsumableStockAdmin)
            return item.is_low_stock
        }
        // User item (ConsumableItem)
        return item.stock?.is_low_stock
    }).length

    const outOfStock = items.filter(item => {
        if ('item_type' in item) {
            // Admin item (ConsumableStockAdmin)
            return item.current_quantity === 0
        }
        // User item (ConsumableItem)
        return !item.stock?.is_available
    }).length

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 flex items-center">
                <div className="bg-blue-100 dark:bg-blue-900/50 text-blue-accent p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Total Items</p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">{totalItems}</p>
                </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 flex items-center">
                <div className="bg-green-100 dark:bg-green-900/50 text-green-accent p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Available</p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">{available}</p>
                </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 flex items-center">
                <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-accent p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Low Stock</p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">{lowStock}</p>
                </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-4 flex items-center">
                <div className="bg-red-100 dark:bg-red-900/50 text-red-accent p-3 rounded-lg mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {role === 'admin' && backordersCount !== undefined ? 'Backorders' : 'Out of Stock'}
                    </p>
                    <p className="text-2xl font-bold text-text-light dark:text-text-dark">
                        {role === 'admin' && backordersCount !== undefined ? backordersCount : outOfStock}
                    </p>
                </div>
            </div>
        </div>
    )
}
