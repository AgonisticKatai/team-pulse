import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}

const config: StorybookConfig = {
  addons: [
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-themes'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
      },
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules')
        }
        return true
      },
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
    },
  },
}

export default config
