// Shared types and domain models

export interface HealthCheckResponse {
  status: 'ok' | 'error'
  message: string
  timestamp: string
  environment?: string
}

// User types and authentication
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'

export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
}

export interface CreateUserRequest {
  email: string
  password: string
  role: UserRole
}

// Match types (to be expanded)
export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  date: Date
  status: 'scheduled' | 'in-progress' | 'finished'
}

// Export all types
export * from './types'
