import type { Team, User } from '../../../domain/entities'
import type { DomainError } from '../../../domain/errors'
import { ValidationError } from '../../../domain/errors'
import type { ITeamRepository } from '../../../domain/repositories'
import { canCreateTeam } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'
import { City, FoundedYear, TeamName } from '../../../domain/value-objects'

/**
 * Create Team Use Case input
 */
export interface CreateTeamUseCaseInput {
  city: string
  foundedYear?: number | null
  name: string
}

/**
 * Create Team Use Case
 * Orchestrates team creation
 */
export class CreateTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  /**
   * Execute create team
   * Returns [error, null] or [null, team]
   */
  async execute(
    input: CreateTeamUseCaseInput,
    currentUser: User | null,
  ): Promise<Result<Team, DomainError>> {
    // Check permissions
    const [permissionError] = canCreateTeam(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Validate team name
    const [nameError] = TeamName.create(input.name)
    if (nameError) {
      return Err(nameError)
    }

    // Validate city
    const [cityError] = City.create(input.city)
    if (cityError) {
      return Err(cityError)
    }

    // Validate founded year (optional)
    const [yearError] = FoundedYear.create(input.foundedYear)
    if (yearError) {
      return Err(yearError)
    }

    // Check if team name already exists
    const [existsError, exists] = await this.teamRepository.existsByName(input.name)
    if (existsError) {
      return Err(existsError)
    }

    if (exists) {
      return Err(ValidationError.forField('name', `Team with name '${input.name}' already exists`))
    }

    // Create team via repository
    const [createError, team] = await this.teamRepository.create(input)

    if (createError) {
      return Err(createError)
    }

    return [null, team]
  }
}
