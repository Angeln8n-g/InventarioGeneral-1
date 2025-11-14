'use client'

import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/Button'
import { Upload, Download, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportResult {
  success: boolean
  row: number
  name: string
  message: string
  id?: number
}

interface ImportSummary {
  total: number
  success: number
  errors: number
}

interface BulkImportElectronicsProps {
  onImportComplete?: () => void
}

export const BulkImportElectronics: React.FC<BulkImportElectronicsProps> = ({ onImportComplete }) => {
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<ImportResult[] | null>(null)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ]
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file')
        return
      }

      setFile(selectedFile)
      setError(null)
      setResults(null)
      setSummary(null)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
      ]
      
      if (!validTypes.includes(droppedFile.type) && !droppedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Please select a valid Excel file (.xlsx, .xls) or CSV file')
        return
      }

      setFile(droppedFile)
      setError(null)
      setResults(null)
      setSummary(null)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const downloadTemplate = () => {
    const template = [
      {
        name: 'MacBook Pro 14"',
        description: 'Apple MacBook Pro 14 inch laptop',
        category: 'Laptops',
        brand: 'Apple',
        model: 'MacBook Pro 14" M1 Pro',
        serial_number: 'C02XJ0AAJGH5',
        status: 'available',
        condition_notes: 'Excellent condition, includes charger',
      },
      {
        name: 'iPad Pro 11"',
        description: 'Apple iPad Pro 11 inch tablet',
        category: 'Tablets',
        brand: 'Apple',
        model: 'iPad Pro 11" (3rd Gen)',
        serial_number: 'DMXK2LL/A',
        status: 'available',
        condition_notes: 'Good condition, includes Apple Pencil',
      },
      {
        name: 'Dell Latitude 5420',
        description: 'Dell Latitude 5420 business laptop',
        category: 'Laptops',
        brand: 'Dell',
        model: 'Latitude 5420 i7',
        serial_number: 'BXYZ123456',
        status: 'available',
        condition_notes: 'Good condition, Windows 11 Pro',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(template)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Electronics')

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // name
      { wch: 35 }, // description
      { wch: 15 }, // category
      { wch: 15 }, // brand
      { wch: 25 }, // model
      { wch: 20 }, // serial_number
      { wch: 12 }, // status
      { wch: 35 }, // condition_notes
    ]

    XLSX.writeFile(workbook, 'electronics_import_template.xlsx')
  }

  const processFile = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setResults(null)
    setSummary(null)

    try {
      // Read the file
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (jsonData.length === 0) {
        setError('The file is empty or has no valid data')
        setIsProcessing(false)
        return
      }

      // Validate and transform data
      const items = jsonData.map((row: any) => ({
        name: row.name || row.Name || row.NAME || '',
        description: row.description || row.Description || row.DESCRIPTION || '',
        category: row.category || row.Category || row.CATEGORY || 'Otros',
        brand: row.brand || row.Brand || row.BRAND || '',
        model: row.model || row.Model || row.MODEL || '',
        serial_number: row.serial_number || row['Serial Number'] || row.SERIAL_NUMBER || '',
        status: row.status || row.Status || row.STATUS || 'available',
        condition_notes: row.condition_notes || row['Condition Notes'] || row.CONDITION_NOTES || '',
      }))

      // Send to API
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/electronics/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
        setSummary(data.summary)
        
        if (data.summary.errors === 0 && onImportComplete) {
          setTimeout(() => {
            onImportComplete()
          }, 2000)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error?.message || 'Failed to import electronic devices')
      }
    } catch (err) {
      console.error('Error processing file:', err)
      setError('An error occurred while processing the file')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetModal = () => {
    setFile(null)
    setResults(null)
    setSummary(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const closeModal = () => {
    setShowModal(false)
    resetModal()
  }

  return (
    <>
      <Button onClick={() => setShowModal(true)} size="sm" variant="secondary">
        <Upload className="w-4 h-4 mr-2" />
        Bulk Import
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card-light dark:bg-card-dark border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Bulk Import Electronic Devices</h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Import multiple electronic devices from an Excel file
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-light dark:hover:text-text-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-600 dark:border-purple-400 rounded-lg p-4">
                <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">
                  📋 Instructions
                </h4>
                <ol className="text-sm text-purple-600 dark:text-purple-400 space-y-1 list-decimal list-inside">
                  <li>Download the template file below</li>
                  <li>Fill in your electronic devices data</li>
                  <li className="font-semibold">Required: name, category</li>
                  <li>Optional: description, brand, model, serial_number, status, condition_notes</li>
                  <li>Upload the completed file</li>
                  <li>Review the results and fix any errors if needed</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    <strong>Categories:</strong> Laptops, Tablets, Smartphones, Periféricos, Digitales, Otros
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    <strong>Status:</strong> available, loaned, out-of-service, damaged, lost
                  </p>
                </div>
              </div>

              {/* Download Template */}
              <div>
                <Button onClick={downloadTemplate} variant="secondary" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* File Upload Area */}
              {!results && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Upload Excel File
                  </label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-purple-600 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-text-light dark:text-text-dark">
                          {file.name}
                        </p>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-text-light dark:text-text-dark">
                          Drop your Excel file here or click to browse
                        </p>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                          Supports .xlsx, .xls, and .csv files
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-accent rounded-lg p-4">
                  <p className="text-sm text-red-accent flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </p>
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Import Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text-light dark:text-text-dark">
                        {summary.total}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Total
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-accent">
                        {summary.success}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Success
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-accent">
                        {summary.errors}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Errors
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results */}
              {results && results.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Detailed Results</h4>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          result.success
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-accent'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-accent'
                        }`}
                      >
                        <div className="flex items-start">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-accent mt-0.5 mr-2 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-accent mt-0.5 mr-2 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              Row {result.row}: {result.name}
                            </p>
                            <p className={`text-xs mt-1 ${
                              result.success ? 'text-green-600 dark:text-green-400' : 'text-red-accent'
                            }`}>
                              {result.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!results ? (
                  <>
                    <Button
                      onClick={closeModal}
                      variant="secondary"
                      className="flex-1"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={processFile}
                      className="flex-1"
                      disabled={!file || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={resetModal}
                      variant="secondary"
                      className="flex-1"
                    >
                      Import Another File
                    </Button>
                    <Button
                      onClick={closeModal}
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
