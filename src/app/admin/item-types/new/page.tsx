'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function NewItemTypePage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    is_consumable: false,
    default_loan_duration_days: '7',
    min_threshold: '5',
    initial_quantity: '0',
    unit_of_measure: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        is_consumable: formData.is_consumable,
      }

      if (!formData.is_consumable) {
        payload.default_loan_duration_days = parseInt(formData.default_loan_duration_days)
      } else {
        // For consumables, include stock information
        payload.initial_quantity = parseInt(formData.initial_quantity)
        payload.minimum_threshold = parseInt(formData.min_threshold)
        payload.unit_of_measure = formData.unit_of_measure || undefined
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/item-types', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create item type')
      }

      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Add Item Type">
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
      <AppLayout title="Add Item Type">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add Item Type</h1>
            <Button
              onClick={() => router.back()}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
          </div>

          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 border border-red-accent rounded-lg p-4">
                  <p className="text-sm text-red-accent">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Hammer, Screwdriver, Resistor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the item type"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Category
                </label>
                <Input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Hand Tools, Power Tools, Electronics"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_consumable"
                  checked={formData.is_consumable}
                  onChange={(e) => setFormData({ ...formData, is_consumable: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary"
                />
                <label htmlFor="is_consumable" className="text-sm font-medium text-text-light dark:text-text-dark">
                  This is a consumable item
                </label>
              </div>

              {!formData.is_consumable ? (
                <div>
                  <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                    Default Loan Duration (days) *
                  </label>
                  <Input
                    type="number"
                    value={formData.default_loan_duration_days}
                    onChange={(e) => setFormData({ ...formData, default_loan_duration_days: e.target.value })}
                    min="1"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                      Initial Quantity *
                    </label>
                    <Input
                      type="number"
                      value={formData.initial_quantity}
                      onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                      min="0"
                      required
                      placeholder="Enter initial stock quantity"
                    />
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      Starting quantity in stock
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                      Minimum Stock Threshold *
                    </label>
                    <Input
                      type="number"
                      value={formData.min_threshold}
                      onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                      min="0"
                      required
                    />
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      Alert when stock falls below this level
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                      Unit of Measure
                    </label>
                    <Input
                      type="text"
                      value={formData.unit_of_measure}
                      onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                      placeholder="e.g., units, pieces, meters"
                    />
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      Optional: How this item is measured
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create Item Type'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
