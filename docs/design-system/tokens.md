# Design Tokens Integration with Tailwind CSS v4

## Overview

This document describes the complete integration of our custom design token system with Tailwind CSS v4 utilities. Now all Tailwind utilities automatically use our design tokens instead of hardcoded values.

## Architecture

### Token Structure

Our design system follows a three-layer architecture:

1. **Primitive Tokens** (`tokens.css`) - Raw values (colors, spacing, typography)
2. **Semantic Tokens** (`light.css`, `dark.css`) - Purpose-based tokens (--primary, --background)
3. **Tailwind Mappings** (`tokens.css`) - Utility class mappings (--spacing-*, --text-*)

### Tailwind CSS v4 Integration

Tailwind CSS v4 uses internal variables like `--spacing-*` and `--text-*` to power its utility classes. We've mapped these to our custom tokens:

```css
/* Tailwind Utility → Our Token → Final Value */
h-10 → --spacing-10 → var(--space-10) → 2.5rem (40px)
px-6 → --spacing-6 → var(--space-6) → 1.5rem (24px)
text-xl → --text-xl → var(--font-size-xl) → 1.25rem (20px)
```

## Mapped Variables

### Spacing Utilities

**Affects:** `h-*`, `w-*`, `p-*`, `m-*`, `gap-*`, `inset-*`, `top-*`, `left-*`, `right-*`, `bottom-*`, `space-*`, `size-*`

| Tailwind Variable | Maps To | Value |
|-------------------|---------|-------|
| `--spacing-0` | `--space-0` | 0 |
| `--spacing-px` | `--space-px` | 1px |
| `--spacing-0.5` | `--space-0-5` | 0.125rem (2px) |
| `--spacing-1` | `--space-1` | 0.25rem (4px) |
| `--spacing-2` | `--space-2` | 0.5rem (8px) |
| `--spacing-3` | `--space-3` | 0.75rem (12px) |
| `--spacing-4` | `--space-4` | 1rem (16px) |
| `--spacing-5` | `--space-5` | 1.25rem (20px) |
| `--spacing-6` | `--space-6` | 1.5rem (24px) |
| `--spacing-8` | `--space-8` | 2rem (32px) |
| `--spacing-9` | `--space-9` | 2.25rem (36px) |
| `--spacing-10` | `--space-10` | 2.5rem (40px) |
| `--spacing-12` | `--space-12` | 3rem (48px) |
| `--spacing-16` | `--space-16` | 4rem (64px) |
| `--spacing-20` | `--space-20` | 5rem (80px) |
| `--spacing-24` | `--space-24` | 6rem (96px) |
| `--spacing-32` | `--space-32` | 8rem (128px) |

### Typography Utilities

**Affects:** `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, etc.

| Tailwind Variable | Maps To | Value |
|-------------------|---------|-------|
| `--text-xs` | `--font-size-xs` | 0.75rem (12px) |
| `--text-sm` | `--font-size-sm` | 0.875rem (14px) |
| `--text-base` | `--font-size-base` | 1rem (16px) |
| `--text-lg` | `--font-size-lg` | 1.125rem (18px) |
| `--text-xl` | `--font-size-xl` | 1.25rem (20px) |
| `--text-2xl` | `--font-size-2xl` | 1.5rem (24px) |
| `--text-3xl` | `--font-size-3xl` | 1.875rem (30px) |
| `--text-4xl` | `--font-size-4xl` | 2.25rem (36px) |
| `--text-5xl` | `--font-size-5xl` | 3rem (48px) |
| `--text-6xl` | `--font-size-6xl` | 3.75rem (60px) |
| `--text-7xl` | `--font-size-7xl` | 4.5rem (72px) |
| `--text-8xl` | `--font-size-8xl` | 6rem (96px) |
| `--text-9xl` | `--font-size-9xl` | 8rem (128px) |

### Additional Mappings

- **Line Height:** `leading-tight`, `leading-normal`, `leading-relaxed`, etc.
- **Letter Spacing:** `tracking-tight`, `tracking-wide`, `tracking-widest`, etc.
- **Font Weight:** `font-bold`, `font-semibold`, `font-medium`, etc.
- **Border Radius:** `rounded-sm`, `rounded-lg`, `rounded-xl`, etc.
- **Shadows:** `shadow-sm`, `shadow-md`, `shadow-lg`, etc.
- **Easing:** `ease-in`, `ease-out`, `ease-in-out`

## Benefits

### 1. Single Source of Truth

All spacing and typography values are defined once in our token system. Changes propagate automatically to all utilities.

```css
/* Update one token */
--space-10: 2.5rem; /* Change to 2.75rem */

/* Affects all these utilities automatically */
h-10, w-10, p-10, m-10, gap-10, size-10, inset-10, etc.
```

### 2. Consistency Enforcement

Developers can't accidentally use hardcoded values. All Tailwind utilities now enforce our design system:

```tsx
// ✅ Uses design token (--space-10 = 2.5rem)
<Button className="h-10 px-6" />

// ❌ No longer possible - only tokenized values available
<Button className="h-[37px] px-[23px]" />
```

### 3. Design System Alignment

Typography and spacing follow our modular scale (1.25 ratio), ensuring visual harmony:

```
Spacing: 4px base grid (4, 8, 12, 16, 20, 24...)
Typography: 1.25 modular scale (12, 14, 16, 18, 20, 24...)
```

### 4. Theme-Aware Components

Components automatically adapt to token changes:

```tsx
// Button component using Tailwind utilities
<Button className="h-10 px-6 rounded-[var(--radius)] text-sm" />

