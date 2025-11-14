import React, { memo } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const InputComponent: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2 border rounded-lg bg-card-light dark:bg-card-dark text-text-light dark:text-text-dark placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
          error ? 'border-red-accent focus:ring-red-accent' : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-accent">{error}</p>
      )}
    </div>
  )
}

InputComponent.displayName = 'Input'

export const Input = memo(InputComponent)