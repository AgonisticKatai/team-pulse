import type { Decorator } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * RouterDecorator
 *
 * Provides React Router context for stories that use routing.
 * Uses MemoryRouter for isolation in Storybook.
 *
 * Usage in stories:
 * ```ts
 * import { RouterDecorator } from '@/.storybook/decorators/RouterDecorator'
 *
 * export default {
 *   decorators: [RouterDecorator],
 * }
 * ```
 */
export const RouterDecorator: Decorator = (Story) => {
  return (
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  )
}
