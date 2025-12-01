import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      defaultTheme: 'light',
      themes: {
        dark: 'dark',
        light: '',
      },
    }),
  ],
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'oklch(0.98 0 0)',
        },
        {
          name: 'dark',
          value: 'oklch(0.15 0 0)',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
}

export default preview
