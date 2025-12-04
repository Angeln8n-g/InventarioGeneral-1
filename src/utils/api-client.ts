/**
 * API Client Utility
 * Provides fetch wrappers that automatically include authentication tokens
 */

import { store } from '@/app/store'

/**
 * Get the current auth token from Redux store
 */
function getAuthToken(): string | null {
  const state = store.getState()
  return state.auth.token
}

/**
 * Authenticated fetch wrapper
 * Automatically includes the Bearer token in the Authorization header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken()
  
  const headers = new Headers(options.headers)
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  
  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url: string, options: RequestInit = {}) =>
    authenticatedFetch(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: any, options: RequestInit = {}) =>
    authenticatedFetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  put: (url: string, data?: any, options: RequestInit = {}) =>
    authenticatedFetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (url: string, options: RequestInit = {}) =>
    authenticatedFetch(url, { ...options, method: 'DELETE' }),
  
  patch: (url: string, data?: any, options: RequestInit = {}) =>
    authenticatedFetch(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
}

/**
 * Helper to handle API responses with error handling
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: { message: `HTTP ${response.status}: ${response.statusText}` }
    }))
    throw new Error(error.error?.message || 'API request failed')
  }
  
  return response.json()
}

/**
 * Combined fetch and parse helper
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await authenticatedFetch(url, options)
  return handleApiResponse<T>(response)
}
