/**
 * Toast System - Sonner
 * 
 * Sistema de notificaciones moderno usando Sonner
 * Wrapper para mantener API consistente y agregar funcionalidades personalizadas
 */

import { toast as sonnerToast, ExternalToast } from 'sonner'

// Configuración por defecto para toasts
const defaultOptions: ExternalToast = {
  duration: 4000,
}

/**
 * Toast de éxito
 */
export const toastSuccess = (message: string, description?: string, options?: ExternalToast) => {
  return sonnerToast.success(message, {
    description,
    ...defaultOptions,
    ...options,
  })
}

/**
 * Toast de error
 */
export const toastError = (message: string, description?: string, options?: ExternalToast) => {
  return sonnerToast.error(message, {
    description,
    duration: 5000, // Más tiempo para errores
    ...options,
  })
}

/**
 * Toast de advertencia
 */
export const toastWarning = (message: string, description?: string, options?: ExternalToast) => {
  return sonnerToast.warning(message, {
    description,
    ...defaultOptions,
    ...options,
  })
}

/**
 * Toast de información
 */
export const toastInfo = (message: string, description?: string, options?: ExternalToast) => {
  return sonnerToast.info(message, {
    description,
    ...defaultOptions,
    ...options,
  })
}

/**
 * Toast de carga
 */
export const toastLoading = (message: string, description?: string, options?: ExternalToast) => {
  return sonnerToast.loading(message, {
    description,
    duration: Infinity, // No se cierra automáticamente
    ...options,
  })
}

/**
 * Toast con promesa (útil para operaciones async)
 */
export const toastPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  },
  options?: ExternalToast
) => {
  return sonnerToast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
    ...options,
  })
}

/**
 * Toast con acción
 */
export const toastAction = (
  message: string,
  actionLabel: string,
  actionFn: () => void,
  options?: ExternalToast
) => {
  return sonnerToast(message, {
    action: {
      label: actionLabel,
      onClick: actionFn,
    },
    ...defaultOptions,
    ...options,
  })
}

/**
 * Cerrar un toast específico
 */
export const toastDismiss = (toastId: string | number) => {
  sonnerToast.dismiss(toastId)
}

/**
 * Cerrar todos los toasts
 */
export const toastDismissAll = () => {
  sonnerToast.dismiss()
}

// Exportar el toast original de Sonner por si se necesita
export { sonnerToast as toast }

// Exportar tipos
export type { ExternalToast as ToastOptions }
