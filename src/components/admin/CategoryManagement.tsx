'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Settings, FolderOpen, Eye, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import CategoryModal from './CategoryModal'
import CategoryFieldsModal from './CategoryFieldsModal'
import CategoryDetailModal from './CategoryDetailModal'
import CategoryMigrationWizard from './CategoryMigrationWizard'
import { usePermissions } from '@/hooks/usePermissions'
import { AdminOnlyGuard } from '@/components/auth/PermissionGuard'
import type { DeviceCategoryWithCount } from '@/types/database'

interface CategoryManagementProps {
  onClose?: () => void
}

export default function CategoryManagement({ onClose }: CategoryManagementProps) {
  const { isAdmin, canManageCategories } = usePermissions()
  const [categories, setCategories] = useState<DeviceCategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showFieldsModal, setShowFieldsModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showMigrationWizard, setShowMigrationWizard] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategoryWithCount | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/categories?includeCounts=true', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, errorData)
        throw new Error(errorData.error?.message || `Error ${response.status}: Error al cargar categorías`)
      }
      const data = await response.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar las categorías')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setSelectedCategory(null)
    setModalMode('create')
    setShowModal(true)
  }

  const handleEdit = (category: DeviceCategoryWithCount) => {
    setSelectedCategory(category)
    setModalMode('edit')
    setShowDetailModal(false)
    setShowModal(true)
  }

  const handleViewDetail = (category: DeviceCategoryWithCount) => {
    setSelectedCategory(category)
    setShowDetailModal(true)
  }

  const handleDelete = async (category: DeviceCategoryWithCount) => {
    if (category.device_count > 0) {
      toast.error(`No se puede eliminar '${category.name}' porque tiene ${category.device_count} dispositivo(s)`)
      return
    }

    if (!confirm(`¿Eliminar la categoría '${category.name}'?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Error al eliminar categoría')
      }

      toast.success('Categoría eliminada exitosamente')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la categoría')
    }
  }

  const handleManageFields = (category: DeviceCategoryWithCount) => {
    setSelectedCategory(category)
    setShowDetailModal(false)
    setShowFieldsModal(true)
  }

  const handleDetailModalClose = () => {
    setShowDetailModal(false)
    setSelectedCategory(null)
  }

  const handleModalSuccess = () => {
    setShowModal(false)
    setSelectedCategory(null)
    fetchCategories()
  }

  const handleFieldsModalClose = () => {
    setShowFieldsModal(false)
    setSelectedCategory(null)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Categorías</h2>
          <p className="text-gray-600 mt-1">
            Administra las categorías de dispositivos electrónicos
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowMigrationWizard(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Migrar
            </button>
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar categorías..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {category.icon ? (
                    <span className="text-blue-600 text-lg">{category.icon}</span>
                  ) : (
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {category.device_count} dispositivo{category.device_count !== 1 ? 's' : ''}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      category.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {category.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewDetail(category)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center transition-colors text-sm"
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleManageFields(category)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Settings className="h-4 w-4" />
                    Campos
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    disabled={category.device_count > 0}
                    className={`px-3 py-2 rounded-lg flex items-center justify-center transition-colors text-sm ${
                      category.device_count > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 hover:bg-red-200 text-red-700'
                    }`}
                    title={category.device_count > 0 ? 'No se puede eliminar con dispositivos' : 'Eliminar'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No se encontraron categorías' : 'No hay categorías'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? 'Intenta con otros términos de búsqueda'
              : 'Comienza creando tu primera categoría'}
          </p>
          {!searchTerm && isAdmin && (
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CategoryModal
          mode={modalMode}
          category={selectedCategory}
          onSuccess={handleModalSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      {showFieldsModal && selectedCategory && (
        <CategoryFieldsModal
          category={selectedCategory}
          onClose={handleFieldsModalClose}
        />
      )}

      {showDetailModal && selectedCategory && (
        <CategoryDetailModal
          category={selectedCategory}
          onEdit={() => handleEdit(selectedCategory)}
          onDelete={() => {
            handleDetailModalClose()
            handleDelete(selectedCategory)
          }}
          onManageFields={() => handleManageFields(selectedCategory)}
          onClose={handleDetailModalClose}
        />
      )}

      {showMigrationWizard && (
        <CategoryMigrationWizard
          onClose={() => setShowMigrationWizard(false)}
          onSuccess={() => {
            setShowMigrationWizard(false)
            fetchCategories()
          }}
        />
      )}
    </div>
  )
}
