import { ROUTES } from '@web/shared/constants/routes.js'
import { useAuth } from '@web/shared/providers/index.js'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Protected Route Props
 */
type ProtectedRouteProps = {
  children: ReactNode
  redirectTo?: string
}

/**
 * Protected Route Component
 *
 * Wrapper component that protects routes requiring authentication.
 * Redirects to login page if user is not authenticated.
 *
 * @example
 * ```tsx
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <DashboardPage />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export function ProtectedRoute({ children, redirectTo = ROUTES.LOGIN }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate replace to={redirectTo} />
  }

  return <>{children}</>
}
