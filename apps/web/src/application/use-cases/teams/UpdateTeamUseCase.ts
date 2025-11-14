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
   * Validate input fields
   */
  private validateInput(input: UpdateTeamUseCaseInput): DomainError | null {
    if (input.name !== undefined) {
      const [nameError] = TeamName.create(input.name)
      if (nameError) return nameError
    }

    if (input.city !== undefined) {
      const [cityError] = City.create(input.city)
      if (cityError) return cityError
    }

    if (input.foundedYear !== undefined) {
      const [yearError] = FoundedYear.create(input.foundedYear)
      if (yearError) return yearError
    }

    return null
  }

  /**
   * Check if name is being changed and doesn't conflict
   */
  private async checkNameUniqueness(newName: string | undefined, existingTeam: Team): Promise<DomainError | null> {
    if (!newName || newName === existingTeam.getName().getValue()) {
      return null
    }

    const [existsError, exists] = await this.teamRepository.existsByName(newName)
    if (existsError) return existsError
    if (exists) {
      return ValidationError.forField('name', `Team with name '${newName}' already exists`)
    }

    return null
  }

  /**
   * Execute update team
   * Returns [error, null] or [null, team]
   */
  async execute(teamId: string, input: UpdateTeamUseCaseInput, currentUser: User | null): Promise<Result<Team, DomainError>> {
    const [permissionError] = canUpdateTeam(currentUser)
    if (permissionError) return Err(permissionError)

    const validationError = this.validateInput(input)
    if (validationError) return Err(validationError)

    const [findError, existingTeam] = await this.teamRepository.findById(teamId)
    if (findError) return Err(findError)
    if (!existingTeam) return Err(NotFoundError.entity('Team', teamId))

    const nameError = await this.checkNameUniqueness(input.name, existingTeam)
    if (nameError) return Err(nameError)

    const [updateError, team] = await this.teamRepository.update(teamId, input)
    if (updateError) return Err(updateError)

    return [null, team]
  }
}
