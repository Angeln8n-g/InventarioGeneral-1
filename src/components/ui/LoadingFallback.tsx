import React from 'react'

interface LoadingFallbackProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  message = 'Cargando...',
  size = 'md',
  fullScreen = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-3">
        <div className={`animate-spin rounded-full border-b-2 border-claro-red ${sizeClasses[size]}`}></div>
        {message && (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export const ModalLoadingFallback = () => (
  <LoadingFallback message="Cargando modal..." size="md" />
)

export const PageLoadingFallback = () => (
  <LoadingFallback message="Cargando página..." size="lg" fullScreen />
)

export const ComponentLoadingFallback = () => (
  <LoadingFallback message="" size="sm" />
)
