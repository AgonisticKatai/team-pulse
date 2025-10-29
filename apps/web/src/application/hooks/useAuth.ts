/**
 * useAuth Hook
 *
 * Custom hook to access authentication context.
 * Provides type-safe access to auth state and operations.
 *
 * Usage:
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth()
 * ```
 *
 * @throws Error if used outside of AuthProvider
 */

import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
