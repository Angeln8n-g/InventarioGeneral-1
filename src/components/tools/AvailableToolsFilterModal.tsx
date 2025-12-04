import React, { useState, useMemo } from 'react'
import { Search, Package, Tag } from 'lucide-react'
import { TransitionDialog } from '@/components/ui/TransitionDialog'

interface AvailableTool {
  item_type_id: number
  name: string
  description?: string
  category?: string
  available_count: number
}

interface AvailableToolsFilterModalProps {
  isOpen: boolean
  onClose: () => void
  tools: AvailableTool[]
}

export const AvailableToolsFilterModal: React.FC<AvailableToolsFilterModalProps> = ({
  isOpen,
  onClose,
  tools,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Get unique categories from tools
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>()

    tools.forEach((tool) => {
      if (tool.category) {
        categoryMap.set(tool.category, (categoryMap.get(tool.category) || 0) + 1)
      }
    })

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [tools])

  // Filter tools
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // Filter by category
      const categoryMatch = selectedCategory === 'all' || tool.category === selectedCategory

      // Filter by search term
      const searchLower = searchTerm.toLowerCase()
      const searchMatch = !searchTerm || (
        tool.name?.toLowerCase().includes(searchLower) ||
        tool.description?.toLowerCase().includes(searchLower) ||
        tool.category?.toLowerCase().includes(searchLower)
      )

      return categoryMatch && searchMatch
    })
  }, [tools, selectedCategory, searchTerm])

  return (
    <TransitionDialog
      open={isOpen}
      onClose={onClose}
      animationType="auto"
      speed="fast"
      enableHaptics={true}
      className="!max-w-5xl !max-h-[95vh] sm:!max-h-[90vh] flex flex-col"
      title="Herramientas Disponibles"
      description={`${filteredTools.length} ${filteredTools.length === 1 ? 'herramienta' : 'herramientas'}${selectedCategory !== 'all' ? ` en ${selectedCategory}` : ''}${tools.length !== filteredTools.length ? ` de ${tools.length} totales` : ''}`}
    >

        {/* Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 space-y-2 sm:space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pl-9 text-sm bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
            <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark" />
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark flex items-center">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Categoría:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 ${selectedCategory === 'all'
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm'
                  }`}
              >
                <div className="font-semibold text-xs sm:text-sm">Todas</div>
                <span className="text-[10px] sm:text-xs opacity-80">({tools.length})</span>
              </button>
              {categories.map(({ category, count }) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all border-2 ${selectedCategory === category
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-gray-50 dark:bg-gray-800 text-text-light dark:text-text-dark border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-sm'
                    }`}
                >
                  <div className="font-semibold text-xs sm:text-sm truncate">{category}</div>
                  <span className="text-[10px] sm:text-xs opacity-80">({count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || selectedCategory !== 'all') && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary-light dark:text-text-secondary-dark">
                Mostrando {filteredTools.length} de {tools.length} herramientas
              </span>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('all')
                }}
                className="text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-text-light dark:text-text-dark mb-2">
                {searchTerm || selectedCategory !== 'all'
                  ? 'No se encontraron herramientas'
                  : 'No hay herramientas disponibles'}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3 sm:mb-4">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Intenta con otros filtros o términos de búsqueda'
                  : 'Todas las herramientas están prestadas'}
              </p>
              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="claro-button-secondary px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredTools.map((tool) => {
                return (
                  <div
                    key={tool.item_type_id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
                  >
                    {/* Tool Header */}
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="p-1.5 sm:p-2 bg-claro-green/10 rounded-lg flex-shrink-0">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-claro-green" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-light dark:text-text-dark text-xs sm:text-sm truncate">
                            {tool.name}
                          </h4>
                          {tool.category && (
                            <span className="inline-block bg-gray-200 dark:bg-gray-700 text-text-light dark:text-text-dark text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded mt-1">
                              {tool.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-2 flex-shrink-0">
                        <span className="text-xl sm:text-2xl font-bold text-claro-green">
                          {tool.available_count}
                        </span>
                        <span className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          disponibles
                        </span>
                      </div>
                    </div>

                    {/* Tool Description */}
                    {tool.description && (
                      <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2 sm:mb-3 line-clamp-2">
                        {tool.description}
                      </p>
                    )}

                    {/* Action Hint */}
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-[10px] sm:text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                        Escanea el QR para solicitar
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card-light dark:bg-card-dark border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <p className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark text-center sm:text-left">
              💡 Filtra por categoría para encontrar herramientas
            </p>
            <button
              onClick={onClose}
              className="claro-button-secondary px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
            >
              Cerrar
            </button>
          </div>
        </div>
    </TransitionDialog>
  )
}