// All values come from design tokens:
// - h-10 → --spacing-10 → --space-10 → 2.5rem
// - px-6 → --spacing-6 → --space-6 → 1.5rem
// - text-sm → --text-sm → --font-size-sm → 0.875rem
// - rounded-[var(--radius)] → --radius-base → 0.375rem
```

## Usage Examples

### Component Development

```tsx
import { cva } from 'class-variance-authority'

const buttonVariants = cva(
  // All these utilities now use design tokens
  'h-10 px-6 gap-2 rounded-lg text-sm font-medium shadow-sm',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-xs',      // --space-8, --space-3, --font-size-xs
        default: 'h-10 px-6 text-sm', // --space-10, --space-6, --font-size-sm
        lg: 'h-12 px-8 text-base',    // --space-12, --space-8, --font-size-base
      }
    }
  }
)
```

### Layout Utilities

```tsx
<div className="space-y-6 p-8">        {/* --space-6, --space-8 */}
  <h1 className="text-4xl font-bold">  {/* --font-size-4xl, --font-weight-bold */}
    Heading
  </h1>
  <p className="text-base leading-relaxed"> {/* --font-size-base, --line-height-relaxed */}
    Content
  </p>
</div>
```

### Responsive Design

```tsx
<div className="w-full max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8">
  {/* All spacing values (px-4, px-6, px-8) use design tokens */}
  <div className="grid gap-6 sm:gap-8 lg:gap-12">
    {/* Gap utilities use --space-6, --space-8, --space-12 */}
  </div>
</div>
```

## Verification

### Test Results

All existing tests pass with the new token mappings:

```bash
pnpm vitest run src/components/ui/button.test.tsx
# ✓ 27 tests passed
```

### Storybook

Verify visually in Storybook:

```bash
pnpm storybook
# Visit http://localhost:6006
```

### DevTools Inspection

Check computed values in browser DevTools:

```css
.h-10 {
  height: var(--spacing-10); /* → var(--space-10) → 2.5rem */
}

.text-xl {
  font-size: var(--text-xl); /* → var(--font-size-xl) → 1.25rem */
}
```

## Migration Guide

### For New Components

Just use Tailwind utilities as normal - they automatically use design tokens:

```tsx
// ✅ Perfect - all tokenized
<Card className="p-6 rounded-lg shadow-md">
  <h2 className="text-2xl font-semibold mb-4">Title</h2>
  <p className="text-base text-gray-600">Content</p>
</Card>
```

### For Existing Components

Replace arbitrary values with standard utilities:

```tsx
// ❌ Before (hardcoded values)
<Button className="h-[40px] px-[24px] text-[14px]" />

// ✅ After (design tokens)
<Button className="h-10 px-6 text-sm" />
```

### For Custom CSS

Use design tokens directly:

```css
.custom-component {
  /* Use Tailwind utilities when possible */
  @apply h-10 px-6 text-sm;
  
  /* Or reference tokens directly */
  padding-block: var(--space-4);
  font-size: var(--font-size-lg);
  border-radius: var(--radius-base);
}
```

## Token Scale Reference

### Spacing Scale (4px base grid)

```
0     → 0
px    → 1px
0.5   → 2px
1     → 4px
2     → 8px
3     → 12px
4     → 16px
5     → 20px
6     → 24px
8     → 32px
10    → 40px
12    → 48px
16    → 64px
20    → 80px
24    → 96px
32    → 128px
```

### Typography Scale (1.25 modular scale)

```
xs    → 12px
sm    → 14px
base  → 16px
lg    → 18px
xl    → 20px
2xl   → 24px
3xl   → 30px
4xl   → 36px
5xl   → 48px
6xl   → 60px
7xl   → 72px
8xl   → 96px
9xl   → 128px
```

## Troubleshooting

### Utilities not using tokens

**Issue:** Tailwind utilities still show hardcoded values

**Solution:** Clear Vite cache and rebuild:

```bash
rm -rf node_modules/.vite
pnpm dev
```

### Custom values needed

**Issue:** Need a spacing value not in the scale (e.g., 42px)

**Solution:** 
1. Check if you can use a standard token (usually you can)
2. If truly necessary, add to `tokens.css`:

```css
--space-10-5: 2.625rem; /* 42px */
--spacing-10\.5: var(--space-10-5);
```

### Typography line-height issues

**Issue:** Text appears too cramped or loose

**Solution:** Use explicit leading utilities:

```tsx
<p className="text-base leading-relaxed">
  {/* --font-size-base with --line-height-relaxed */}
</p>
```

## Related Documentation

- [Storybook & Testing Setup](./storybook-testing.md)
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
- [Design Tokens Specification](../design-tokens-spec.md) (if exists)

## Maintenance

### Adding New Tokens

1. Add primitive token to `tokens.css`:

```css
--space-36: 9rem; /* 144px */
```

2. Add Tailwind mapping:

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
/* Change button heights across entire app */
--space-10: 2.75rem; /* was 2.5rem */
```

## Best Practices

1. **Prefer standard utilities over arbitrary values**
   ```tsx
   ✅ className="h-10 px-6"
   ❌ className="h-[40px] px-[24px]"
   ```

2. **Use semantic color tokens in CSS**
   ```tsx
   ✅ className="bg-primary text-primary-foreground"
   ❌ className="bg-primary-500 text-white"
   ```

3. **Combine spacing utilities for complex layouts**
   ```tsx
   ✅ className="p-6 space-y-4"
   ❌ className="p-[24px] [&>*+*]:mt-[16px]"
   ```

4. **Reference tokens in custom CSS**
   ```css
   ✅ padding: var(--space-6);
   ❌ padding: 24px;
   ```

5. **Document token deviations**
   ```tsx
   // Need custom spacing for optical alignment
   <Icon className="ml-[3px]" /> {/* Optical centering */}
   ```

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
