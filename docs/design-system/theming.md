# Theming with CSS Variables

Dynamic theming system using CSS Variables + Tailwind CSS v4, compatible with shadcn/ui.

## Strategy: CSS Variables (recommended)

```json
// components.json
{
  "tailwind": {
    "cssVariables": true
  }
}
```

### Advantages

✅ **Dynamic themes**: Change colors at runtime without recompiling  
✅ **Single build**: Tailwind generates `bg-primary` that uses `var(--primary)`  
✅ **Easy customization**: Change `--primary` and everything updates  
✅ **Simple dark mode**: Only change CSS values, not classes  
✅ **Maintainability**: Centralized tokens in CSS files

### Disadvantages of Utility Classes

❌ **Duplication**: `bg-zinc-950 dark:bg-white` in every component  
❌ **No dynamic themes**: Everything hardcoded  
❌ **Larger bundle**: All variants in the build  
❌ **Hard migration**: Changing colors requires touching 100+ files

---

## System Architecture

### 1. Primitive Tokens (`tokens.css`)

Defines base values and exposes variables to Tailwind:

```css
@theme {
  /* Primitive colors */
  --color-primary-500: oklch(0.55 0.22 250);
  --color-gray-100: oklch(0.96 0 0);
  
  /* Expose semantic variables to Tailwind */
  --color-primary: var(--primary);
  --color-destructive: var(--destructive);
  /* ... */
}
```

**Important**: Without `--color-*` in `@theme`, Tailwind **DOES NOT generate** classes like `bg-primary`.

### 2. Light/Dark Themes (`light.css` / `dark.css`)

Assign semantic values based on theme:

```css
/* light.css */
:root {
  --primary: var(--color-primary-500);
  --primary-foreground: var(--color-white);
  --background: var(--color-gray-50);
}

/* dark.css */
.dark {
  --primary: var(--color-primary-500);
  --primary-foreground: var(--color-gray-950);
  --background: var(--color-gray-950);
}
```

### 3. Entry Point (`index.css`)

Imports everything in order:

```css
@import "tailwindcss";
@import "./styles/themes/tokens.css";
@import "./styles/themes/light.css";
@import "./styles/themes/dark.css";
@import "./styles/base/typography.css";
@import "./styles/utilities/animations.css";

@custom-variant dark (&:where(.dark, .dark *));
```

---

## Complete Flow

```
1. Button uses: bg-primary
                    ↓
2. Tailwind generates: background-color: var(--color-primary)
                    ↓
3. tokens.css maps: --color-primary: var(--primary)
                    ↓
4. light.css defines: --primary: oklch(0.55 0.22 250)  [BLUE]
   dark.css defines:  --primary: oklch(0.55 0.22 250)  [SAME]
                    ↓
5. Renders: blue background in light AND dark
```

---

## Required Variables (shadcn/ui)

### Base Colors (20 variables)

```css
--background / --foreground
--card / --card-foreground
--popover / --popover-foreground
--primary / --primary-foreground
--secondary / --secondary-foreground
--muted / --muted-foreground
--accent / --accent-foreground
--destructive / --destructive-foreground
--border / --input / --ring
--radius
```

### Charts (5 variables)

```css
--chart-1
--chart-2
--chart-3
--chart-4
--chart-5
```

### Sidebar (8 variables)

```css
--sidebar-background / --sidebar-foreground
--sidebar-primary / --sidebar-primary-foreground
--sidebar-accent / --sidebar-accent-foreground
--sidebar-border / --sidebar-ring
```

---

## Adding New Colors

### 1. Define in `light.css` and `dark.css`

```css
/* light.css */
:root {
  --warning: oklch(0.84 0.16 84);
  --warning-foreground: oklch(0.28 0.07 46);
}

/* dark.css */
.dark {
  --warning: oklch(0.41 0.11 46);
  --warning-foreground: oklch(0.99 0.02 95);
}
```

### 2. Expose in `tokens.css`

```css
@theme {
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
}
```

### 3. Use in components

```tsx
<div className="bg-warning text-warning-foreground">
  Warning!
</div>
```

---

## Change Theme Dynamically

```tsx
// Enable dark mode
document.documentElement.classList.add('dark')

// Return to light mode
document.documentElement.classList.remove('dark')

// Toggle
document.documentElement.classList.toggle('dark')
```

All CSS variables update automatically.

---

## Troubleshooting

### ❌ "The `bg-primary` class has no styles"

**Cause**: Missing `--color-primary` exposure in `@theme`

**Solution**: Add to `tokens.css`:
```css
@theme {
  --color-primary: var(--primary);
}
```

### ❌ "Dark mode doesn't work"

**Cause**: Missing `@custom-variant` or `.dark` class not applied

**Solution**: 
1. Verify `index.css` has: `@custom-variant dark (&:where(.dark, .dark *))`
2. Verify HTML has: `<html class="dark">`

### ❌ "Colors look the same in light and dark"

**Cause**: `dark.css` not imported or has incorrect values

**Solution**: Verify import order in `index.css`:
```css
@import "./styles/themes/light.css";  /* First */
@import "./styles/themes/dark.css";   /* After */
```

### ❌ "Tailwind doesn't generate new classes"

**Cause**: Variables are not in `@theme`, only in `:root`

**Solution**: Variables **MUST** be in `@theme` for Tailwind to detect them:
```css
/* ❌ DOESN'T work */
:root {
  --color-custom: blue;
}

/* ✅ DOES work */
@theme {
  --color-custom: var(--custom);
}
:root {
  --custom: blue;
}
```

---

## Differences with Tailwind v3

| Aspect | Tailwind v3 | Tailwind v4 |
|---------|-------------|-------------|
| Config | `tailwind.config.js` | CSS-first (`@theme`) |
| Content | `content: ['./src/**']` | Auto-detect or `@source` |
| Variables | In config as object | In CSS as `--color-*` |
| Extension | `extend.colors` | `@theme { --color-* }` |

---

## References

- [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)
- [Tailwind v4 CSS-first Config](https://tailwindcss.com/docs/v4-beta)
- [OKLCH Color Space](https://oklch.com)
