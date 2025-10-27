import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createApiClient } from './infrastructure/api/apiClient'
import { createTeamApiClient } from './infrastructure/api/teamApiClient'
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
      staleTime: 0,
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
})

/**
 * Create API client instances
 *
 * These are created once at the module level and reused.
 * In a larger app, you might use dependency injection or React Context.
 */
const apiClient = createApiClient()
const teamApiClient = createTeamApiClient(apiClient)

/**
 * App Component
 *
 * Root component that:
 * - Provides React Query context
 * - Initializes API clients
 * - Sets up routing (future: React Router)
 * - Wraps the application
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <header className="app-header">
          <h1>⚽ TeamPulse</h1>
          <p>Football Team Statistics Platform</p>
        </header>

        <main className="app-main">
          <TeamsPage teamApiClient={teamApiClient} />
        </main>

        <footer className="app-footer">
          <p>Built with React + TypeScript + Vite + Hexagonal Architecture</p>
        </footer>
      </div>
    </QueryClientProvider>
  )
}

export default App
