import type { TeamResponseDTO } from '@team-pulse/shared'
import { Team } from '../../domain/entities'
import { ValidationError } from '../../domain/errors'
import type { Result } from '../../domain/types/Result'
import { Err } from '../../domain/types/Result'

/**
 * Team Mapper
 * Converts between DTOs and Domain Entities
 */

/**
 * Map DTO to Domain Entity
 * Returns [error, null] or [null, team]
 */
export function teamToDomain(dto: TeamResponseDTO): Result<Team, ValidationError> {
  const [error, team] = Team.create({
    city: dto.city,
    createdAt: dto.createdAt,
    foundedYear: dto.foundedYear,
    id: dto.id,
    name: dto.name,
    updatedAt: dto.updatedAt,
  })

  if (error) {
    return Err(
      new ValidationError(`Failed to map Team DTO to domain: ${error.message}`, {
        details: { dto, originalError: error.toObject() },
      }),
    )
  }

  return [null, team]
}

/**
 * Map array of DTOs to array of Domain Entities
 * Returns [error, null] or [null, teams[]]
 * If any DTO fails to map, returns error for the first failure
 */
export function teamToDomainList(dtos: TeamResponseDTO[]): Result<Team[], ValidationError> {
  const teams: Team[] = []

  for (const dto of dtos) {
    const [error, team] = teamToDomain(dto)
    if (error) {
      return Err(error)
    }
    teams.push(team)
  }

  return [null, teams]
}

/**
 * Map Domain Entity to DTO
 * This is used when we need to send data to the API
 */
export function teamToDTO(team: Team): TeamResponseDTO {
  return {
    city: team.getCity().getValue(),
    createdAt: team.getCreatedAt().toISOString(),
    foundedYear: team.getFoundedYear()?.getValue() ?? null,
    id: team.getId().getValue(),
    name: team.getName().getValue(),
    updatedAt: team.getUpdatedAt().toISOString(),
  }
}

/**
 * Map array of Domain Entities to array of DTOs
 */
export function teamToDTOList(teams: Team[]): TeamResponseDTO[] {
  return teams.map((team) => teamToDTO(team))
}
