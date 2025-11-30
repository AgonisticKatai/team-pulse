import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * App Providers Component
 *
 * Composes all global providers in the correct order.
 * Order matters: outer providers wrap inner providers.
 *
 * Current providers:
 * - QueryProvider: React Query for data fetching
 *
 * Future providers to add:
 * - AuthProvider: Authentication context
 * - ThemeProvider: Dark/light mode
 * - ToastProvider: Global notifications
 */
export const AppProviders = ({ children }: AppProvidersProps) => {
  return <QueryProvider>{children}</QueryProvider>
}
