import type { Team, User } from '../../../domain/entities'
import { type DomainError, NotFoundError, ValidationError } from '../../../domain/errors'
import type { ITeamRepository } from '../../../domain/repositories'
import { canUpdateTeam } from '../../../domain/services'
import type { Result } from '../../../domain/types/Result'
import { Err } from '../../../domain/types/Result'
import { City, FoundedYear, TeamName } from '../../../domain/value-objects'

/**
 * Update Team Use Case input
 */
export interface UpdateTeamUseCaseInput {
  city?: string
  foundedYear?: number | null
  name?: string
}

/**
 * Update Team Use Case
 * Orchestrates team update
 */
export class UpdateTeamUseCase {
  constructor(private readonly teamRepository: ITeamRepository) {}

  /**
   * Execute update team
   * Returns [error, null] or [null, team]
   */
  async execute(
    teamId: string,
    input: UpdateTeamUseCaseInput,
    currentUser: User | null,
  ): Promise<Result<Team, DomainError>> {
    // Check permissions
    const [permissionError] = canUpdateTeam(currentUser)
    if (permissionError) {
      return Err(permissionError)
    }

    // Validate name if provided
    if (input.name !== undefined) {
      const [nameError] = TeamName.create(input.name)
      if (nameError) {
        return Err(nameError)
      }
    }

    // Validate city if provided
    if (input.city !== undefined) {
      const [cityError] = City.create(input.city)
      if (cityError) {
        return Err(cityError)
      }
    }

    // Validate founded year if provided
    if (input.foundedYear !== undefined) {
      const [yearError] = FoundedYear.create(input.foundedYear)
      if (yearError) {
        return Err(yearError)
      }
    }

    // Check if team exists
    const [findError, existingTeam] = await this.teamRepository.findById(teamId)
    if (findError) {
      return Err(findError)
    }

    if (!existingTeam) {
      return Err(NotFoundError.entity('Team', teamId))
    }

    // Check if new name already exists (if name is being changed)
    if (input.name && input.name !== existingTeam.getName().getValue()) {
      const [existsError, exists] = await this.teamRepository.existsByName(input.name)
      if (existsError) {
        return Err(existsError)
      }

      if (exists) {
        return Err(
          ValidationError.forField('name', `Team with name '${input.name}' already exists`),
        )
      }
    }

    // Update team via repository
    const [updateError, team] = await this.teamRepository.update(teamId, input)

    if (updateError) {
      return Err(updateError)
    }

    return [null, team]
  }
}
