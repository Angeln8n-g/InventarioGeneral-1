'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ClassroomForm } from '@/components/classrooms/ClassroomForm'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { toastSuccess, toastError } from '@/lib/toast'

export default function NewClassroomPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const token = useSelector((state: RootState) => state.auth.token)

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/classrooms', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify(data) 
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }))
        throw new Error(err.error?.message || `Error ${res.status}: ${res.statusText}`)
      }
      
      toastSuccess('Aula creada', 'El aula ha sido creada exitosamente')
      router.push('/admin/classrooms')
    } catch (error) {
      console.error('Submit error:', error)
      toastError('Error al crear aula', error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href="/admin/classrooms"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-claro-red dark:hover:border-claro-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-gray-700 dark:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Volver</span>
          </Link>
          <h1 className="text-2xl font-bold">Crear Aula</h1>
        </div>
        <div className="bg-card-light dark:bg-card-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <ClassroomForm onSubmit={handleSubmit} onCancel={() => router.back()} isSubmitting={isSubmitting} />
        </div>
      </div>
    </ProtectedRoute>
  )
}

