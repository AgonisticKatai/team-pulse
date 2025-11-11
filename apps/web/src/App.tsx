import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './application/context/AuthContext'
import { createApiClient } from './infrastructure/api/apiClient'
import { createAuthApiClient } from './infrastructure/api/authApiClient'
import { createTeamApiClient } from './infrastructure/api/teamApiClient'
import { ProtectedRoute } from './presentation/components/auth/ProtectedRoute'
import { DashboardPage } from './presentation/pages/DashboardPage'
import { LoginPage } from './presentation/pages/LoginPage'
import { TeamsPage } from './presentation/pages/TeamsPage'
import './App.css'

/**
 * Create React Query client
 *
 * Configuration for React Query:
 * - Default stale time: 0 (refetch on every mount)
 * - Default cache time: 5 minutes
 * - Retry failed requests 3 times
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: true,
      retry: 3,
      staleTime: 0,
    },
  },
})

/**
 * Create API client instances
 *
 * These are created once at the module level and reused.
 */
const apiClient = createApiClient()
const authApiClient = createAuthApiClient(apiClient)
const teamApiClient = createTeamApiClient(apiClient)

/**
 * App Component
 *
 * Root component that:
 * - Provides React Query context
 * - Provides Authentication context
 * - Sets up React Router with protected routes
 * - Handles role-based access control
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authApiClient={authApiClient} apiClient={apiClient}>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <TeamsPage teamApiClient={teamApiClient} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
                  <div>
                    <h1>User Management</h1>
                    <p>Coming soon...</p>
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Catch-all: redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
