import { AuthProvider, ErrorBoundary, ThemeProvider, ToastProvider } from '@web/shared/providers/index.js'
import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider.js'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * App Providers Component
 *
 * Composes all global providers in the correct order.
 * Order matters: outer providers wrap inner providers.
 *
 * Provider hierarchy (outermost to innermost):
 * 1. ErrorBoundary - Catches errors from all providers below
 * 2. ThemeProvider - Theme state (needed by all UI)
 * 3. ToastProvider - Toast notifications
 * 4. QueryProvider - React Query for data fetching
 * 5. AuthProvider - Authentication state (depends on QueryProvider)
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
