// Additional shared types will be defined here as we progress

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// Team DTOs - Shared between API and Frontend
// ============================================================================

/**
 * DTO for creating a new team
 */
export interface CreateTeamDTO {
  name: string
  city: string
  foundedYear?: number | null
}

/**
 * DTO for updating a team (all fields optional)
 */
export interface UpdateTeamDTO {
  name?: string
  city?: string
  foundedYear?: number | null
}

/**
 * Response DTO for a team
 */
export interface TeamResponseDTO {
  id: string
  name: string
  city: string
  foundedYear: number | null
  createdAt: string // ISO string for JSON serialization
  updatedAt: string // ISO string for JSON serialization
}

/**
 * List of teams response
 */
export interface TeamsListResponseDTO {
  teams: TeamResponseDTO[]
  total: number
}

// ============================================================================
// Authentication & Authorization DTOs
// ============================================================================

/**
 * User roles in the system
 */
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER'

/**
 * User response DTO (without password hash)
 */
export interface UserResponseDTO {
  id: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

/**
 * Login request DTO
 */
export interface LoginRequestDTO {
  email: string
  password: string
}

/**
 * Login response DTO
 */
export interface LoginResponseDTO {
  accessToken: string
  refreshToken: string
  user: UserResponseDTO
}

/**
 * Refresh token request DTO
 */
export interface RefreshTokenRequestDTO {
  refreshToken: string
}

/**
 * Refresh token response DTO
 */
export interface RefreshTokenResponseDTO {
  accessToken: string
  refreshToken: string
  user: UserResponseDTO
}

/**
 * Logout request DTO
 */
export interface LogoutRequestDTO {
  refreshToken: string
}
