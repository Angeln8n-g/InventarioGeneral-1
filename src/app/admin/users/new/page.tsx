'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useRequireAdmin } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function NewUserPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useRequireAdmin()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    role: 'user',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          role: formData.role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create user')
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
        <AppLayout title="Add User">
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
      <AppLayout title="Add User">
        <div className="px-4 py-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add User</h1>
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
                  Username *
                </label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                  required
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  This will be used as the display name
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  If not provided, a default email will be generated
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-text-light dark:text-text-dark">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.username || !formData.password}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
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
