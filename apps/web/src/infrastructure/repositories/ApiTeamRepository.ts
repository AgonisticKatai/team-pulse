import { Team } from '../../domain/entities'
import { DomainError, NotFoundError, ValidationError } from '../../domain/errors'
import type {
  CreateTeamData,
  ITeamRepository,
  TeamListResponse,
  UpdateTeamData,
} from '../../domain/repositories'
import type { Result } from '../../domain/types/Result'
import { Err, Ok } from '../../domain/types/Result'
import { ApiError } from '../api/api-client'
import type { TeamApiClient } from '../api/team-api-client'

/**
 * API Team Repository Implementation
 * Adapts TeamApiClient to ITeamRepository interface
 * Converts API responses to domain entities and handles errors
 */
export class ApiTeamRepository implements ITeamRepository {
  constructor(private readonly teamApiClient: TeamApiClient) {}

  /**
   * Find team by ID
   * Returns [error, null] or [null, team] or [null, null] if not found
   */
  async findById(id: string): Promise<Result<Team | null, DomainError>> {
    try {
      const teamDTO = await this.teamApiClient.getTeam(id)

      // Map team DTO to domain entity
      const [error, team] = Team.fromDTO(teamDTO)
      if (error) {
        return Err(error)
      }

      return Ok(team)
    } catch (error) {
      // If not found, return null instead of error
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        return Ok(null)
      }

      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Find team by name
   * Returns [error, null] or [null, team] or [null, null] if not found
   */
  async findByName(name: string): Promise<Result<Team | null, DomainError>> {
    try {
      // Get all teams and filter by name
      const teamsResponse = await this.teamApiClient.getTeams()

      const teamDTO = teamsResponse.teams.find((t) => t.name === name)

      if (!teamDTO) {
        return Ok(null)
      }

      // Map team DTO to domain entity
      const [error, team] = Team.fromDTO(teamDTO)
      if (error) {
        return Err(error)
      }

      return Ok(team)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Get all teams
   * Returns [error, null] or [null, { teams, total }]
   */
  async findAll(): Promise<Result<TeamListResponse, DomainError>> {
    try {
      const response = await this.teamApiClient.getTeams()

      // Map team DTOs to domain entities
      const [error, teams] = Team.fromDTOList(response.teams)
      if (error) {
        return Err(error)
      }

      return Ok({
        teams,
        total: response.total,
      })
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Create new team
   * Returns [error, null] or [null, team]
   */
  async create(data: CreateTeamData): Promise<Result<Team, DomainError>> {
    try {
      const teamDTO = await this.teamApiClient.createTeam({
        city: data.city,
        foundedYear: data.foundedYear,
        name: data.name,
      })

      // Map team DTO to domain entity
      const [error, team] = Team.fromDTO(teamDTO)
      if (error) {
        return Err(error)
      }

      return Ok(team)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Update existing team
   * Returns [error, null] or [null, team]
   */
  async update(id: string, data: UpdateTeamData): Promise<Result<Team, DomainError>> {
    try {
      const teamDTO = await this.teamApiClient.updateTeam(id, {
        city: data.city,
        foundedYear: data.foundedYear,
        name: data.name,
      })

      // Map team DTO to domain entity
      const [error, team] = Team.fromDTO(teamDTO)
      if (error) {
        return Err(error)
      }

      return Ok(team)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Delete team by ID
   * Returns [error, null] or [null, true]
   */
  async delete(id: string): Promise<Result<true, DomainError>> {
    try {
      await this.teamApiClient.deleteTeam(id)

      return Ok(true)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Check if team exists by name
   * Returns [error, null] or [null, exists]
   */
  async existsByName(name: string): Promise<Result<boolean, DomainError>> {
    try {
      const [error, team] = await this.findByName(name)

      if (error) {
        return Err(error)
      }

      return Ok(team !== null)
    } catch (error) {
      return Err(this.mapApiErrorToDomain(error))
    }
  }

  /**
   * Map ApiError to DomainError
   */
  private mapApiErrorToDomain(error: unknown): DomainError {
    if (error instanceof ApiError) {
      // Map to specific domain errors based on error code
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return new ValidationError(error.message, {
            details: error.details,
            field: error.field,
          })

        case 'NOT_FOUND':
          return new NotFoundError(error.message)

        default:
          return new DomainError(error.message, {
            isOperational: error.statusCode < 500,
          })
      }
    }

    // Unknown errors
    if (error instanceof Error) {
      return new DomainError(error.message, { isOperational: false })
    }

    return new DomainError('An unknown error occurred', {
      isOperational: false,
    })
  }
}
