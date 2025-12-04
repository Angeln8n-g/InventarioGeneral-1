'use client'

import React, { useMemo } from 'react'
import { EnhancedMetricCard } from './EnhancedMetricCard'
import { UnifiedAlertsPanel } from './UnifiedAlertsPanel'
import type { SectionProps, DashboardSummary, UnifiedAlert, DashboardSection } from '@/types/unified-dashboard'

interface OverviewSectionProps extends SectionProps {
  summary?: DashboardSummary
  alerts?: UnifiedAlert[]
  loading?: boolean
  onNavigateToSection?: (section: DashboardSection) => void
  onAlertClick?: (alert: UnifiedAlert) => void
}

// Icons for metric cards
const ToolsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const AvailableIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const LoanIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
)

const OverdueIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ConsumableIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const LowStockIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const ElectronicsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

export function OverviewSection({
  summary,
  alerts = [],
  loading = false,
  onNavigateToSection,
  onAlertClick,
}: OverviewSectionProps) {
  const metrics = useMemo(() => [
    {
      title: 'Total Herramientas',
      value: summary?.tools.total ?? 0,
      icon: <ToolsIcon />,
      color: 'blue' as const,
      section: 'tools' as DashboardSection,
    },
    {
      title: 'Disponibles',
      value: summary?.tools.available ?? 0,
      icon: <AvailableIcon />,
      color: 'green' as const,
      section: 'tools' as DashboardSection,
    },
    {
      title: 'Préstamos Activos',
      value: summary?.loans.active ?? 0,
      icon: <LoanIcon />,
      color: 'purple' as const,
      section: 'loans' as DashboardSection,
    },
    {
      title: 'Préstamos Vencidos',
      value: summary?.loans.overdue ?? 0,
      icon: <OverdueIcon />,
      color: 'red' as const,
      section: 'loans' as DashboardSection,
    },
    {
      title: 'Tipos de Consumibles',
      value: summary?.consumables.totalTypes ?? 0,
      icon: <ConsumableIcon />,
      color: 'orange' as const,
      section: 'consumables' as DashboardSection,
    },
    {
      title: 'Stock Bajo',
      value: summary?.consumables.lowStockCount ?? 0,
      icon: <LowStockIcon />,
      color: 'yellow' as const,
      section: 'consumables' as DashboardSection,
    },
    {
      title: 'Dispositivos Electrónicos',
      value: summary?.electronics.total ?? 0,
      icon: <ElectronicsIcon />,
      color: 'blue' as const,
      section: 'electronics' as DashboardSection,
    },
    {
      title: 'Usuarios Activos',
      value: summary?.users.active ?? 0,
      icon: <UsersIcon />,
      color: 'green' as const,
      section: 'users' as DashboardSection,
    },
  ], [summary])

  const handleAlertClick = (alert: UnifiedAlert) => {
    onAlertClick?.(alert)
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <EnhancedMetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            color={metric.color}
            loading={loading}
            onClick={onNavigateToSection ? () => onNavigateToSection(metric.section) : undefined}
          />
        ))}
      </div>

      {/* Alerts Panel */}
      <UnifiedAlertsPanel
        alerts={alerts}
        onAlertClick={handleAlertClick}
        loading={loading}
      />

      {/* Quick Navigation */}
      {onNavigateToSection && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Acceso Rápido
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Herramientas', section: 'tools' as DashboardSection, icon: <ToolsIcon /> },
              { label: 'Consumibles', section: 'consumables' as DashboardSection, icon: <ConsumableIcon /> },
              { label: 'Préstamos', section: 'loans' as DashboardSection, icon: <LoanIcon /> },
              { label: 'Electrónicos', section: 'electronics' as DashboardSection, icon: <ElectronicsIcon /> },
              { label: 'Aulas', section: 'classrooms' as DashboardSection, icon: <ElectronicsIcon /> },
              { label: 'Usuarios', section: 'users' as DashboardSection, icon: <UsersIcon /> },
            ].map((item) => (
              <button
                key={item.section}
                onClick={() => onNavigateToSection(item.section)}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-8 h-8 text-gray-600 dark:text-gray-300">
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
