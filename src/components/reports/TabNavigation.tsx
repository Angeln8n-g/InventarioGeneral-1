'use client'

import { useState } from 'react'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

interface TabNavigationProps {
  tabs: Tab[]
  defaultTab?: string
}

export default function TabNavigation({ tabs, defaultTab }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2
                transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">{activeTabContent}</div>
    </div>
  )
}
