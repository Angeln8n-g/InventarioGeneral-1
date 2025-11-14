/**
 * LoadingSpinner Component
 * 
 * Componente reutilizable para mostrar estados de carga
 * Incluye variantes para diferentes contextos
 */

import React from 'react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'white' | 'gray'
  text?: string
  fullScreen?: boolean
  overlay?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
}

const variantClasses = {
  primary: 'border-primary-claro border-t-transparent',
  white: 'border-white border-t-transparent',
  gray: 'border-gray-300 border-t-transparent',
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  text,
  fullScreen = false,
  overlay = false,
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          animate-spin rounded-full
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
        role="status"
        aria-label="Cargando"
      />
      {text && (
        <p className={`text-sm font-medium ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
        {spinner}
      </div>
    )
  }

  if (overlay) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
        {spinner}
      </div>
    )
  }

  return spinner
}

/**
 * LoadingButton Component
 * Botón con estado de carga integrado
 */
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        relative inline-flex items-center justify-center gap-2
        ${isLoading ? 'cursor-not-allowed opacity-70' : ''}
        ${className}
      `}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" variant="white" />
        </div>
      )}
      <span className={isLoading ? 'invisible' : ''}>
        {isLoading && loadingText ? loadingText : children}
      </span>
    </button>
  )
}

/**
 * LoadingCard Component
 * Card con skeleton loading
 */
export const LoadingCard: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse"
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      ))}
    </>
  )
}

/**
 * LoadingTable Component
 * Skeleton para tablas
 */
export const LoadingTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-t-lg p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * LoadingDots Component
 * Animación de puntos para loading inline
 */
export const LoadingDots: React.FC = () => {
  return (
    <span className="inline-flex gap-1">
      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
    </span>
  )
}

export default LoadingSpinner
