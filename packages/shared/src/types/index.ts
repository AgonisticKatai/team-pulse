/**
 * Shared Types Module
 *
 * Core domain types and enums used across frontend and backend
 * NOTE: DTOs with validation schemas are in dtos/ folder
 */

// Health check
export interface HealthCheckResponse {
  status: 'ok' | 'error'
  message: string
  timestamp: string
  environment?: string
}

// Match types (to be expanded in the future)
export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  date: Date
  status: 'scheduled' | 'in-progress' | 'finished'
}
