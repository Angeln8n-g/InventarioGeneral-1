'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { ShoppingCart, TrendingUp, AlertTriangle, Package } from 'lucide-react'

interface Purchase {
    id: number
    created_at: string
    invoice_number: string
    supplier_name: string
    purchase_date: string
    quantity: number
    consumable_name: string
    unit_of_measure: string
    registered_by: string
    notes: string
}

interface Summary {
    monthly: {
        total_purchases: number
        total_invoices: number
        total_suppliers: number
        total_items: number
    }
    top_suppliers: Array<{
        supplier_name: string
        purchase_count: number
        total_items: number
        last_purchase: string
    }>
    duplicate_invoices: Array<{
        invoice_number: string
        times_used: number
        suppliers: string
    }>
    recent_purchases: Array<{
        created_at: string
        invoice_number: string
        supplier_name: string
        quantity: number
        consumable_name: string
    }>
}

export default function PurchasesReportPage() {
    const router = useRouter()
    const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [supplierFilter, setSupplierFilter] = useState('')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (startDate) params.append('start_date', startDate)
            if (endDate) params.append('end_date', endDate)
            if (supplierFilter) params.append('supplier', supplierFilter)

            const token = localStorage.getItem('token')
            const response = await fetch(`/api/admin/reports/purchases?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setPurchases(data.purchases)
                setSummary(data.summary)
            }
        } catch (error) {
            console.error('Error fetching purchases:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated && isAdmin) {
            fetchData()
        }
    }, [isAuthenticated, isAdmin])

    const handleFilter = () => {
        fetchData()
    }

    const handleExport = () => {
        // Simple CSV export
        const csv = [
            ['Date', 'Invoice', 'Supplier', 'Consumable', 'Quantity', 'Unit', 'Registered By'].join(','),
            ...purchases.map((p) =>
                [
                    new Date(p.created_at).toLocaleDateString(),
                    p.invoice_number,
                    p.supplier_name,
                    p.consumable_name,
                    p.quantity,
                    p.unit_of_measure,
                    p.registered_by,
                ].join(',')
            ),
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `purchases-report-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
    }

    if (authLoading || isLoading) {
        return (
            <ProtectedRoute>
                <AppLayout title="Purchase Reports">
                    <div className="px-4 py-6">
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
                                Loading...
                            </p>
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
            <AppLayout title="Purchase Reports">
                <div className="px-4 py-6 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">Purchase Reports</h1>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                Track and analyze consumable purchases
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={handleExport} variant="secondary" size="sm">
                                Export CSV
                            </Button>
                            <Button onClick={() => router.push('/admin/dashboard')} variant="secondary" size="sm">
                                Back
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            Purchases This Month
                                        </p>
                                        <p className="text-3xl font-bold mt-2">{summary.monthly.total_purchases}</p>
                                    </div>
                                    <ShoppingCart className="w-8 h-8 text-claro-red" />
                                </div>
                            </div>

                            <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            Total Invoices
                                        </p>
                                        <p className="text-3xl font-bold mt-2">{summary.monthly.total_invoices}</p>
                                    </div>
                                    <Package className="w-8 h-8 text-blue-500" />
                                </div>
                            </div>

                            <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            Active Suppliers
                                        </p>
                                        <p className="text-3xl font-bold mt-2">{summary.monthly.total_suppliers}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                </div>
                            </div>

                            <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            Items Purchased
                                        </p>
                                        <p className="text-3xl font-bold mt-2">
                                            {Math.round(summary.monthly.total_items)}
                                        </p>
                                    </div>
                                    <Package className="w-8 h-8 text-purple-500" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-4">Filters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Supplier</label>
                                <input
                                    type="text"
                                    value={supplierFilter}
                                    onChange={(e) => setSupplierFilter(e.target.value)}
                                    placeholder="Search supplier..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleFilter} className="w-full">
                                    Apply Filters
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Top Suppliers */}
                    {summary && summary.top_suppliers.length > 0 && (
                        <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold mb-4">Top Suppliers This Month</h3>
                            <div className="space-y-3">
                                {summary.top_suppliers.map((supplier, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-claro-red text-white flex items-center justify-center font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{supplier.supplier_name}</p>
                                                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                    Last purchase:{' '}
                                                    {new Date(supplier.last_purchase).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{supplier.purchase_count} purchases</p>
                                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                {Math.round(supplier.total_items)} items
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Duplicate Invoices Alert */}
                    {summary && summary.duplicate_invoices.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-accent rounded-lg p-6">
                            <div className="flex items-start space-x-3">
                                <AlertTriangle className="w-6 h-6 text-yellow-accent flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-yellow-accent mb-2">
                                        Duplicate Invoices Detected
                                    </h3>
                                    <div className="space-y-2">
                                        {summary.duplicate_invoices.map((dup, index) => (
                                            <div key={index} className="text-sm">
                                                <span className="font-medium">{dup.invoice_number}</span> used{' '}
                                                {dup.times_used} times
                                                {dup.suppliers && ` (${dup.suppliers})`}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Purchase History Table */}
                    <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold">Purchase History</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                                Showing {purchases.length} purchases
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                            Invoice
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                            Supplier
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                            Consumable
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                                            Registered By
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {purchases.length > 0 ? (
                                        purchases.map((purchase) => (
                                            <tr
                                                key={purchase.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {new Date(purchase.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {purchase.invoice_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {purchase.supplier_name}
                                                </td>
                                                <td className="px-6 py-4 text-sm">{purchase.consumable_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {purchase.quantity} {purchase.unit_of_measure}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {purchase.registered_by}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                                No purchases found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AppLayout>
        </ProtectedRoute>
    )
}
