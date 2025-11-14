import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import { RootState } from '@/app/store'
import { loadFromStorage } from './authSlice'
import { usePermissions } from '@/hooks/usePermissions'
import type { Permission } from '@/lib/permissions'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requireAllPermissions?: boolean
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requiredPermission,
  requiredPermissions = [],
  requireAllPermissions = false,
  fallbackPath = '/dashboard',
}) => {
  const { user, token } = useSelector((state: RootState) => state.auth)
  const dispatch = useDispatch()
  const router = useRouter()
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
  } = usePermissions()

  useEffect(() => {
    // Load auth state from localStorage on mount
    if (!token) {
      dispatch(loadFromStorage())
    }
  }, [dispatch, token])

  useEffect(() => {
    if (!token || !user) {
      router.push('/login')
      return
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      router.push(fallbackPath)
      return
    }

    // Check single permission requirement
    if (requiredPermission && !hasPermission(requiredPermission)) {
      router.push(fallbackPath)
      return
    }

    // Check multiple permissions requirement
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requireAllPermissions
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions)
      
      if (!hasRequiredPermissions) {
        router.push(fallbackPath)
        return
      }
    }
  }, [
    token,
    user,
    requireAdmin,
    isAdmin,
    requiredPermission,
    requiredPermissions,
    requireAllPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    router,
    fallbackPath,
  ])

  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Check permissions after user is loaded
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have the required permissions to access this page.</p>
        </div>
      </div>
    )
  }

  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAllPermissions
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)
    
    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have the required permissions to access this page.</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}