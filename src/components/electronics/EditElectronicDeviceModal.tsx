import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import { TransitionDialog } from '@/components/ui/TransitionDialog'
import { ElectronicDeviceForm } from './ElectronicDeviceForm'
import type { ElectronicDeviceWithDetails, CreateElectronicDeviceInput, UpdateElectronicDeviceInput } from '@/types/database'
import { toastSuccess, toastError } from '@/lib/toast'

interface EditElectronicDeviceModalProps {
  device: ElectronicDeviceWithDetails
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export const EditElectronicDeviceModal: React.FC<EditElectronicDeviceModalProps> = ({ device, isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const token = useSelector((state: RootState) => state.auth.token)

  const handleSubmit = async (data: CreateElectronicDeviceInput | UpdateElectronicDeviceInput) => {
    if (!token) {
      console.error('No authentication token available')
      toastError('Error de autenticación', 'Por favor inicia sesión nuevamente.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/electronics/${device.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
        throw new Error(err.error?.message || 'Failed to update device')
      }
      toastSuccess('Dispositivo actualizado', 'Los cambios han sido guardados correctamente')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Electronic device update error:', error)
      toastError('Error al actualizar', error instanceof Error ? error.message : 'Error al actualizar el dispositivo')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TransitionDialog open={isOpen} onClose={onClose} animationType="scale" speed="fast" title="Edit Electronic Device" className="!max-w-xl">
      <div className="p-6">
        <ElectronicDeviceForm device={device} onSubmit={handleSubmit} onCancel={onClose} isSubmitting={isSubmitting} />
      </div>
    </TransitionDialog>
  )
}

