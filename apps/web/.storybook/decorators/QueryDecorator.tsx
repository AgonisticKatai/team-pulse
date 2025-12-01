import type { Decorator } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * QueryDecorator
 *
 * Provides React Query context for stories that need data fetching.
 * Creates a fresh QueryClient for each story to ensure isolation.
 *
 * Usage in stories:
 * ```ts
 * import { QueryDecorator } from '@/.storybook/decorators/QueryDecorator'
 *
 * export default {
 *   decorators: [QueryDecorator],
 * }
 * ```
 */
export const QueryDecorator: Decorator = (Story) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Number.POSITIVE_INFINITY,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}
