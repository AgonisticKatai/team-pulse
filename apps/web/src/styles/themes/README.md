# Theme System

This directory contains the design token system for TeamPulse.

## File Structure

```
themes/
├── tokens.css       # Primitive tokens + Tailwind mappings
├── light.css        # Light theme semantic tokens
├── dark.css         # Dark theme semantic tokens
└── typography.css   # Typography system utilities
```

## Token Layers

### 1. Primitive Tokens (`tokens.css`)

Raw values that form the foundation of the design system:

```css
@theme {
  /* Spacing */
  --space-10: 2.5rem; /* 40px */
  --space-6: 1.5rem;  /* 24px */
  
  /* Typography */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-xl: 1.25rem;  /* 20px */
  
  /* Colors (OKLCH) */
  --color-primary-500: oklch(0.55 0.22 250);
}
```

### 2. Tailwind Mappings (`tokens.css`)

Maps Tailwind's internal variables to our tokens:

```css
@theme {
  /* Allows h-10 to use --space-10 */
  --spacing-10: var(--space-10);
  
  /* Allows px-6 to use --space-6 */
  --spacing-6: var(--space-6);
  
  /* Allows text-xl to use --font-size-xl */
  --text-xl: var(--font-size-xl);
}
```

### 3. Semantic Tokens (`light.css`, `dark.css`)

Purpose-based tokens that adapt to theme:

```css
/* light.css */
:root {
  --primary: var(--color-primary-500);
  --background: var(--color-white);
  --foreground: var(--color-gray-900);
}

/* dark.css */
.dark {
  --primary: var(--color-primary-400);
  --background: var(--color-gray-950);
  --foreground: var(--color-gray-50);
}
```

## How It Works

When you use a Tailwind utility like `h-10`, here's the resolution chain:

```
1. HTML Class
   <button className="h-10 px-6 text-sm" />

2. Tailwind Generates CSS
   .h-10 { height: var(--spacing-10); }
   .px-6 { padding-inline: var(--spacing-6); }
   .text-sm { font-size: var(--text-sm); }

3. Variables Resolve to Tokens
   --spacing-10 → var(--space-10) → 2.5rem
   --spacing-6 → var(--space-6) → 1.5rem
   --text-sm → var(--font-size-sm) → 0.875rem

4. Final Computed Values (in browser)
   height: 2.5rem;           /* 40px */
   padding-inline: 1.5rem;   /* 24px */
   font-size: 0.875rem;      /* 14px */
```

## Benefits

### 1. Single Source of Truth

Change one token, update everywhere:

```css
/* Update button heights across entire app */
--space-10: 2.75rem; /* was 2.5rem */
```

All components using `h-10` automatically update.

### 2. Consistency Enforcement

Developers can't use arbitrary values:

```tsx
✅ <Button className="h-10 px-6" />
❌ <Button className="h-[42px] px-[23px]" />
```

### 3. Theme-Aware

Semantic tokens adapt to light/dark mode automatically:

```tsx
<Card className="bg-background text-foreground">
  {/* Automatically adapts to theme */}
</Card>
```

### 4. Design System Alignment

All values follow modular scales:

- **Spacing**: 4px base grid
- **Typography**: 1.25 modular scale
- **Colors**: OKLCH for perceptual uniformity

## Usage Examples

### Component Development

```tsx
import { cva } from 'class-variance-authority'

const cardVariants = cva(
  // All utilities use design tokens
  'p-6 rounded-lg shadow-md',
  {
    variants: {
      spacing: {
        sm: 'p-4 gap-3',
        md: 'p-6 gap-4',
        lg: 'p-8 gap-6',
      }
    }
  }
)
```

### Layout Utilities

```tsx
<div className="space-y-6 p-8">
  <h1 className="text-4xl font-bold">
    Heading
  </h1>
  <p className="text-base leading-relaxed">
    Content
  </p>
</div>
```

### Custom CSS

```css
.custom-component {
  /* Use Tailwind utilities when possible */
  @apply h-10 px-6 text-sm;
  
  /* Or reference tokens directly */
  padding-block: var(--space-4);
  font-size: var(--font-size-lg);
  color: var(--primary);
}
```

## Debugging

### Inspect in DevTools

Check computed values:

```css
/* Inspect .h-10 in DevTools */
.h-10 {
  height: var(--spacing-10); /* → var(--space-10) → 2.5rem */
}
```

### Token Resolution

Use browser console:

```javascript
// Get computed token value
const styles = getComputedStyle(document.documentElement)
console.log(styles.getPropertyValue('--space-10')) // "2.5rem"
console.log(styles.getPropertyValue('--spacing-10')) // "var(--space-10)"
```

### Clear Cache

If changes don't appear:

```bash
rm -rf node_modules/.vite
pnpm dev
```

## Available Tokens

### Spacing

```
0, px, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32
```

### Typography

```
xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl
```

### Colors

```
Primitives: gray, primary, success, warning, error, info (50-950 scale)
Semantic: primary, secondary, destructive, accent, background, foreground, etc.
```

### Shadows

```
xs, sm, base, md, lg, xl, 2xl, inner
```

### Radius

```
none, sm, base, md, lg, xl, 2xl, 3xl, full
```

## Related Documentation

- [Design System](../../../../docs/design-system/README.md) - Complete design system overview
- [Design Tokens Integration](../../../../docs/design-system/tokens.md) - Complete integration guide
- [Storybook & Testing](../../../../docs/design-system/storybook.md) - Component development workflow
- [Tailwind CSS v4 Theme](https://tailwindcss.com/docs/theme) - Official documentation

---

**Maintained by:** TeamPulse Design Team  
**Last Updated:** December 2025
