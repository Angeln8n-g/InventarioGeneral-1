'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ClassroomForm, ClassroomReservationModal, InternetServicesModal } from '@/components/classrooms'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { toastSuccess, toastError } from '@/lib/toast'
import { Calendar, Wifi } from 'lucide-react'

interface ClassroomItem { id: number; name: string; location: string; status: 'active' | 'inactive' | 'maintenance'; description?: string; responsible_person?: string; device_count: number }
interface AssignmentItem { id: number; electronic_device_id: number; is_active: boolean; assigned_date: string; removed_date?: string; assigned_by_user?: { username: string } ; removed_by_user?: { username: string }; device: { tool_instance: { item_type: { name: string }, serial_number: string | null } } }
interface CombinationItem { id: number; device_1: { tool_instance: { item_type: { name: string } } }; device_2: { tool_instance: { item_type: { name: string } } } }

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const token = useSelector((state: RootState) => state.auth.token)
  const unwrappedParams = React.use(params)
  const classroomId = parseInt(unwrappedParams.id, 10)
  const [item, setItem] = useState<ClassroomItem | null>(null)
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [combinations, setCombinations] = useState<CombinationItem[]>([])
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReservations, setShowReservations] = useState(false)
  const [showInternetServices, setShowInternetServices] = useState(false)

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const headers = { 'Authorization': `Bearer ${token}` }
      const res = await fetch(`/api/admin/classrooms/${classroomId}`, { headers })
      const json = await res.json()
      setItem(json.data)
      const aRes = await fetch(`/api/admin/device-assignments/by-classroom/${classroomId}`, { headers })
      const aJson = await aRes.json()
      setAssignments(aJson.data || [])
      const cRes = await fetch(`/api/admin/device-combinations/by-classroom/${classroomId}`, { headers })
      const cJson = await cRes.json()
      setCombinations(cJson.data || [])
    } catch (error) {
      console.error('Error loading classroom:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (token) {
      load() 
    }
  }, [classroomId, token])

  const handleUpdate = async (data: any) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}`, { 
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify(data) 
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Error al actualizar' } }))
        throw new Error(err.error?.message || 'Error al actualizar')
      }
      toastSuccess('Aula actualizada', 'Los cambios han sido guardados')
      setEditing(false)
      await load()
    } catch (error) {
      toastError('Error al actualizar', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!item) return
    const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta aula? Esta acción no se puede deshacer.')
    if (!confirmDelete) return
    try {
      const res = await fetch(`/api/admin/classrooms/${classroomId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const e = await res.json().catch(()=>({ error: { message: 'Error' } }))
        throw new Error(e.error?.message || 'Error al eliminar')
      }
      toastSuccess('Aula eliminada', 'El aula ha sido eliminada correctamente')
      router.push('/admin/classrooms')
    } catch (error) {
      toastError('Error al eliminar', error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  if (loading || !item) return <div className="px-4 py-6">Cargando...</div>

  return (
    <ProtectedRoute>
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/classrooms"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-claro-red dark:hover:border-claro-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-gray-700 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Volver</span>
          </Link>
          <h1 className="text-2xl font-bold">{item.name}</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInternetServices(true)} 
            className="flex items-center gap-2 claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Wifi className="w-4 h-4" />
            Internet
          </button>
          <button 
            onClick={() => setShowReservations(true)} 
            className="flex items-center gap-2 claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Calendar className="w-4 h-4" />
            Reservas
          </button>
          <button onClick={() => setEditing(true)} className="claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium">Editar</button>
          <button onClick={handleDelete} disabled={item.device_count>0} className="bg-claro-red text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Eliminar</button>
        </div>
      </div>
      <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        <p>{item.location} • {item.status} • {item.device_count} dispositivos</p>
        {item.responsible_person && (
          <p className="mt-1">
            <span className="font-medium">Responsable:</span> {item.responsible_person}
          </p>
        )}
      </div>

      {editing && (
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <ClassroomForm initial={item} onSubmit={handleUpdate} onCancel={() => setEditing(false)} isSubmitting={isSubmitting} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border">
          <h3 className="font-semibold mb-2">Asignaciones Activas ({assignments.filter(a => a.is_active).length})</h3>
          <div className="space-y-2">
            {assignments.filter(a => a.is_active).length === 0 ? (
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sin asignaciones activas</p>
            ) : assignments.filter(a => a.is_active).map(a => (
              <div key={a.id} className="border rounded p-2 bg-green-50 dark:bg-green-900/20">
                <p className="text-sm font-medium">{a.device.tool_instance.item_type.name}</p>
                <p className="text-xs text-text-secondary-light">Serie: {a.device.tool_instance.serial_number || 'N/A'}</p>
                <p className="text-xs text-text-secondary-light">Asignado: {new Date(a.assigned_date).toLocaleDateString()}</p>
                {a.assigned_by_user && (
                  <p className="text-xs text-text-secondary-light">Por: {a.assigned_by_user.username}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border">
          <h3 className="font-semibold mb-2">Combinaciones ({combinations.length})</h3>
          <div className="space-y-2">
            {combinations.length === 0 ? (
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Sin combinaciones</p>
            ) : combinations.map(c => (
              <div key={c.id} className="border rounded p-2 bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm font-medium">{c.device_1.tool_instance.item_type.name} + {c.device_2.tool_instance.item_type.name}</p>
                <p className="text-xs text-text-secondary-light">Workstation</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment History */}
      {assignments.filter(a => !a.is_active).length > 0 && (
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border">
          <h3 className="font-semibold mb-4">Historial de Asignaciones ({assignments.filter(a => !a.is_active).length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Dispositivo</th>
                  <th className="px-4 py-2 text-left">Serie</th>
                  <th className="px-4 py-2 text-left">Asignado</th>
                  <th className="px-4 py-2 text-left">Removido</th>
                  <th className="px-4 py-2 text-left">Asignado Por</th>
                  <th className="px-4 py-2 text-left">Removido Por</th>
                </tr>
              </thead>
              <tbody>
                {assignments.filter(a => !a.is_active).map(a => (
                  <tr key={a.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{a.device.tool_instance.item_type.name}</td>
                    <td className="px-4 py-2">{a.device.tool_instance.serial_number || 'N/A'}</td>
                    <td className="px-4 py-2">{new Date(a.assigned_date).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      {a.removed_date ? new Date(a.removed_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2">{a.assigned_by_user?.username || '—'}</td>
                    <td className="px-4 py-2">{a.removed_by_user?.username || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      <ClassroomReservationModal
        isOpen={showReservations}
        onClose={() => setShowReservations(false)}
        classroomId={classroomId}
        classroomName={item.name}
        token={token}
      />

      {/* Internet Services Modal */}
      <InternetServicesModal
        isOpen={showInternetServices}
        onClose={() => setShowInternetServices(false)}
        classroomId={classroomId}
        classroomName={item.name}
        token={token}
      />
    </div>
    </ProtectedRoute>
  )
}

