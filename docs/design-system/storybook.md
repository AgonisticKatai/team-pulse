# Storybook + Testing - TeamPulse Web

## 📚 Architecture Overview

This document describes the implementation of Storybook 10 and component testing following TeamPulse's clean architecture principles.

## 🎯 Tech Stack

- **Storybook 10.1.2** - Latest version with Vite builder
- **React 19** - UI framework
- **Vite 7** - Ultra-fast build tool
- **Vitest 4** - Vite-compatible test runner
- **Testing Library 16** - Component testing utilities
- **Tailwind CSS v4** - Design system with OKLCH color space
- **TypeScript 5.9** - Type safety

## 📁 File Structure

```
apps/web/
├── .storybook/
│   ├── main.ts                    # Configuración principal
│   ├── preview.ts                 # Preview global + decorators
│   └── decorators/
│       ├── QueryDecorator.tsx     # React Query wrapper
│       └── RouterDecorator.tsx    # React Router wrapper
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── button.stories.tsx # Stories CSF3
│   │       └── button.test.tsx    # Vitest tests
│   └── test/
│       ├── setup.ts               # Vitest setup global
│       └── mocks/
```

## 🚀 Available Scripts

```bash
# Development
pnpm storybook              # Start Storybook at localhost:6006

# Build
pnpm build-storybook        # Generate static build

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Tests in watch mode
pnpm test:coverage          # Tests with coverage report

# Monorepo (from root)
pnpm turbo storybook        # Storybook with turbo
pnpm turbo build-storybook  # Build with turbo
```

## 🎨 Configured Addons

### Core Addons (v10)
- `@storybook/addon-links` - Navigation between stories
- `@storybook/addon-a11y` - Accessibility auditing
- `@storybook/addon-themes` - Dark/light mode switcher
- `@storybook/addon-docs` - Automatic documentation
- `@chromatic-com/storybook` - Visual regression testing

## 🎭 Available Decorators

### QueryDecorator
React Query wrapper for stories that need data fetching.

```tsx
import { QueryDecorator } from '@/.storybook/decorators/QueryDecorator'

export default {
  decorators: [QueryDecorator],
}
```

### RouterDecorator
React Router wrapper for stories that use navigation.

```tsx
import { RouterDecorator } from '@/.storybook/decorators/RouterDecorator'

export default {
  decorators: [RouterDecorator],
}
```

### ThemeDecorator (Built-in)
Light/dark mode toggle integrated in preview.ts

## 📝 Story Example (CSF3)

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Button',
  },
}
```

## 🧪 Test Example (Vitest)

```tsx
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

## 🎨 Design Tokens Integration

Storybook automatically imports `src/index.css` which includes:
- OKLCH primitive tokens
- Light/dark themes
- CSS reset
- Typography
- Animations

## 🔧 Vite Configuration

The Vite configuration in `.storybook/main.ts` includes:
- Alias paths (@ for src/)
- Tailwind CSS v4 plugin
- React plugin with React 19

## 📊 Visual Regression Testing con Chromatic

### Chromatic Setup

1. **Create Chromatic Account**
   ```bash
   npx chromatic --project-token=<your-token>
   ```

2. **Configure CI/CD**
   
   **GitHub Actions** (`.github/workflows/chromatic.yml`):
   ```yaml
   name: Chromatic
   on: push
   jobs:
     visual-regression:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - name: Install dependencies
           run: pnpm install
         - name: Run Chromatic
           uses: chromaui/action@latest
           with:
             projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
             workingDir: apps/web
             buildScriptName: build-storybook
   ```

3. **Configure turbo.json** (already configured):
   ```json
   {
     "build-storybook": {
       "dependsOn": ["^build"],
       "outputs": ["storybook-static/**"]
     }
   }
   ```

### Using Chromatic

```bash
# Local build
pnpm build-storybook

# Publish to Chromatic
npx chromatic --project-token=<token>

# With turbo
pnpm turbo build-storybook
```

## 🔍 Testing Strategy

### 1. Unit Tests (Vitest + Testing Library)
- Logic and behavior testing
- User interactions
- States and props
- Accessibility

### 2. Visual Tests (Chromatic)
- Automatic screenshots
- Pixel-perfect comparison
- Visual regression detection
- UI change reviews

### 3. Accessibility Tests (addon-a11y)
- Automatic WCAG audit
- Color contrast
- ARIA labels
- Keyboard navigation

## 📏 Code Conventions

### Naming
- Stories: `ComponentName.stories.tsx`
- Tests: `ComponentName.test.tsx`
- Decorators: `NameDecorator.tsx`

### Structure
```tsx
// 1. Imports
import type { Meta, StoryObj } from '@storybook/react'

// 2. Meta configuration
const meta = { ... } satisfies Meta<typeof Component>

// 3. Type definition
type Story = StoryObj<typeof meta>

// 4. Stories
export const Default: Story = { ... }
```

## 🚨 Troubleshooting

### Storybook won't start
```bash
# Clear cache
rm -rf node_modules/.cache

# Reinstall
pnpm install
```

### TypeScript type errors
```bash
# Regenerate types
pnpm type-check
```

### Tests failing
```bash
# Run specific test
pnpm test src/components/ui/button.test.tsx

# Verbose output
pnpm test -- --reporter=verbose
```

## 📚 Resources

- [Storybook Docs](https://storybook.js.org/docs/react)
- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Chromatic Docs](https://www.chromatic.com/docs/)

## 🎯 Next Steps

1. ✅ Storybook 10 configured
2. ✅ Decorators (Query, Router, Theme)
3. ✅ Button component with stories and tests
4. ⏳ Configure Chromatic in CI/CD
5. ⏳ Create stories for more UI components
6. ⏳ Add interaction tests with play functions
7. ⏳ Document design tokens in Storybook

## 💡 Best Practices

1. **One story per component state**
2. **Document props with argTypes**
3. **Use tags: ['autodocs'] to generate docs**
4. **Create realistic example stories**
5. **Test accessibility in every story**
6. **Maintain complementary unit tests**
7. **Use decorators for shared context**

---

**Architecture maintained by**: TeamPulse Engineering Team  
**Last updated**: December 2024
