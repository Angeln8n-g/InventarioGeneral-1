import React from 'react'
import { useAuth } from '@/hooks/useAuth'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ('user' | 'admin')[]
  fallback?: React.ReactNode
  requireAll?: boolean
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback = null,
  requireAll = false,
}) => {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <>{fallback}</>
  }

  const hasRequiredRole = allowedRoles.includes(user.role)

  if (!hasRequiredRole) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

interface UserOrAdminProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const UserOrAdmin: React.FC<UserOrAdminProps> = ({ children, fallback = null }) => {
  return (
    <RoleGuard allowedRoles={['user', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}