'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import { Dialog } from './Dialog'

/**
 * Lazy Modal Loader
 * 
 * Componente que carga modales de forma lazy (solo cuando se necesitan)
 * Mejora el rendimiento inicial de la aplicación
 */

interface LazyModalProps {
  isOpen: boolean
  onClose: () => void
  loader: () => Promise<{ default: ComponentType<any> }>
  modalProps?: Record<string, any>
}

// Loading fallback para modales
function ModalLoadingFallback() {
  return (
    <Dialog isOpen={true} onClose={() => {}} size="lg">
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-claro-red mx-auto mb-4"></div>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Cargando...
          </p>
        </div>
      </div>
    </Dialog>
  )
}

/**
 * LazyModal Component
 * 
 * Uso:
 * ```tsx
 * const LazyRequestMaterialsModal = lazy(() => import('@/components/dashboard/RequestMaterialsModal'))
 * 
 * <LazyModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   loader={() => import('@/components/dashboard/RequestMaterialsModal')}
 *   modalProps={{ onSuccess: handleSuccess }}
 * />
 * ```
 */
export function LazyModal({ isOpen, onClose, loader, modalProps = {} }: LazyModalProps) {
  // Solo cargar el modal cuando se abre por primera vez
  const [shouldLoad, setShouldLoad] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && !shouldLoad) {
      setShouldLoad(true)
    }
  }, [isOpen, shouldLoad])

  // No renderizar nada si nunca se ha abierto
  if (!shouldLoad) {
    return null
  }

  // Cargar el modal de forma lazy
  const LazyComponent = lazy(loader)

  return (
    <Suspense fallback={<ModalLoadingFallback />}>
      <LazyComponent isOpen={isOpen} onClose={onClose} {...modalProps} />
    </Suspense>
  )
}

/**
 * Hook para manejar modales lazy
 * 
 * Uso:
 * ```tsx
 * const { isOpen, open, close } = useLazyModal()
 * 
 * <button onClick={open}>Abrir Modal</button>
 * 
 * <LazyModal
 *   isOpen={isOpen}
 *   onClose={close}
 *   loader={() => import('@/components/dashboard/RequestMaterialsModal')}
 * />
 * ```
 */
export function useLazyModal() {
  const [isOpen, setIsOpen] = React.useState(false)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), [])

  return { isOpen, open, close, toggle }
}
