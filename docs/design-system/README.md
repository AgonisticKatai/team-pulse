# Design System

Modern design system for TeamPulse built with Tailwind CSS v4, OKLCH color space, and comprehensive design tokens.

## Overview

Our design system provides a complete foundation for building consistent, accessible, and maintainable user interfaces. It combines modern web standards with battle-tested patterns.

### Key Features

- 🎨 **OKLCH Color Space** - Better accessibility and perceptual uniformity
- 📐 **Design Tokens** - Single source of truth for all design values
- ⚡ **Tailwind CSS v4 Integration** - Utilities automatically use design tokens
- 🧪 **Storybook 10** - Isolated component development and testing
- ♿ **Accessibility First** - Built-in a11y testing and best practices
- 🌓 **Dark Mode** - Semantic tokens that adapt to themes
- 📱 **Responsive** - Mobile-first approach with consistent breakpoints

## Architecture

```
Design System
├── Primitive Tokens    (tokens.css)     - Raw values (colors, spacing, typography)
├── Semantic Tokens     (light/dark.css) - Purpose-based tokens (--primary, --background)
├── Tailwind Mappings   (tokens.css)     - Utility class integration
├── Components          (components/ui/) - Reusable UI components
└── Stories             (*.stories.tsx)  - Component documentation
```

### Token Flow

```
Tailwind Utility → Tailwind Variable → Design Token → Final Value
h-10            → --spacing-10      → --space-10   → 2.5rem (40px)
px-6            → --spacing-6       → --space-6    → 1.5rem (24px)
text-xl         → --text-xl         → --font-size-xl → 1.25rem (20px)
bg-primary      → --primary         → --color-primary-500 → oklch(...)
```

## Documentation

### Core Concepts

- **[Design Tokens](./tokens.md)** - Complete guide to the token system, mappings, and usage
- **[Storybook & Testing](./storybook.md)** - Component development workflow and testing

### Token Categories

| Category | Tokens | Usage |
|----------|--------|-------|
| **Colors** | `--color-*` | Brand colors, semantic colors (OKLCH) |
| **Spacing** | `--space-*` → `--spacing-*` | Layout, padding, margins (4px grid) |
| **Typography** | `--font-size-*` → `--text-*` | Text sizes (1.25 modular scale) |
| **Radius** | `--radius-*` | Border radius values |
| **Shadows** | `--shadow-*` | Box shadows and elevation |
| **Animation** | `--duration-*`, `--ease-*` | Timing and easing functions |

## Quick Start

### Using Design Tokens

```tsx
// ✅ Tailwind utilities (automatically use tokens)
<Button className="h-10 px-6 text-sm rounded-lg shadow-md">
  Click me
</Button>

// ✅ Semantic tokens in CSS
.custom-card {
  background: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}

// ✅ Type-safe variants with CVA
import { cva } from 'class-variance-authority'

const buttonVariants = cva('h-10 px-6 rounded-lg', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground',
      destructive: 'bg-destructive text-destructive-foreground',
    },
    size: {
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-8 text-base',
    }
  }
})
```

### Storybook Development

```bash
pnpm storybook        # Start Storybook dev server
pnpm build-storybook  # Build static Storybook
```

Access at: `http://localhost:6006`

## Design Scales

### Spacing (4px base grid)

```
Token    Value   Pixels
--space-0    0       0
--space-px   1px     1
--space-1    0.25rem 4
--space-2    0.5rem  8
--space-4    1rem    16
--space-6    1.5rem  24
--space-8    2rem    32
--space-10   2.5rem  40
--space-12   3rem    48
--space-16   4rem    64
```

### Typography (1.25 modular scale)

```
Token          Value      Pixels  Line Height
--font-size-xs   0.75rem   12px   normal (1.5)
--font-size-sm   0.875rem  14px   normal (1.5)
--font-size-base 1rem      16px   normal (1.5)
--font-size-lg   1.125rem  18px   normal (1.5)
--font-size-xl   1.25rem   20px   tight (1.25)
--font-size-2xl  1.5rem    24px   tight (1.25)
--font-size-4xl  2.25rem   36px   none (1)
```

### Colors (OKLCH)

All colors use OKLCH color space for:
- Better perceptual uniformity
- Improved accessibility
- Consistent lightness across hues
- Future-proof (P3 color gamut ready)

