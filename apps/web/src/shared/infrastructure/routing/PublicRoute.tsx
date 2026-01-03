import { ROUTES } from '@web/shared/constants/routes.js'
import { useAuth } from '@web/shared/providers/index.js'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

/**
 * Public Route Props
 */
type PublicRouteProps = {
  children: ReactNode
  redirectTo?: string
}

/**
 * Public Route Component
 *
 * Wrapper component for public routes (like login, register).
 * Redirects to dashboard if user is already authenticated.
 *
 * @example
 * ```tsx
 * <Route
 *   path="/login"
 *   element={
 *     <PublicRoute>
 *       <LoginPage />
 *     </PublicRoute>
 *   }
 * />
 * ```
 */
export function PublicRoute({ children, redirectTo = ROUTES.DASHBOARD }: PublicRouteProps) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate replace to={redirectTo} />
  }

  return <>{children}</>
}
