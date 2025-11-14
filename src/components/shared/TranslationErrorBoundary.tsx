'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary specifically for catching translation-related errors
 * Prevents the entire app from crashing if there's an issue with translations
 */
export class TranslationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Translation Error Boundary caught an error:', error, errorInfo)
    }
    
    // In production, you might want to log this to an error tracking service
    // Example: logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            Translation Error
          </h2>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            There was an issue loading translations. Please refresh the page.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-2">
              <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer">
                Error Details (Development Only)
              </summary>
              <pre className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
          >
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
