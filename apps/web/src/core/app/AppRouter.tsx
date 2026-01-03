import { ROUTES } from '@web/shared/constants/routes.js'
import { ProtectedRoute, PublicRoute } from '@web/shared/infrastructure/routing/index.js'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('../../pages/LoginPage'))
const DashboardPage = lazy(() => import('../../pages/DashboardPage'))
const TeamsPage = lazy(() => import('../../pages/TeamsPage'))
const UsersPage = lazy(() => import('../../pages/UsersPage'))
const NotFoundPage = lazy(() => import('../../pages/NotFoundPage'))

/**
 * Loading Fallback Component
 *
 * Shown while lazy-loaded pages are being fetched.
 */
const PageLoader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-r-transparent border-solid motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  )
}

/**
 * App Router Component
 *
 * Defines all application routes with lazy loading and code splitting.
 * Routes are protected by authentication where needed.
 */
export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
            path={ROUTES.LOGIN}
          />

          {/* Protected routes */}
          <Route element={<Navigate replace to={ROUTES.DASHBOARD} />} path={ROUTES.HOME} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
            path={ROUTES.DASHBOARD}
          />
          <Route
            element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            }
            path={ROUTES.TEAMS}
          />
          <Route
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
            path={ROUTES.USERS}
          />

          {/* 404 */}
          <Route element={<NotFoundPage />} path={ROUTES.NOT_FOUND} />
          <Route element={<Navigate replace to={ROUTES.NOT_FOUND} />} path="*" />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
