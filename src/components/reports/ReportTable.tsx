'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, FileX } from 'lucide-react'
import { ReportTableProps, ColumnConfig } from '@/types/reports'

export default function ReportTable<T extends Record<string, unknown>>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onSort,
  onRowClick,
  isLoading = false,
}: ReportTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: ColumnConfig<T>) => {
    if (!column.sortable || !onSort) return

    const newDirection =
      sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(column.key)
    setSortDirection(newDirection)
    onSort(column.key as string, newDirection)
  }

  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, totalCount)

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {columns.map((_, index) => (
                    <td key={index} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <FileX className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay datos disponibles
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron registros con los filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key as string}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${getAlignmentClass(column.align)} ${column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <div className="w-4 h-4 opacity-30">
                            <ChevronUp className="w-4 h-2" />
                            <ChevronDown className="w-4 h-2 -mt-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key as string}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${getAlignmentClass(column.align)}`}
                  >
                    {column.format ? (
                      column.format(row[column.key], row)
                    ) : (
                      <span className="text-gray-900 dark:text-gray-100">
                        {String(row[column.key] ?? '-')}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span className="font-medium">{startIndex}</span> a{' '}
              <span className="font-medium">{endIndex}</span> de{' '}
              <span className="font-medium">{totalCount}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (page <= 3) {
                  pageNumber = i + 1
                } else if (page >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = page - 2 + i
                }

                return (
                  <button
                    key={pageNumber}
                    onClick={() => onPageChange(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === pageNumber
                        ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              })}
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}
