import { AppProviders } from './providers/AppProviders'
import { AppRouter } from './router/AppRouter'

/**
 * App Component
 *
 * Root component that composes:
 * - Global providers (React Query, Auth, Theme)
 * - Router with all application routes
 *
 * This is the entry point of the application.
 */
const App = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}

export default App
