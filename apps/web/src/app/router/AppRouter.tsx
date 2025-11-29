import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '@/lib/constants/routes'

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const TeamsPage = lazy(() => import('@/pages/TeamsPage'))
const UsersPage = lazy(() => import('@/pages/UsersPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

/**
 * Loading Fallback Component
 *
 * Shown while lazy-loaded pages are being fetched.
 */
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="text-sm text-muted-foreground">Loading...</p>
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
export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Protected routes - TODO: Add ProtectedRoute wrapper */}
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.TEAMS} element={<TeamsPage />} />
          <Route path={ROUTES.USERS} element={<UsersPage />} />

          {/* 404 */}
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
