import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '../../lib/constants/routes'

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
          <Route element={<LoginPage />} path={ROUTES.LOGIN} />

          {/* Protected routes - TODO: Add ProtectedRoute wrapper */}
          <Route element={<Navigate replace to={ROUTES.DASHBOARD} />} path={ROUTES.HOME} />
          <Route element={<DashboardPage />} path={ROUTES.DASHBOARD} />
          <Route element={<TeamsPage />} path={ROUTES.TEAMS} />
          <Route element={<UsersPage />} path={ROUTES.USERS} />

          {/* 404 */}
          <Route element={<NotFoundPage />} path={ROUTES.NOT_FOUND} />
          <Route element={<Navigate replace to={ROUTES.NOT_FOUND} />} path="*" />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
