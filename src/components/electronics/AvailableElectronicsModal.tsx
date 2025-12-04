import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { ElectronicDeviceWithDetails } from '@/types/database'
import { getDeviceData } from '@/types/electronics'
import { useCategoryIcons } from '@/hooks/useCategoryIcons'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface AvailableElectronicsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AvailableElectronicsModal: React.FC<AvailableElectronicsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const token = useSelector((state: RootState) => state.auth.token)
  const [devices, setDevices] = useState<ElectronicDeviceWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Fetch category icons for dynamic display
  const { getIcon } = useCategoryIcons()

  useEffect(() => {
    if (isOpen && token) {
      fetchAvailableDevices()
    }
  }, [isOpen, token])

  const fetchAvailableDevices = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use public endpoint for available devices (accessible to all authenticated users)
      const response = await fetch('/api/electronics/available', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Failed to fetch devices')
      }

      const result = await response.json()
      setDevices(result.data || [])
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError(err instanceof Error ? err.message : 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  // Get unique categories from devices
  const categories = ['all', ...new Set(
    devices.map((device) => {
      const { itemType } = getDeviceData(device)
      return itemType.category
    }).filter(Boolean)
  )]

  const filteredDevices = devices.filter((device) => {
    const { toolInstance, itemType } = getDeviceData(device)
    const searchLower = searchTerm.toLowerCase()
    
    // Filter by category
    const categoryMatch = selectedCategory === 'all' || itemType.category === selectedCategory
    
    // Filter by search term
    const searchMatch = !searchTerm || (
      itemType.name?.toLowerCase().includes(searchLower) ||
      device.brand?.toLowerCase().includes(searchLower) ||
      device.model?.toLowerCase().includes(searchLower) ||
      toolInstance.serial_number?.toLowerCase().includes(searchLower)
    )
    
    return categoryMatch && searchMatch
  })

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="auto"
      speed="fast"
      enableHaptics={true}
      className="!max-w-4xl !max-h-[90vh] flex flex-col"
      title="Electrónicos Disponibles"
      description={`${filteredDevices.length} ${filteredDevices.length === 1 ? 'dispositivo' : 'dispositivos'}${selectedCategory !== 'all' ? ` en ${selectedCategory}` : ''}${devices.length !== filteredDevices.length ? ` de ${devices.length} totales` : ''}`}
    >

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, marca, modelo o serial..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pl-10 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
              Categoría:
            </span>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-light dark:text-text-dark hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category === 'all' ? 'Todos' : category}
                {category !== 'all' && (
                  <span className="ml-1 opacity-75">
                    ({devices.filter(d => getDeviceData(d).itemType.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                Mostrando {filteredDevices.length} de {devices.length} dispositivos
              </span>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="text-primary hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Cargando dispositivos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-claro-red mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
                Error al cargar dispositivos
              </h3>
              <p className="text-claro-red mb-4">{error}</p>
              <button
                onClick={fetchAvailableDevices}
                className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-text-light dark:text-text-dark mb-2">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No se encontraron dispositivos' 
                  : 'No hay dispositivos disponibles'}
              </h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Intenta con otros filtros o términos de búsqueda'
                  : 'Todos los dispositivos están prestados o en mantenimiento'}
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((device) => {
                const { toolInstance, itemType } = getDeviceData(device)
                
                return (
                  <div
                    key={device.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  >
                    {/* Device Icon & Category */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-claro-green/10 dark:bg-claro-green/20 rounded-lg">
                          <span className="text-2xl" role="img" aria-label={itemType.category || 'Device'}>
                            {getIcon(itemType.category)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-light dark:text-text-dark">
                            {itemType.name || 'Unknown Device'}
                          </h3>
                          {itemType.category && (
                            <span className="inline-flex items-center gap-1 bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark text-xs px-2 py-0.5 rounded mt-1">
                              <span role="img" aria-hidden="true">{getIcon(itemType.category)}</span>
                              {itemType.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-claro-green/10 dark:bg-claro-green/20 text-claro-green">
                        Disponible
                      </span>
                    </div>

                    {/* Device Details */}
                    <div className="space-y-2 text-sm">
                      {device.brand && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">Marca:</span>
                          <span className="font-medium text-text-light dark:text-text-dark">{device.brand}</span>
                        </div>
                      )}
                      {device.model && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">Modelo:</span>
                          <span className="font-medium text-text-light dark:text-text-dark">{device.model}</span>
                        </div>
                      )}
                      {toolInstance.serial_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">Serial:</span>
                          <span className="font-mono text-xs text-text-light dark:text-text-dark">{toolInstance.serial_number}</span>
                        </div>
                      )}
                      {toolInstance.condition_notes && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          <span className="text-text-secondary-light dark:text-text-secondary-dark">Nota: </span>
                          <span className="text-text-light dark:text-text-dark">{toolInstance.condition_notes}</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">QR Code:</span>
                        <span className="font-mono text-text-light dark:text-text-dark">{toolInstance.qr_code}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              💡 Escanea el código QR del dispositivo para solicitar un préstamo
            </p>
            <button
              onClick={onClose}
              className="claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
    </TransitionDialog>
  )
}
