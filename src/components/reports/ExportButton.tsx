'use client'

import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { Download, FileText, FileSpreadsheet, FileType, Loader2 } from 'lucide-react'
import { ExportButtonProps } from '@/types/reports'

export default function ExportButton({
  reportType,
  filters,
  format,
  filename,
  onExportStart,
  onExportComplete,
  onExportError,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const token = useSelector((state: RootState) => state.auth.token)

  const getFormatIcon = () => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4" />
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4" />
      case 'csv':
        return <FileType className="w-4 h-4" />
    }
  }

  const getFormatLabel = () => {
    switch (format) {
      case 'pdf':
        return 'PDF'
      case 'excel':
        return 'Excel'
      case 'csv':
        return 'CSV'
    }
  }

  const generateFilename = () => {
    if (filename) return filename

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const dateRange =
      filters.dateRange?.start && filters.dateRange?.end
        ? `${filters.dateRange.start}-to-${filters.dateRange.end}`
        : 'all-time'

    return `${reportType}-report-${dateRange}-${timestamp}.${format === 'excel' ? 'xlsx' : format}`
  }

  const handleExport = async () => {
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión nuevamente.')
      return
    }

    setIsExporting(true)
    onExportStart?.()

    try {
      const response = await fetch('/api/admin/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType,
          format,
          filters,
          filename: generateFilename(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Error al exportar el reporte')
      }

      // Get the blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateFilename()
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onExportComplete?.()

      // Show success notification (you can integrate with your notification system)
      if (typeof window !== 'undefined') {
        // Simple alert for now, can be replaced with toast notification
        alert('Reporte exportado exitosamente')
      }
    } catch (error) {
      console.error('Export error:', error)
      onExportError?.(error as Error)

      // Show error notification
      if (typeof window !== 'undefined') {
        alert(
          `Error al exportar: ${error instanceof Error ? error.message : 'Error desconocido'}`
        )
      }
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exportando...</span>
        </>
      ) : (
        <>
          {getFormatIcon()}
          <span>Exportar {getFormatLabel()}</span>
        </>
      )}
    </button>
  )
}
