/**
 * Protected Route Component
 *
 * Wrapper for routes that require authentication and/or specific roles.
 *
 * Features:
 * - Redirects unauthenticated users to login
 * - Supports role-based access control (RBAC)
 * - Shows loading state during auth initialization
 * - Shows forbidden page for insufficient permissions
 *
 * Usage:
 * ```tsx
 * <ProtectedRoute>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
 *   <UserManagement />
 * </ProtectedRoute>
 * ```
 */

import type { UserRole } from '@team-pulse/shared'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../application/hooks/useAuth'

export interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: UserRole[]
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="protected-route-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if required
  if (requiredRoles && requiredRoles.length > 0 && user) {
    const hasRequiredRole = requiredRoles.includes(user.role)

    if (!hasRequiredRole) {
      return <ForbiddenPage userRole={user.role} requiredRoles={requiredRoles} />
    }
  }

  // User is authenticated and has required role (if any)
  return <>{children}</>
}

/**
 * Forbidden Page
 *
 * Shown when user doesn't have required role
 */
function ForbiddenPage({
  userRole,
  requiredRoles,
}: {
  userRole: UserRole
  requiredRoles: UserRole[]
}) {
  return (
    <div className="forbidden-page">
      <div className="forbidden-container">
        <h1>🚫 Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <div className="forbidden-details">
          <p>
            <strong>Your role:</strong> {userRole}
          </p>
          <p>
            <strong>Required roles:</strong> {requiredRoles.join(', ')}
          </p>
        </div>
        <a href="/" className="btn btn-primary">
          Go to Home
        </a>
      </div>
    </div>
  )
}
