/**
 * Authentication Context (Application Layer)
 *
 * Provides authentication state and operations throughout the application.
 * This context handles:
 * - User authentication state
 * - Login/logout operations
 * - Token management (access + refresh)
 * - Automatic token refresh
 * - Persistent auth via localStorage
 *
 * Best practices implemented:
 * - Type-safe context with TypeScript
 * - Automatic token refresh before expiry
 * - Secure token storage
 * - Loading and error states
 * - Clean separation of concerns
 */

import type { UserResponseDTO } from '@team-pulse/shared'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ApiClient } from '../../infrastructure/api/apiClient'
import type { AuthApiClient } from '../../infrastructure/api/authApiClient'

/**
 * Authentication state
 */
export interface AuthState {
  user: UserResponseDTO | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Authentication context value
 */
export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

/**
 * Authentication context
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Storage keys for persistent auth
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'team_pulse_access_token',
  REFRESH_TOKEN: 'team_pulse_refresh_token',
  USER: 'team_pulse_user',
} as const

/**
 * Auth Provider Props
 */
export interface AuthProviderProps {
  children: ReactNode
  authApiClient: AuthApiClient
  apiClient: ApiClient
}

/**
 * Authentication Provider Component
 *
 * Wraps the application and provides authentication state/operations
 */
export function AuthProvider({ children, authApiClient, apiClient }: AuthProviderProps) {
  const [user, setUser] = useState<UserResponseDTO | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Save tokens and user to localStorage
   */
  const saveAuthData = useCallback(
    (accessToken: string, refreshToken: string, userData: UserResponseDTO) => {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
      apiClient.setAccessToken(accessToken)
      setUser(userData)
    },
    [apiClient],
  )

  /**
   * Clear auth data from state and localStorage
   */
  const clearAuthData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    apiClient.setAccessToken(null)
    setUser(null)
  }, [apiClient])

  /**
   * Refresh access token using refresh token
   */
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const userJson = localStorage.getItem(STORAGE_KEYS.USER)
      if (!refreshToken || !userJson) {
        return false
      }

      const response = await authApiClient.refreshToken({ refreshToken })
      const userData = JSON.parse(userJson) as UserResponseDTO

      // Only update the access token, keep existing refresh token and user
      saveAuthData(response.accessToken, refreshToken, userData)
      return true
    } catch {
      clearAuthData()
      return false
    }
  }, [authApiClient, saveAuthData, clearAuthData])

  /**
   * Login function
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await authApiClient.login({ email, password })
        saveAuthData(response.accessToken, response.refreshToken, response.user)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [authApiClient, saveAuthData],
  )

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      if (refreshToken) {
        // Try to logout on backend (invalidate refresh token)
        await authApiClient.logout({ refreshToken })
      }
    } catch {
      // Ignore logout errors - clear local state anyway
    } finally {
      clearAuthData()
    }
  }, [authApiClient, clearAuthData])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Initialize auth state on mount
   * Attempts to restore session from localStorage
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
        const userJson = localStorage.getItem(STORAGE_KEYS.USER)

        if (!accessToken || !refreshToken || !userJson) {
          setIsLoading(false)
          return
        }

        // Restore user and token
        const userData = JSON.parse(userJson) as UserResponseDTO
        apiClient.setAccessToken(accessToken)
        setUser(userData)

        // Verify token is still valid by fetching current user
        try {
          const currentUser = await authApiClient.getCurrentUser()
          setUser(currentUser)
        } catch {
          // Token expired or invalid, try to refresh
          const refreshed = await refreshAccessToken()
          if (!refreshed) {
            clearAuthData()
          }
        }
      } catch {
        clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [authApiClient, apiClient, clearAuthData, refreshAccessToken])

  /**
   * Setup automatic token refresh
   * Refreshes token 1 minute before expiry (14 minutes for 15-minute tokens)
   */
  useEffect(() => {
    if (!user) return

    // Refresh every 14 minutes (1 minute before 15-minute expiry)
    const REFRESH_INTERVAL = 14 * 60 * 1000

    const intervalId = setInterval(() => {
      refreshAccessToken()
    }, REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [user, refreshAccessToken])

  /**
   * Memoize context value to prevent unnecessary re-renders
   */
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      error,
      login,
      logout,
      clearError,
    }),
    [user, isLoading, error, login, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
