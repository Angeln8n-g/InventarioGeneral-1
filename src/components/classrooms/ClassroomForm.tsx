import React, { useState } from 'react'
import type { CreateClassroomInput, UpdateClassroomInput } from '@/types/classrooms'
import { validateClassroomInput } from '@/types/classrooms'

interface ClassroomFormProps {
  initial?: Partial<CreateClassroomInput>
  onSubmit: (data: CreateClassroomInput | UpdateClassroomInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export const ClassroomForm: React.FC<ClassroomFormProps> = ({ initial, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState<CreateClassroomInput>({
    name: initial?.name || '',
    location: initial?.location || '',
    status: (initial?.status as any) || 'active',
    description: initial?.description || '',
    responsible_person: initial?.responsible_person || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof CreateClassroomInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      const n = { ...errors }
      delete n[field]
      setErrors(n)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validateClassroomInput(formData as unknown as Record<string, unknown>)
    if (!validation.isValid) {
      const n: Record<string, string> = {}
      validation.errors.forEach(err => { n[err.field] = err.message })
      setErrors(n)
      return
    }
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className={`w-full border ${errors.name ? 'border-claro-red' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm`}
        />
        {errors.name && <p className="mt-1 text-xs text-claro-red">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Localidad</label>
        <input
          type="text"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          className={`w-full border ${errors.location ? 'border-claro-red' : 'border-gray-300'} rounded-lg px-3 py-2 text-sm`}
        />
        {errors.location && <p className="mt-1 text-xs text-claro-red">{errors.location}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Estatus</label>
        <select
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
          <option value="maintenance">maintenance</option>
        </select>
        {errors.status && <p className="mt-1 text-xs text-claro-red">{errors.status}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">Responsable</label>
        <input
          type="text"
          value={formData.responsible_person || ''}
          onChange={(e) => handleChange('responsible_person', e.target.value)}
          placeholder="Nombre del responsable del aula"
          className="w-full border border-gray-300 dark:border-gray-600 bg-card-light dark:bg-card-dark rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 bg-card-light dark:bg-card-dark rounded-lg px-3 py-2 text-sm"
          rows={3}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={isSubmitting} className="flex-1 claro-button-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">{isSubmitting ? 'Guardando...' : 'Guardar'}</button>
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="flex-1 claro-button-secondary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">Cancelar</button>
      </div>
    </form>
  )
}

