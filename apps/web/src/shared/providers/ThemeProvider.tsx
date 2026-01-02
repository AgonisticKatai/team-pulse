import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

/**
 * Theme Types
 */
type Theme = 'light' | 'dark' | 'system'

/**
 * Theme Context Type
 */
interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

/**
 * Theme Context
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * Theme Provider Component
 *
 * Manages theme state (light/dark mode) across the application.
 * Persists theme preference in localStorage.
 *
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'system'
    const stored = localStorage.getItem('theme') as Theme | null
    return stored || 'system'
  })

  useEffect(() => {
    const root = window.document.documentElement

    // Remove previous theme classes
    root.classList.remove('light', 'dark')

    // Apply theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem('theme', newTheme)
    setThemeState(newTheme)
  }

  return <ThemeContext.Provider value={{ setTheme, theme }}>{children}</ThemeContext.Provider>
}

/**
 * useTheme Hook
 *
 * Access theme context from any component.
 *
 * @throws {Error} If used outside ThemeProvider
 *
 * @example
 * ```tsx
 * const { theme, setTheme } = useTheme()
 * setTheme('dark')
 * ```
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
