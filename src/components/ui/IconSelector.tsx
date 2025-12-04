'use client'

import React, { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'

// Comprehensive list of category icons with emojis
const CATEGORY_ICONS = [
  // Electronics
  { value: '💻', label: 'Laptop', category: 'electronics' },
  { value: '🖥️', label: 'Desktop', category: 'electronics' },
  { value: '📱', label: 'Smartphone', category: 'electronics' },
  { value: '📲', label: 'Tablet', category: 'electronics' },
  { value: '⌨️', label: 'Teclado', category: 'electronics' },
  { value: '🖱️', label: 'Ratón', category: 'electronics' },
  { value: '🖨️', label: 'Impresora', category: 'electronics' },
  { value: '📺', label: 'TV/Monitor', category: 'electronics' },
  { value: '🎧', label: 'Auriculares', category: 'electronics' },
  { value: '🔊', label: 'Altavoz', category: 'electronics' },
  { value: '🎤', label: 'Micrófono', category: 'electronics' },
  { value: '📷', label: 'Cámara', category: 'electronics' },
  { value: '📹', label: 'Videocámara', category: 'electronics' },
  { value: '📡', label: 'Router/Red', category: 'electronics' },
  { value: '💾', label: 'Almacenamiento', category: 'electronics' },
  { value: '💿', label: 'Disco', category: 'electronics' },
  { value: '🔌', label: 'Cable/Adaptador', category: 'electronics' },
  { value: '🔋', label: 'Batería', category: 'electronics' },
  { value: '⚡', label: 'Cargador', category: 'electronics' },
  { value: '🎮', label: 'Gaming', category: 'electronics' },
  { value: '🕹️', label: 'Control', category: 'electronics' },
  
  // Office
  { value: '📁', label: 'Carpeta', category: 'office' },
  { value: '📂', label: 'Archivos', category: 'office' },
  { value: '📋', label: 'Portapapeles', category: 'office' },
  { value: '📝', label: 'Notas', category: 'office' },
  { value: '✏️', label: 'Lápiz', category: 'office' },
  { value: '📎', label: 'Clip', category: 'office' },
  { value: '📌', label: 'Pin', category: 'office' },
  { value: '✂️', label: 'Tijeras', category: 'office' },
  { value: '📏', label: 'Regla', category: 'office' },
  
  // Tools
  { value: '🔧', label: 'Llave', category: 'tools' },
  { value: '🔨', label: 'Martillo', category: 'tools' },
  { value: '🪛', label: 'Destornillador', category: 'tools' },
  { value: '⚙️', label: 'Engranaje', category: 'tools' },
  { value: '🔩', label: 'Tornillo', category: 'tools' },
  { value: '🧰', label: 'Caja herramientas', category: 'tools' },
  
  // General
  { value: '📦', label: 'Caja', category: 'general' },
  { value: '🏷️', label: 'Etiqueta', category: 'general' },
  { value: '🔖', label: 'Marcador', category: 'general' },
  { value: '📊', label: 'Gráfico', category: 'general' },
  { value: '📈', label: 'Estadísticas', category: 'general' },
  { value: '🗂️', label: 'Índice', category: 'general' },
  { value: '🗃️', label: 'Archivo', category: 'general' },
]

interface IconSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export const IconSelector: React.FC<IconSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = useMemo(() => {
    const cats = [...new Set(CATEGORY_ICONS.map((icon) => icon.category))]
    return cats.map((cat) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    }))
  }, [])

  const filteredIcons = useMemo(() => {
    return CATEGORY_ICONS.filter((icon) => {
      const matchesSearch =
        !searchTerm ||
        icon.label.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || icon.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchTerm, selectedCategory])

  const selectedIcon = CATEGORY_ICONS.find((icon) => icon.value === value)

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 hover:border-blue-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <span className="text-2xl">{value}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedIcon?.label || 'Icono seleccionado'}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-400">Seleccionar icono...</span>
          )}
        </div>
        <span className="text-gray-400">▼</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar icono..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={`px-2 py-1 text-xs rounded ${
                !selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-2 py-1 text-xs rounded ${
                  selectedCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Icons Grid */}
          <div className="p-2 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-6 gap-1">
              {/* No icon option */}
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setIsOpen(false)
                }}
                className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center ${
                  !value ? 'ring-2 ring-blue-500' : ''
                }`}
                title="Sin icono"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
              {filteredIcons.map((icon) => (
                <button
                  key={icon.value}
                  type="button"
                  onClick={() => {
                    onChange(icon.value)
                    setIsOpen(false)
                  }}
                  className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-xl ${
                    value === icon.value ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                  title={icon.label}
                >
                  {icon.value}
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">
                No se encontraron iconos
              </p>
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default IconSelector
