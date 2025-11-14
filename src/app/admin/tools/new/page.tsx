'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BulkImportTools } from '@/components/admin/BulkImportTools'

export default function NewToolPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    qr_code: '',
    status: 'available',
    quantity: '1',
  })

  React.useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchCategories()
    }
  }, [isAuthenticated, isAdmin])

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/item-types?tools_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        const types = data.data || []

        // Extract unique categories for suggestions
        const uniqueCategories = Array.from(
          new Set(
            types
              .map((type: { category?: string }) => type.category)
              .filter((cat: string | undefined): cat is string => !!cat)
          )
        ).sort() as string[]

        setCategories(uniqueCategories)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      const quantity = parseInt(formData.quantity)

      if (quantity < 1 || quantity > 100) {
        throw new Error('Quantity must be between 1 and 100')
      }

      if (!formData.name.trim()) {
        throw new Error('Tool name is required')
      }

      if (!formData.category.trim()) {
        throw new Error('Category is required')
      }

      const response = await fetch('/api/admin/tools/create-with-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category: formData.category.trim(),
          qr_code_prefix: formData.qr_code || undefined,
          status: formData.status,
          quantity: quantity,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create tools')
      }

      router.push('/admin/tools')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || loadingCategories) {
    return (
      <ProtectedRoute>
        <AppLayout title="Add New Tool">
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
      <AppLayout title="Add New Tool">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add New Tool</h1>
            <div className="flex space-x-2">
              <BulkImportTools onImportComplete={() => router.push('/admin/tools')} />
              <Button
                onClick={() => router.back()}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
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
                  Tool Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Laptop, Projector, Drill"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Enter the name of the tool you want to register
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Educational laptops for classroom use"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Add details about the tool (optional)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Category *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="categories-list"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="e.g., Electronics, Office Supplies, Power Tools"
                    required
                  />
                  <datalist id="categories-list">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Select from existing categories or type a new one
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Quantity *
                </label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  min="1"
                  max="100"
                  required
                  placeholder="Number of tools to register"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Number of identical tools to register (QR codes will be auto-generated)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  QR Code Prefix (Optional)
                </label>
                <Input
                  type="text"
                  value={formData.qr_code}
                  onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                  placeholder="Leave empty to auto-generate"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Optional prefix for QR codes. If empty, unique codes will be generated automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                >
                  <option value="available">Available</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="damaged">Damaged</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || !formData.category.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : `Create ${formData.quantity} Tool${parseInt(formData.quantity) > 1 ? 's' : ''}`}
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
