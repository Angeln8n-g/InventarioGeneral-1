import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RootState } from '@/app/store'
import { loadFromStorage, logout } from '@/features/auth/authSlice'
import { useLoginMutation, useLogoutMutation } from '@/services/api'

export const useAuth = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const { user, token, isLoading, error } = useSelector((state: RootState) => state.auth)
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation()
  const [logoutMutation] = useLogoutMutation()

  // Load auth state from localStorage on mount
  useEffect(() => {
    if (!token) {
      dispatch(loadFromStorage())
    }
  }, [dispatch, token])

  const login = async (credentials: { username: string; password: string }) => {
    try {
      await loginMutation(credentials).unwrap()
      return { success: true }
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error &&
          error.data && typeof error.data === 'object' && 'error' in error.data &&
          error.data.error && typeof error.data.error === 'object' && 'message' in error.data.error
          ? String(error.data.error.message)
          : 'Login failed'

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  const handleLogout = async () => {
    try {
      if (token) {
        await logoutMutation().unwrap()
      }
    } catch (error) {
      console.error('Logout API call failed:', error)
    } finally {
      dispatch(logout())
      router.push('/')
    }
  }

  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'admin'

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLoading: isLoading || isLoggingIn,
    error,
    login,
    logout: handleLogout,
  }
}

export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  return { isAuthenticated, isLoading }
}

export const useRequireAdmin = (redirectTo: string = '/dashboard') => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push(redirectTo)
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router, redirectTo])

  return { isAuthenticated, isAdmin, isLoading }
}