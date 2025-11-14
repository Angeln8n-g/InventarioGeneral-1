/**
 * useLoadingState Hook
 * 
 * Hook personalizado para manejar estados de carga de manera consistente
 */

import { useState, useCallback } from 'react'

export interface LoadingState {
  isLoading: boolean
  error: string | null
  success: boolean
}

export interface UseLoadingStateReturn extends LoadingState {
  startLoading: () => void
  stopLoading: () => void
  setError: (error: string) => void
  setSuccess: () => void
  reset: () => void
  withLoading: <T>(fn: () => Promise<T>) => Promise<T>
}

/**
 * Hook para manejar estados de carga
 */
export const useLoadingState = (initialState?: Partial<LoadingState>): UseLoadingStateReturn => {
  const [state, setState] = useState<LoadingState>({
    isLoading: initialState?.isLoading ?? false,
    error: initialState?.error ?? null,
    success: initialState?.success ?? false,
  })

  const startLoading = useCallback(() => {
    setState({
      isLoading: true,
      error: null,
      success: false,
    })
  }, [])

  const stopLoading = useCallback(() => {
    setState(prev => ({
      ...prev,
      isLoading: false,
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setState({
      isLoading: false,
      error,
      success: false,
    })
  }, [])

  const setSuccess = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: true,
    })
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: false,
    })
  }, [])

  /**
   * Wrapper para ejecutar funciones async con loading state automático
   */
  const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    startLoading()
    try {
      const result = await fn()
      setSuccess()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setError(errorMessage)
      throw error
    }
  }, [startLoading, setSuccess, setError])

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    setSuccess,
    reset,
    withLoading,
  }
}

/**
 * Hook simplificado para operaciones async
 */
export const useAsyncOperation = <T = any,>() => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (fn: () => Promise<T>) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await fn()
      setData(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
  }
}

export default useLoadingState
