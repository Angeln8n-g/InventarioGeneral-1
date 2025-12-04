'use client'
import React from 'react'
import { Cable, SatelliteDishIcon, Wifi } from 'lucide-react'

interface QuickActionsProps {
  onCategoryClick: (category: string) => void
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onCategoryClick }) => {
  const categories = [
    {
      id: 'Material de Cobre',
      name: 'Material de Cobre',
      description: 'Cables y conectores',
      icon: Cable,
      iconBg: 'bg-red-300 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
      hoverBorder: 'hover:border-red-500 dark:hover:border-red-500',
      hoverBg: 'hover:bg-red-50 dark:hover:bg-red-900/20',
      groupHoverIconBg: 'group-hover:bg-red-200 dark:group-hover:bg-red-900/60',
    },
    {
      id: 'Material de DTH',
      name: 'Material de DTH',
      description: 'Equipos y accesorios',
      icon: SatelliteDishIcon,
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      iconColor: 'text-orange-600 dark:text-orange-400',
      hoverBorder: 'hover:border-orange-500 dark:hover:border-orange-500',
      hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-900/20',
      groupHoverIconBg: 'group-hover:bg-orange-200 dark:group-hover:bg-orange-900/60',
    },
    {
      id: 'Material de Fibra',
      name: 'Material de Fibra',
      description: 'Fibra óptica y componentes',
      icon: Wifi,
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      hoverBorder: 'hover:border-blue-500 dark:hover:border-blue-500',
      hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
      groupHoverIconBg: 'group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60',
    },
  ]

  return (
    <div className="mb-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-text-light dark:text-text-dark">Quick Actions</h2>
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Acceso rápido a categorías de materiales
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 ${category.hoverBorder} ${category.hoverBg} transition-all group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm`}
            >
              <div className={`w-12 h-12 ${category.iconBg} rounded-lg flex items-center justify-center mb-3 ${category.groupHoverIconBg} transition-colors`}>
                <Icon className={`w-6 h-6 ${category.iconColor}`} />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white">{category.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">{category.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
