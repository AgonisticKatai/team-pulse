import type { CreateTeamDTO, TeamResponseDTO, TeamsListResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import type { ApiClient } from './api-client'

/**
 * Team API Client (Infrastructure Layer)
 *
 * Provides type-safe methods for interacting with the Teams API.
 * This is an ADAPTER in hexagonal architecture:
 * - Uses the base ApiClient for HTTP communication
 * - Maps between API responses and application types
 * - Handles Team-specific API endpoints
 *
 * All methods return Promises with typed data.
 */
export class TeamApiClient {
  constructor(private readonly apiClient: ApiClient) {}

  /**
   * Get all teams
   *
   * @returns List of all teams
   */
  getTeams(): Promise<TeamsListResponseDTO> {
    return this.apiClient.get<TeamsListResponseDTO>('/api/teams')
  }

  /**
   * Get a single team by ID
   *
   * @param id - Team ID
   * @returns Team details
   */
  getTeam(id: string): Promise<TeamResponseDTO> {
    return this.apiClient.get<TeamResponseDTO>(`/api/teams/${id}`)
  }

  /**
   * Create a new team
   *
   * @param data - Team creation data
   * @returns Created team
   */
  createTeam(data: CreateTeamDTO): Promise<TeamResponseDTO> {
    return this.apiClient.post<TeamResponseDTO>('/api/teams', data)
  }

  /**
   * Update an existing team
   *
   * @param id - Team ID
   * @param data - Team update data
   * @returns Updated team
   */
  updateTeam(id: string, data: UpdateTeamDTO): Promise<TeamResponseDTO> {
    return this.apiClient.patch<TeamResponseDTO>(`/api/teams/${id}`, data)
  }

  /**
   * Delete a team
   *
   * @param id - Team ID
   */
  deleteTeam(id: string): Promise<void> {
    return this.apiClient.delete<void>(`/api/teams/${id}`)
  }
}

/**
 * Create Team API Client instance
 */
export function createTeamApiClient(apiClient: ApiClient): TeamApiClient {
  return new TeamApiClient(apiClient)
}
