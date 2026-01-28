'use client'

/**
 * AuditHistory Component
 * 
 * Displays the audit history of permission changes in the dynamic permissions system.
 * 
 * Features:
 * - List of audit entries ordered by date (most recent first)
 * - Filters for action type, target type, and date range
 * - Expandable details showing what changed (added/removed permissions, before/after values)
 * - Visual indication of different action types
 * - Pagination support
 * 
 * @see Requirements 6.4 - Show audit history ordered by date descending with filters
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Shield,
  ShieldPlus,
  ShieldMinus,
  ShieldCheck,
  Trash2,
  Edit,
  Plus,
  Loader2,
  RefreshCw,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { PermissionAuditEntry, AuditHistoryFilters } from '@/types/permissions'

/**
 * Action type labels and colors for visual differentiation
 */
const ACTION_TYPE_CONFIG: Record<PermissionAuditEntry['actionType'], {
  label: string
  icon: React.ElementType
  bgColor: string
  textColor: string
  borderColor: string
}> = {
  role_created: {
    label: 'Rol Creado',
    icon: Plus,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  role_updated: {
    label: 'Rol Actualizado',
    icon: Edit,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  role_deleted: {
    label: 'Rol Eliminado',
    icon: Trash2,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  role_permissions_changed: {
    label: 'Permisos de Rol',
    icon: ShieldCheck,
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
  },
  user_permissions_changed: {
    label: 'Permisos de Usuario',
    icon: User,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
}

/**
 * Target type labels
 */
const TARGET_TYPE_LABELS: Record<'role' | 'user', string> = {
  role: 'Rol',
  user: 'Usuario',
}

/**
 * Props for the AuditHistory component
 */
export interface AuditHistoryProps {
  onPendingChanges?: (hasChanges: boolean) => void
}

/**
 * Paginated audit history result from API
 */
interface AuditHistoryResult {
  entries: PermissionAuditEntry[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * AuditHistory Component
 */
export default function AuditHistory({ onPendingChanges }: AuditHistoryProps) {
  // State
  const [auditData, setAuditData] = useState<AuditHistoryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set())
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<AuditHistoryFilters>({})
  const [appliedFilters, setAppliedFilters] = useState<AuditHistoryFilters>({})
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  /**
   * Fetch audit history from the API
   */
  const fetchAuditHistory = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Build query parameters
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())
      
      if (appliedFilters.actionType) {
        params.set('actionType', appliedFilters.actionType)
      }
      if (appliedFilters.targetType) {
        params.set('targetType', appliedFilters.targetType)
      }
      if (appliedFilters.adminUserId) {
        params.set('adminUserId', appliedFilters.adminUserId.toString())
      }
      if (appliedFilters.startDate) {
        params.set('startDate', appliedFilters.startDate.toISOString())
      }
      if (appliedFilters.endDate) {
        params.set('endDate', appliedFilters.endDate.toISOString())
      }

      const response = await fetch(`/api/admin/permissions/audit?${params.toString()}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Error al cargar el historial de auditoría')
      }

      const data = await response.json()
      
      // Transform dates from strings to Date objects
      const entries = (data.data?.entries || []).map((entry: PermissionAuditEntry & { createdAt: string }) => ({
        ...entry,
        createdAt: new Date(entry.createdAt),
      }))
      
      setAuditData({
        entries,
        total: data.data?.total || 0,
        page: data.data?.page || 1,
        pageSize: data.data?.pageSize || pageSize,
        totalPages: data.data?.totalPages || 1,
      })
    } catch (error) {
      console.error('Error fetching audit history:', error)
      toast.error(error instanceof Error ? error.message : 'Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, appliedFilters])

  useEffect(() => {
    fetchAuditHistory()
  }, [fetchAuditHistory])

  /**
   * Toggle expanded state for an entry
   */
  const toggleExpanded = (entryId: number) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev)
      if (newSet.has(entryId)) {
        newSet.delete(entryId)
      } else {
        newSet.add(entryId)
      }
      return newSet
    })
  }

  /**
   * Apply filters and reset to page 1
   */
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters })
    setPage(1)
    setShowFilters(false)
  }

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setFilters({})
    setAppliedFilters({})
    setPage(1)
    setShowFilters(false)
  }

  /**
   * Check if any filters are applied
   */
  const hasActiveFilters = (): boolean => {
    return !!(
      appliedFilters.actionType ||
      appliedFilters.targetType ||
      appliedFilters.adminUserId ||
      appliedFilters.startDate ||
      appliedFilters.endDate
    )
  }

  /**
   * Format date for display
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  /**
   * Format date for input field
   */
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  // Loading state
  if (loading && !auditData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando historial de auditoría...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Filter toggle button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              hasActiveFilters()
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-text-light dark:text-text-dark hover:border-primary/50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters() && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary text-white rounded-full">
                {Object.values(appliedFilters).filter(Boolean).length}
              </span>
            )}
          </button>
          
          {hasActiveFilters() && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchAuditHistory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-text-light dark:text-text-dark bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          onClose={() => setShowFilters(false)}
          formatDateForInput={formatDateForInput}
        />
      )}

      {/* Audit entries list */}
      <div className="space-y-3">
        {auditData?.entries.map((entry) => (
          <AuditEntryCard
            key={entry.id}
            entry={entry}
            isExpanded={expandedEntries.has(entry.id)}
            onToggleExpand={() => toggleExpanded(entry.id)}
            formatDate={formatDate}
          />
        ))}
      </div>

      {/* Empty state */}
      {auditData?.entries.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
            {hasActiveFilters() ? 'No se encontraron registros' : 'Sin historial de auditoría'}
          </h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {hasActiveFilters()
              ? 'Intenta con otros filtros de búsqueda'
              : 'Los cambios en permisos aparecerán aquí'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {auditData && auditData.totalPages > 1 && (
        <Pagination
          currentPage={auditData.page}
          totalPages={auditData.totalPages}
          total={auditData.total}
          pageSize={auditData.pageSize}
          onPageChange={setPage}
          loading={loading}
        />
      )}
    </div>
  )
}


/**
 * FilterPanel Component
 * Panel for filtering audit history entries
 */
interface FilterPanelProps {
  filters: AuditHistoryFilters
  onFiltersChange: (filters: AuditHistoryFilters) => void
  onApply: () => void
  onClear: () => void
  onClose: () => void
  formatDateForInput: (date: Date | undefined) => string
}

function FilterPanel({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onClose,
  formatDateForInput,
}: FilterPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-text-light dark:text-text-dark">
          Filtrar Historial
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Action Type Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Tipo de Acción
          </label>
          <select
            value={filters.actionType || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              actionType: e.target.value as PermissionAuditEntry['actionType'] || undefined,
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="role_created">Rol Creado</option>
            <option value="role_updated">Rol Actualizado</option>
            <option value="role_deleted">Rol Eliminado</option>
            <option value="role_permissions_changed">Permisos de Rol</option>
            <option value="user_permissions_changed">Permisos de Usuario</option>
          </select>
        </div>

        {/* Target Type Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Tipo de Objetivo
          </label>
          <select
            value={filters.targetType || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              targetType: e.target.value as 'role' | 'user' || undefined,
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="role">Rol</option>
            <option value="user">Usuario</option>
          </select>
        </div>

        {/* Start Date Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Fecha Desde
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={formatDateForInput(filters.startDate)}
              onChange={(e) => onFiltersChange({
                ...filters,
                startDate: e.target.value ? new Date(e.target.value) : undefined,
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* End Date Filter */}
        <div>
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Fecha Hasta
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="date"
              value={formatDateForInput(filters.endDate)}
              onChange={(e) => onFiltersChange({
                ...filters,
                endDate: e.target.value ? new Date(e.target.value) : undefined,
              })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Filter actions */}
      <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onClear}
          className="px-4 py-2 text-text-light dark:text-text-dark bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Limpiar
        </button>
        <button
          onClick={onApply}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  )
}


/**
 * AuditEntryCard Component
 * Displays a single audit entry with expandable details
 */
interface AuditEntryCardProps {
  entry: PermissionAuditEntry
  isExpanded: boolean
  onToggleExpand: () => void
  formatDate: (date: Date) => string
}

function AuditEntryCard({
  entry,
  isExpanded,
  onToggleExpand,
  formatDate,
}: AuditEntryCardProps) {
  const config = ACTION_TYPE_CONFIG[entry.actionType]
  const Icon = config.icon

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border ${config.borderColor} overflow-hidden transition-all`}>
      {/* Header - always visible */}
      <button
        onClick={onToggleExpand}
        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Action type icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.textColor}`} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Action type badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
              
              {/* Target type badge */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {TARGET_TYPE_LABELS[entry.targetType]}
              </span>
            </div>

            {/* Description */}
            <p className="mt-1 text-sm text-text-light dark:text-text-dark">
              <span className="font-medium">{entry.targetName}</span>
              {entry.actionType === 'role_created' && ' fue creado'}
              {entry.actionType === 'role_updated' && ' fue actualizado'}
              {entry.actionType === 'role_deleted' && ' fue eliminado'}
              {entry.actionType === 'role_permissions_changed' && ' - permisos modificados'}
              {entry.actionType === 'user_permissions_changed' && ' - permisos modificados'}
            </p>

            {/* Metadata */}
            <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(entry.createdAt)}
              </span>
              {entry.adminUsername && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {entry.adminUsername}
                </span>
              )}
            </div>
          </div>

          {/* Expand/collapse indicator */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700">
          <ChangeDetails entry={entry} />
        </div>
      )}
    </div>
  )
}


/**
 * ChangeDetails Component
 * Shows the detailed changes for an audit entry
 */
interface ChangeDetailsProps {
  entry: PermissionAuditEntry
}

function ChangeDetails({ entry }: ChangeDetailsProps) {
  const { changes } = entry
  const hasAdded = changes.added && changes.added.length > 0
  const hasRemoved = changes.removed && changes.removed.length > 0
  const hasBefore = changes.before && Object.keys(changes.before).length > 0
  const hasAfter = changes.after && Object.keys(changes.after).length > 0

  if (!hasAdded && !hasRemoved && !hasBefore && !hasAfter) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
          No hay detalles adicionales disponibles
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Added permissions */}
      {hasAdded && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <ShieldPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Permisos Agregados ({changes.added!.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {changes.added!.map((permission) => (
              <span
                key={permission}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Removed permissions */}
      {hasRemoved && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <ShieldMinus className="h-4 w-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-400">
              Permisos Removidos ({changes.removed!.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {changes.removed!.map((permission) => (
              <span
                key={permission}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-mono bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
              >
                {permission}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Before/After changes */}
      {(hasBefore || hasAfter) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          {hasBefore && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                  Antes
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(changes.before!).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-text-light dark:text-text-dark">{key}:</span>{' '}
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* After */}
          {hasAfter && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Después
                </span>
              </div>
              <div className="space-y-1">
                {Object.entries(changes.after!).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-text-light dark:text-text-dark">{key}:</span>{' '}
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional metadata */}
      {(entry.ipAddress || entry.userAgent) && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark space-y-1">
            {entry.ipAddress && (
              <p>
                <span className="font-medium">IP:</span> {entry.ipAddress}
              </p>
            )}
            {entry.userAgent && (
              <p className="truncate">
                <span className="font-medium">User Agent:</span> {entry.userAgent}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


/**
 * Pagination Component
 * Handles page navigation for audit history
 */
interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  loading?: boolean
}

function Pagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  onPageChange,
  loading,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Results info */}
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span> de{' '}
        <span className="font-medium">{total}</span> registros
      </p>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="flex items-center gap-1 px-3 py-2 text-sm text-text-light dark:text-text-dark bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={`w-10 h-10 flex items-center justify-center text-sm rounded-lg transition-colors ${
                  pageNum === currentPage
                    ? 'bg-primary text-white'
                    : 'text-text-light dark:text-text-dark bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                } disabled:opacity-50`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Página {currentPage} de {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="flex items-center gap-1 px-3 py-2 text-sm text-text-light dark:text-text-dark bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
