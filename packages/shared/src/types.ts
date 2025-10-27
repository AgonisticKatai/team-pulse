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