```css
/* Primitive colors */
--color-primary-500: oklch(0.55 0.22 250);  /* Blue */
--color-success-500: oklch(0.65 0.2 145);   /* Green */
--color-error-500: oklch(0.6 0.25 25);      /* Red */

/* Semantic tokens (adapt to theme) */
--primary: var(--color-primary-500);
--background: var(--color-white);           /* Light mode */
.dark --background: var(--color-gray-950);  /* Dark mode */
```

## Component Development

### 1. Create Component

```tsx
// components/ui/card.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva(
  'p-6 rounded-lg shadow-md bg-card text-card-foreground',
  {
    variants: {
      variant: {
        default: 'border border-border',
        elevated: 'shadow-lg',
      }
    }
  }
)

export function Card({ className, variant, ...props }: Props) {
  return (
    <div className={cn(cardVariants({ variant }), className)} {...props} />
  )
}
```

### 2. Create Stories

```tsx
// components/ui/card.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './card'

const meta: Meta<typeof Card> = {
  component: Card,
  tags: ['autodocs'],
}

export default meta

export const Default: StoryObj<typeof Card> = {
  args: {
    children: 'Card content',
  }
}
```

### 3. Write Tests

```tsx
// components/ui/card.test.tsx
import { render, screen } from '@testing-library/react'
import { Card } from './card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test content</Card>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
})
```

## Best Practices

### 1. Prefer Standard Utilities

```tsx
✅ <Button className="h-10 px-6 text-sm" />
❌ <Button className="h-[40px] px-[24px] text-[14px]" />
```

### 2. Use Semantic Tokens

```tsx
✅ className="bg-primary text-primary-foreground"
❌ className="bg-primary-500 text-white"
```

### 3. Combine Tokens for Complex Layouts

```tsx
✅ className="p-6 space-y-4 rounded-lg"
❌ className="p-[24px] [&>*+*]:mt-[16px] rounded-[12px]"
```

### 4. Reference Tokens in Custom CSS

```css
✅ padding: var(--space-6);
❌ padding: 24px;
```

### 5. Document Deviations

```tsx
// Need custom spacing for optical alignment
<Icon className="ml-[3px]" /> {/* Optical centering */}
```

## Accessibility

### Built-in Features

- ✅ Color contrast testing in Storybook (a11y addon)
- ✅ Keyboard navigation support
- ✅ ARIA attributes in components
- ✅ Focus-visible styles
- ✅ Screen reader friendly

### Testing

```tsx
// Component includes accessibility props
<Button aria-label="Close dialog" />

// Storybook shows a11y violations
// Tests verify ARIA attributes
expect(button).toHaveAttribute('aria-label', 'Close dialog')
```

## Theme Support

### Light & Dark Modes

Semantic tokens automatically adapt:

```css
/* light.css */
:root {
  --background: var(--color-white);
  --foreground: var(--color-gray-900);
  --primary: var(--color-primary-500);
}

/* dark.css */
.dark {
  --background: var(--color-gray-950);
  --foreground: var(--color-gray-50);
  --primary: var(--color-primary-400);
}
```

### Theme Switching

```tsx
// Storybook includes theme toggle
// Components automatically adapt
<Card className="bg-background text-foreground">
  {/* Adapts to light/dark mode */}
</Card>
```

## Maintenance

### Adding New Tokens

1. Add to `tokens.css` in CUSTOM DESIGN TOKENS section:
   ```css
   --space-36: 9rem; /* 144px */
   ```

2. Add Tailwind mapping in TAILWIND CSS UTILITY MAPPINGS section:
   ```css
   --spacing-36: var(--space-36);
   ```

3. Use in components:
   ```tsx
   <div className="h-36 w-36" />
   ```

### Updating Token Values

Simply update the primitive token - all utilities update automatically:

```css
/* Changes button heights across entire app */
--space-10: 2.75rem; /* was 2.5rem */
```

## Resources

### Internal Documentation

- [Design Tokens](./tokens.md) - Token system architecture and usage
- [Storybook](./storybook.md) - Component development workflow
- [Theme System](../../apps/web/src/styles/themes/README.md) - Theme structure

### External Links

- [Tailwind CSS v4 Theme](https://tailwindcss.com/docs/theme)
- [OKLCH Color Picker](https://oklch.com/)
- [Storybook Documentation](https://storybook.js.org/docs)
- [CVA Documentation](https://cva.style/docs)

## Support

For questions or issues:

1. Check the documentation in this directory
2. Review component examples in Storybook
3. Inspect token values in browser DevTools
4. Open an issue on GitHub

---

**Maintained by:** TeamPulse Design Team  
**Last Updated:** December 2025  
**Version:** 1.0.0
