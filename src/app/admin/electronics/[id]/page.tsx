'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/app/store'
import { loadFromStorage } from '@/features/auth/authSlice'
import { ElectronicDeviceForm } from '@/components/electronics'
import { ElectronicDeviceWithDetails, UpdateElectronicDeviceInput } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'

export default function EditElectronicDevicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const token = useSelector((state: RootState) => state.auth.token)
  const [device, setDevice] = useState<ElectronicDeviceWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load token from localStorage on mount
  useEffect(() => {
    dispatch(loadFromStorage())
  }, [dispatch])

  useEffect(() => {
    if (token) {
      fetchDevice()
    }
  }, [resolvedParams.id, token])

  const fetchDevice = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/electronics/${resolvedParams.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch device')
      }

      const data = await response.json()
      setDevice(data.device)
    } catch (error) {
      console.error('Error fetching device:', error)
      alert('Failed to load device')
      router.push('/admin/electronics')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: UpdateElectronicDeviceInput) => {
    if (!token) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch(`/api/admin/electronics/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update device')
      }

      // Show success message
      alert('Device updated successfully!')
      
      // Redirect to devices list
      router.push('/admin/electronics')
    } catch (error) {
      console.error('Error updating device:', error)
      alert(error instanceof Error ? error.message : 'Failed to update device')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!device || !token) return

    if (device.current_loan) {
      alert('Cannot delete device with active loan')
      return
    }

    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return
    }

    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/admin/electronics/${resolvedParams.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete device')
      }

      // Show success message
      alert('Device deleted successfully!')
      
      // Redirect to devices list
      router.push('/admin/electronics')
    } catch (error) {
      console.error('Error deleting device:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete device')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/electronics')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Loading device...</p>
        </div>
      </div>
    )
  }

  if (!device) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-light dark:text-text-dark">Device not found</p>
          <Link
            href="/admin/electronics"
            className="mt-4 inline-block claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                Edit Electronic Device
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Update device information
              </p>
            </div>
            <Link
              href="/admin/electronics"
              className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <ElectronicDeviceForm
            device={device}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Delete Section */}
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2">
            Danger Zone
          </h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-3">
            Once you delete a device, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !!device.current_loan}
            className="bg-claro-red hover:bg-claro-red/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Device'}
          </button>
          {device.current_loan && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Cannot delete device with active loan
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
