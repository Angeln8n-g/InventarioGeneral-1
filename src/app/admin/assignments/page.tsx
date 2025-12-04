'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { toastError, toastSuccess, toastWarning } from '@/lib/toast'
import { ErrorBoundary, ErrorMessage } from '@/components/ui/ErrorBoundary'

interface ClassroomItem { 
  id: number
  name: string
  location: string
  status: string
  device_count?: number
}

interface DeviceItem { 
  id: number
  brand?: string
  model?: string
  tool_instance: { 
    id: number
    item_type: { name: string; category: string }
    serial_number: string | null
    status: string
  }
}

interface AssignmentItem { 
  id: number
  electronic_device_id: number
  classroom_id: number
  is_active: boolean
  assigned_date: string
  device: DeviceItem
}

interface CombinationItem { 
  id: number
  device_1_id: number
  device_2_id: number
  device_1: DeviceItem
  device_2: DeviceItem
  combination_type?: string
  is_active: boolean
}

function AssignmentsPageContent() {
  const token = useSelector((state: RootState) => state.auth.token)
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<number | null>(null)
  const [devices, setDevices] = useState<DeviceItem[]>([])
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [allAssignments, setAllAssignments] = useState<AssignmentItem[]>([]) // All active assignments across all classrooms
  const [combinations, setCombinations] = useState<CombinationItem[]>([])
  const [allCombinations, setAllCombinations] = useState<CombinationItem[]>([]) // All active combinations
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigningDevice, setAssigningDevice] = useState<number | null>(null)
  const [removingAssignment, setRemovingAssignment] = useState<number | null>(null)
  const [selectedDevices, setSelectedDevices] = useState<number[]>([])

  const loadClassrooms = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/classrooms', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Error al cargar aulas')
      const json = await res.json()
      setClassrooms(json.data || [])
      if (!selectedClassroom && json.data?.[0]) setSelectedClassroom(json.data[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar aulas')
    }
  }

  const loadDevices = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/admin/electronics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Error al cargar dispositivos')
      const json = await res.json()
      setDevices((json.data || []).map((d: any) => ({
        id: d.id,
        brand: d.brand,
        model: d.model,
        tool_instance: d.tool_instance
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dispositivos')
    }
  }

  const loadAllAssignmentsAndCombinations = async () => {
    if (!token) return
    try {
      // Load all active assignments
      const assignRes = await fetch('/api/admin/device-assignments?status=active', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (assignRes.ok) {
        const assignJson = await assignRes.json()
        setAllAssignments(assignJson.data || [])
      }

      // Load all active combinations
      const combRes = await fetch('/api/admin/device-combinations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (combRes.ok) {
        const combJson = await combRes.json()
        setAllCombinations(combJson.data || [])
      }
    } catch (err) {
      console.error('Error loading all assignments/combinations:', err)
    }
  }

  const loadAssignments = async (classroomId: number) => {
    if (!token) return
    try {
      const res = await fetch(`/api/admin/device-assignments/by-classroom/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Error al cargar asignaciones')
      const json = await res.json()
      setAssignments(json.data || [])
      
      const cRes = await fetch(`/api/admin/device-combinations/by-classroom/${classroomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!cRes.ok) {
        const errorData = await cRes.json().catch(() => ({}))
        console.error('Error loading combinations - Status:', cRes.status)
        console.error('Error loading combinations - Data:', JSON.stringify(errorData, null, 2))
        // Don't throw error, just set empty combinations
        setCombinations([])
        return
      }
      const cJson = await cRes.json()
      setCombinations(cJson.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true)
      Promise.all([loadClassrooms(), loadDevices(), loadAllAssignmentsAndCombinations()]).finally(() => setLoading(false))
    }
  }, [token])

  useEffect(() => { if (selectedClassroom) loadAssignments(selectedClassroom) }, [selectedClassroom])

  const activeDeviceIds = useMemo(()=> assignments.filter(a=>a.is_active).map(a=>a.electronic_device_id), [assignments])

  // Get all assigned device IDs across ALL classrooms
  const allAssignedDeviceIds = useMemo(()=> allAssignments.filter(a=>a.is_active).map(a=>a.electronic_device_id), [allAssignments])

  // Truly unassigned devices (not assigned to ANY classroom)
  const unassignedDevices = useMemo(()=> devices.filter(d=> !allAssignedDeviceIds.includes(d.id)), [devices, allAssignedDeviceIds])

  // Devices assigned to OTHER classrooms
  const devicesInOtherClassrooms = useMemo(() => {
    return devices.filter(d => {
      const assignment = allAssignments.find(a => a.electronic_device_id === d.id && a.is_active)
      return assignment && assignment.classroom_id !== selectedClassroom
    })
  }, [devices, allAssignments, selectedClassroom])

  const filteredUnassigned = unassignedDevices.filter(d => {
    const matchesCategory = !categoryFilter || d.tool_instance.item_type.category === categoryFilter
    const matchesSearch = !searchTerm || 
      d.tool_instance.item_type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tool_instance.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.model?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === 'active') return a.is_active
    if (statusFilter === 'removed') return !a.is_active
    return true
  })

  const activeCombinations = combinations.filter(c => c.is_active)

  const assignDevice = async (deviceId: number) => {
    if (!selectedClassroom) return
    setAssigningDevice(deviceId)
    setError(null)
    try {
      const res = await fetch('/api/admin/device-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          electronic_device_id: deviceId,
          classroom_id: selectedClassroom,
          notes: 'Asignado desde la interfaz de administración'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || 'Error al asignar dispositivo')
      }
      
      await Promise.all([loadAssignments(selectedClassroom), loadAllAssignmentsAndCombinations()])
      toastSuccess('Dispositivo asignado', 'El dispositivo ha sido asignado al aula correctamente')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar dispositivo'
      setError(message)
      toastError('Error al asignar', message)
    } finally {
      setAssigningDevice(null)
    }
  }

  const removeAssignment = async (assignmentId: number) => {
    if (!selectedClassroom) return
    if (!confirm('¿Estás seguro de que quieres remover esta asignación?')) return
    
    setRemovingAssignment(assignmentId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/device-assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || 'Error al remover asignación')
      }
      
      await Promise.all([loadAssignments(selectedClassroom), loadAllAssignmentsAndCombinations()])
      toastSuccess('Asignación removida', 'El dispositivo ha sido removido del aula')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al remover asignación'
      setError(message)
      toastError('Error al remover', message)
    } finally {
      setRemovingAssignment(null)
    }
  }

  const createCombination = async (device1Id: number, device2Id: number) => {
    if (!selectedClassroom) return
    setError(null)
    try {
      const res = await fetch('/api/admin/device-combinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          device_1_id: device1Id,
          device_2_id: device2Id,
          combination_type: 'Workstation'
        })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || 'Error al crear combinación')
      }
      
      await Promise.all([loadAssignments(selectedClassroom), loadAllAssignmentsAndCombinations()])
      setSelectedDevices([])
      toastSuccess('Dispositivos combinados', 'Los dispositivos han sido enlazados correctamente')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear combinación'
      setError(message)
      toastError('Error al combinar', message)
    }
  }

  const removeCombination = async (combinationId: number) => {
    if (!selectedClassroom) return
    if (!confirm('¿Estás seguro de que quieres remover esta combinación?')) return
    
    setError(null)
    try {
      const res = await fetch(`/api/admin/device-combinations/${combinationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error?.message || 'Error al remover combinación')
      }
      
      await Promise.all([loadAssignments(selectedClassroom), loadAllAssignmentsAndCombinations()])
      toastSuccess('Combinación removida', 'Los dispositivos han sido desenlazados')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al remover combinación'
      setError(message)
      toastError('Error al desenlazar', message)
    }
  }

  const toggleDeviceSelection = (deviceId: number) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    )
  }

  const getDeviceAssignmentInfo = (deviceId: number) => {
    const assignment = allAssignments.find(a => a.electronic_device_id === deviceId && a.is_active)
    if (!assignment) return null

    const classroom = classrooms.find(c => c.id === assignment.classroom_id)
    const combination = allCombinations.find(c => 
      (c.device_1_id === deviceId || c.device_2_id === deviceId) && c.is_active
    )

    return {
      classroom,
      combination,
      partnerId: combination ? (combination.device_1_id === deviceId ? combination.device_2_id : combination.device_1_id) : null
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-card-light dark:bg-card-dark rounded-lg border border-gray-200 dark:border-gray-700 p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mb-4"></div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">Cargando asignaciones...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link 
            href="/admin/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-claro-red dark:hover:border-claro-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-gray-700 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Volver</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold mb-2">Asignación de Dispositivos</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Asigna dispositivos electrónicos a las aulas y gestiona las asignaciones existentes.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classrooms Panel */}
          <div className="lg:col-span-1">
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Aulas</h2>
              <div className="space-y-2">
                {classrooms.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassroom(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      selectedClassroom === c.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{c.location}</div>
                    {c.device_count !== undefined && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {c.device_count} dispositivos
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Buscar dispositivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                >
                  <option value="">Todas las categorías</option>
                  <option value="Laptops">Laptops</option>
                  <option value="Tablets">Tablets</option>
                  <option value="Smartphones">Smartphones</option>
                  <option value="Periféricos">Periféricos</option>
                  <option value="Digitales">Digitales</option>
                  <option value="Otros">Otros</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800"
                >
                  <option value="active">Activas</option>
                  <option value="removed">Removidas</option>
                  <option value="">Todas</option>
                </select>
              </div>
            </div>

            {/* Unassigned Devices */}
            {selectedClassroom && (
              <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">
                  Dispositivos Disponibles ({filteredUnassigned.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredUnassigned.map(d => (
                    <div
                      key={d.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{d.tool_instance.item_type.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {d.brand} {d.model}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Serie: {d.tool_instance.serial_number || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Estado: {d.tool_instance.status}
                          </div>
                        </div>
                        <button
                          onClick={() => assignDevice(d.id)}
                          disabled={assigningDevice === d.id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {assigningDevice === d.id ? 'Asignando...' : 'Asignar'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredUnassigned.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay dispositivos disponibles para asignar
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Devices in Other Classrooms */}
            {selectedClassroom && devicesInOtherClassrooms.length > 0 && (
              <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">
                  Dispositivos en Otras Aulas ({devicesInOtherClassrooms.length})
                </h2>
                <div className="space-y-2">
                  {devicesInOtherClassrooms.map(d => {
                    const info = getDeviceAssignmentInfo(d.id)
                    const partnerDevice = info?.partnerId ? devices.find(dev => dev.id === info.partnerId) : null
                    
                    return (
                      <div
                        key={d.id}
                        className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{d.tool_instance.item_type.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {d.brand} {d.model}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Serie: {d.tool_instance.serial_number || 'N/A'}
                          </div>
                          {info?.classroom && (
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                📍 {info.classroom.name}
                              </span>
                            </div>
                          )}
                          {info?.combination && partnerDevice && (
                            <div className="mt-1 text-xs">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                🔗 Combinado con: {partnerDevice.tool_instance.item_type.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Assigned Devices */}
            {selectedClassroom && (
              <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">
                  Dispositivos Asignados ({filteredAssignments.length})
                </h2>
                <div className="space-y-2">
                  {filteredAssignments.map(a => (
                    <div
                      key={a.id}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1">
                          {a.is_active && (
                            <input
                              type="checkbox"
                              checked={selectedDevices.includes(a.electronic_device_id)}
                              onChange={() => toggleDeviceSelection(a.electronic_device_id)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">
                              {a.device.tool_instance.item_type.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {a.device.brand} {a.device.model}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Serie: {a.device.tool_instance.serial_number || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              Asignado: {new Date(a.assigned_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {a.is_active ? (
                          <button
                            onClick={() => removeAssignment(a.id)}
                            disabled={removingAssignment === a.id}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm transition-colors"
                          >
                            {removingAssignment === a.id ? 'Removiendo...' : 'Remover'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Removida</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredAssignments.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay dispositivos asignados a esta aula
                    </div>
                  )}
                </div>

                {/* Combine Devices Button */}
                {selectedDevices.length === 2 && (
                  <div className="mt-4">
                    <button
                      onClick={() => createCombination(selectedDevices[0], selectedDevices[1])}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Combinar dispositivos seleccionados
                    </button>
                  </div>
                )}
                {selectedDevices.length > 2 && (
                  <div className="mt-4 text-sm text-orange-600 dark:text-orange-400">
                    Solo puedes combinar 2 dispositivos a la vez. Deselecciona algunos.
                  </div>
                )}
              </div>
            )}

            {/* Device Combinations */}
            {selectedClassroom && activeCombinations.length > 0 && (
              <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4">
                  Combinaciones de Dispositivos ({activeCombinations.length})
                </h2>
                <div className="space-y-3">
                  {activeCombinations.map(c => (
                    <div
                      key={c.id}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium">
                              {c.device_1.tool_instance.item_type.name}
                            </span>
                            <span className="text-blue-600 dark:text-blue-400">+</span>
                            <span className="text-sm font-medium">
                              {c.device_2.tool_instance.item_type.name}
                            </span>
                          </div>
                          {c.combination_type && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              Tipo: {c.combination_type}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeCombination(c.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm transition-colors"
                        >
                          Desenlazar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {selectedClassroom && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {assignments.filter(a => a.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dispositivos Asignados</div>
                </div>
                <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {unassignedDevices.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dispositivos Disponibles</div>
                </div>
                <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {activeCombinations.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Combinaciones Activas</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}

export default function AssignmentsPage() {
  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AssignmentsPageContent />
      </ErrorBoundary>
    </ProtectedRoute>
  )
}

