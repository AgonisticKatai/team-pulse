import type { ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'

/**
 * Auth Context Type
 */
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (user: User) => void
  logout: () => void
}

/**
 * User Type
 * TODO: Move to shared types when defined
 */
interface User {
  id: string
  email: string
  name?: string
}

/**
 * Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Auth Provider Component
 *
 * Manages global authentication state across the application.
 * Provides authentication status and user information to all child components.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = () => {
    setUser(null)
    // TODO: Clear tokens from storage
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        login,
        logout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook
 *
 * Access authentication context from any component.
 *
 * @throws {Error} If used outside AuthProvider
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, logout } = useAuth()
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
