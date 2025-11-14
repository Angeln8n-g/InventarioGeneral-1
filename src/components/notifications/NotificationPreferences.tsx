'use client'

import React, { useState } from 'react'
import { useGetNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation } from '@/services/api'
import type { NotificationType } from '@/types/notifications'

interface NotificationPreferencesProps {
  onClose?: () => void
}

const notificationLabels: Record<string, string> = {
  loan_confirmation: 'Confirmación de préstamo',
  return_confirmation: 'Confirmación de devolución',
  loan_reminder: 'Recordatorio de préstamo',
  overdue_notice: 'Aviso de vencimiento',
  consumable_fulfilled: 'Consumible entregado',
  consumable_backorder: 'Consumible en backorder',
  system_announcement: 'Anuncios del sistema',
  stock_alert: 'Alertas de stock',
  system_maintenance: 'Mantenimiento del sistema',
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onClose }) => {
  const { data: preferencesData, isLoading } = useGetNotificationPreferencesQuery()
  const [updatePreferences, { isLoading: isUpdating }] = useUpdateNotificationPreferencesMutation()
  const [localPreferences, setLocalPreferences] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)

  const preferences = preferencesData?.data

  React.useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        loan_confirmation: preferences.loan_confirmation,
        return_confirmation: preferences.return_confirmation,
        loan_reminder: preferences.loan_reminder,
        overdue_notice: preferences.overdue_notice,
        consumable_fulfilled: preferences.consumable_fulfilled,
        consumable_backorder: preferences.consumable_backorder,
        system_announcement: preferences.system_announcement,
        stock_alert: preferences.stock_alert,
        system_maintenance: preferences.system_maintenance,
        sound_enabled: preferences.sound_enabled,
      })
    }
  }, [preferences])

  const handleToggle = (key: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences).unwrap()
      setHasChanges(false)
      if (onClose) onClose()
    } catch (error) {
      console.error('Failed to update preferences:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claro-red mx-auto"></div>
        <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Cargando preferencias...
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">
        Preferencias de Notificaciones
      </h2>

      <div className="space-y-4">
        {/* Notification types */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-light dark:text-text-dark mb-2">
            Tipos de Notificaciones
          </h3>
          {Object.entries(notificationLabels).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <span className="text-sm text-text-light dark:text-text-dark">{label}</span>
              <button
                type="button"
                onClick={() => handleToggle(key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localPreferences[key]
                    ? 'bg-claro-red'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localPreferences[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          ))}
        </div>

        {/* Sound setting */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
            <div>
              <span className="text-sm font-medium text-text-light dark:text-text-dark block">
                Sonido de notificaciones
              </span>
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Reproducir sonido al recibir nuevas notificaciones
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('sound_enabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localPreferences.sound_enabled
                  ? 'bg-claro-red'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localPreferences.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            hasChanges && !isUpdating
              ? 'bg-claro-red hover:bg-red-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}
