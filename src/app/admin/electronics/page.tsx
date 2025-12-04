'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState } from '@/app/store'
import { loadFromStorage } from '@/features/auth/authSlice'
import { ElectronicDeviceCard, ElectronicDeviceModal } from '@/components/electronics'
import { EditElectronicDeviceModal } from '@/components/electronics/EditElectronicDeviceModal'
import { BulkImportElectronics } from '@/components/admin/BulkImportElectronics'
import { ElectronicDeviceWithDetails, ElectronicCategory, DeviceCategory } from '@/types/database'
import { ElectronicDeviceFilters } from '@/types/electronics'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCategoryIcons } from '@/hooks/useCategoryIcons'
import { toastSuccess, toastError } from '@/lib/toast'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'loaned', label: 'Loaned' },
  { value: 'out-of-service', label: 'Out of Service' },
  { value: 'lost', label: 'Lost' },
  { value: 'damaged', label: 'Damaged' },
] as const

export default function ElectronicsPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const token = useSelector((state: RootState) => state.auth.token)
  const [devices, setDevices] = useState<ElectronicDeviceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ElectronicDeviceFilters>({})
  const [selectedDevice, setSelectedDevice] = useState<ElectronicDeviceWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // Fetch category icons for dynamic display
  const { getIcon, categoriesMap } = useCategoryIcons()
  
  // State for dynamic categories
  const [categories, setCategories] = useState<DeviceCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  
  // Helper to get category icon for a device
  const getDeviceCategoryIcon = (device: ElectronicDeviceWithDetails): string | null => {
    const category = (device.tool_instance as any)?.item_type?.category
    if (!category) return null
    const categoryData = categoriesMap.get(category)
    return categoryData?.icon || null
  }

  // Load token from localStorage on mount
  useEffect(() => {
    dispatch(loadFromStorage())
  }, [dispatch])

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const storedToken = localStorage.getItem('token')
        if (!storedToken) return
        
        const response = await fetch('/api/admin/categories', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          const activeCategories = (data.data || []).filter((cat: DeviceCategory) => cat.is_active)
          setCategories(activeCategories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Statistics
  const stats = {
    total: devices.length,
    available: devices.filter(d => d.tool_instance.status === 'available').length,
    loaned: devices.filter(d => d.tool_instance.status === 'loaned').length,
    maintenance: devices.filter(d => d.tool_instance.status === 'out-of-service' || d.tool_instance.status === 'damaged').length,
  }

  useEffect(() => {
    if (token) {
      fetchDevices()
    }
  }, [filters, token])

  const fetchDevices = async () => {
    if (!token) {
      console.warn('No token available, skipping fetch')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)

      console.log('Fetching devices with token:', token ? 'present' : 'missing')
      
      const response = await fetch(`/api/admin/electronics?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        let errorData: any = {}
        
        if (contentType?.includes('application/json')) {
          errorData = await response.json().catch(() => ({}))
        } else {
          const text = await response.text()
          console.error('Non-JSON error response:', text)
          errorData = { message: text || 'Unknown error' }
        }
        
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
        })
        
        throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}: Failed to fetch devices`)
      }

      const result = await response.json()
      console.log('Devices fetched successfully:', result.total || 0, 'devices')
      setDevices(result.data || [])
    } catch (error) {
      console.error('Error fetching devices:', error)
      toastError('Error al cargar dispositivos', error instanceof Error ? error.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedDevice || !token) return

    // Confirmation dialog for destructive action
    if (!confirm('¿Estás seguro de que deseas eliminar este dispositivo? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/electronics/${selectedDevice.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete device')

      toastSuccess('Dispositivo eliminado', 'El dispositivo ha sido eliminado correctamente')
      setSelectedDevice(null)
      fetchDevices()
    } catch (error) {
      console.error('Error deleting device:', error)
      toastError('Error al eliminar', error instanceof Error ? error.message : 'Failed to delete device')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = () => {
    if (selectedDevice) {
      setShowEditModal(true)
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = filters.status || filters.category || filters.search

  const filteredDevices = devices

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                Electronic Devices
              </h1>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Manage electronic devices inventory
              </p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/admin/dashboard"
                className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Dashboard
              </Link>
              <BulkImportElectronics onImportComplete={fetchDevices} />
              <Link
                href="/admin/electronics/new"
                className="claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Add New Device
              </Link>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Total Devices</p>
                  <p className="text-2xl font-bold text-text-light dark:text-text-dark">{stats.total}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Available</p>
                  <p className="text-2xl font-bold text-claro-green">{stats.available}</p>
                </div>
                <div className="p-3 bg-claro-green/10 rounded-lg">
                  <svg className="w-6 h-6 text-claro-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Loaned</p>
                  <p className="text-2xl font-bold text-claro-warning">{stats.loaned}</p>
                </div>
                <div className="p-3 bg-claro-warning/10 rounded-lg">
                  <svg className="w-6 h-6 text-claro-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.maintenance}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                Search
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by name, brand, model, or serial..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value as ElectronicCategory || undefined })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                disabled={loadingCategories}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon ? `${category.icon} ` : ''}{category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as any || undefined })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center space-x-2">
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Active filters:
              </span>
              {filters.status && (
                <span className="inline-flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                  Status: {filters.status}
                  <button
                    onClick={() => setFilters({ ...filters, status: undefined })}
                    className="ml-1 hover:text-primary-dark"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                  Category: {filters.category}
                  <button
                    onClick={() => setFilters({ ...filters, category: undefined })}
                    className="ml-1 hover:text-primary-dark"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                  Search: {filters.search}
                  <button
                    onClick={() => setFilters({ ...filters, search: undefined })}
                    className="ml-1 hover:text-primary-dark"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-claro-red hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Devices Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Loading devices...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-12 bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700">
            <svg className="w-16 h-16 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
              {hasActiveFilters ? 'No Devices Found' : 'No Devices Yet'}
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              {hasActiveFilters
                ? 'No devices match your search criteria.'
                : 'No electronic devices have been added yet.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/admin/electronics/new"
                className="inline-block claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                Add First Device
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevices.map(device => (
              <ElectronicDeviceCard
                key={device.id}
                device={device}
                categoryIcon={getDeviceCategoryIcon(device)}
                onViewDetails={() => setSelectedDevice(device)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Device Details Modal */}
      {selectedDevice && (
        <ElectronicDeviceModal
          device={selectedDevice}
          categoryIcon={getDeviceCategoryIcon(selectedDevice)}
          onClose={() => setSelectedDevice(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}
      {selectedDevice && showEditModal && (
        <EditElectronicDeviceModal
          device={selectedDevice}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchDevices}
        />
      )}
    </div>
  )
}
