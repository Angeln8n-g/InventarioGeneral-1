// Auth-specific types that don't include sensitive information
export interface AuthUser {
  id: number
  username: string
  email: string
  full_name?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
  version: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: string
  message?: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  error: string | null
}