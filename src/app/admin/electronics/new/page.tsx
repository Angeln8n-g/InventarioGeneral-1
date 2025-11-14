'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/app/store'
import { loadFromStorage } from '@/features/auth/authSlice'
import { ElectronicDeviceForm } from '@/components/electronics'
import { CreateElectronicDeviceInput, UpdateElectronicDeviceInput } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'

export default function NewElectronicDevicePage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const token = useSelector((state: RootState) => state.auth.token)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load token from localStorage on mount
  useEffect(() => {
    dispatch(loadFromStorage())
  }, [dispatch])

  const handleSubmit = async (data: CreateElectronicDeviceInput) => {
    if (!token) return

    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/admin/electronics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create device')
      }

      const result = await response.json()
      
      // Show success message
      alert('Device created successfully!')
      
      // Redirect to devices list
      router.push('/admin/electronics')
    } catch (error) {
      console.error('Error creating device:', error)
      alert(error instanceof Error ? error.message : 'Failed to create device')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/electronics')
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                Add New Electronic Device
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Fill in the details to add a new electronic device to the inventory
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
            onSubmit={handleSubmit as (data: CreateElectronicDeviceInput | UpdateElectronicDeviceInput) => Promise<void>}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Help Text */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• A QR code will be automatically generated for this device</li>
            <li>• Brand and model information helps with identification</li>
            <li>• Serial numbers are useful for warranty and tracking</li>
            <li>• Add condition notes for any existing issues or special characteristics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
