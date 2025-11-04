import type { Team } from '../entities'
import type { DomainError } from '../errors'
import type { Result } from '../types/Result'

/**
 * Team creation data
 */
export interface CreateTeamData {
  city: string
  foundedYear?: number | null
  name: string
}

/**
 * Team update data
 */
export interface UpdateTeamData {
  city?: string
  foundedYear?: number | null
  name?: string
}

/**
 * Team list response
 */
export interface TeamListResponse {
  teams: Team[]
  total: number
}

/**
 * Team Repository Interface (PORT)
 * Defines the contract for team operations
 */
export interface ITeamRepository {
  /**
   * Find team by ID
   * Returns [error, null] or [null, team] or [null, null] if not found
   */
  findById(id: string): Promise<Result<Team | null, DomainError>>

  /**
   * Find team by name
   * Returns [error, null] or [null, team] or [null, null] if not found
   */
  findByName(name: string): Promise<Result<Team | null, DomainError>>

  /**
   * Get all teams
   * Returns [error, null] or [null, { teams, total }]
   */
  findAll(): Promise<Result<TeamListResponse, DomainError>>

  /**
   * Create new team
   * Returns [error, null] or [null, team]
   */
  create(data: CreateTeamData): Promise<Result<Team, DomainError>>

  /**
   * Update existing team
   * Returns [error, null] or [null, team]
   */
  update(id: string, data: UpdateTeamData): Promise<Result<Team, DomainError>>

  /**
   * Delete team by ID
   * Returns [error, null] or [null, true]
   */
  delete(id: string): Promise<Result<true, DomainError>>

  /**
   * Check if team exists by name
   * Returns [error, null] or [null, exists]
   */
  existsByName(name: string): Promise<Result<boolean, DomainError>>
}
