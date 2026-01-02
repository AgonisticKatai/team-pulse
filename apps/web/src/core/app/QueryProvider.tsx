import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'

/**
 * React Query Client Configuration
 *
 * Optimized settings for data fetching and caching:
 * - 5 minute garbage collection time
 * - Refetch on window focus for fresh data
 * - 3 retry attempts for failed requests
 * - No stale time (always refetch on mount)
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

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Query Provider Component
 *
 * Wraps the application with React Query context and devtools.
 * Devtools are only enabled in development mode.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
