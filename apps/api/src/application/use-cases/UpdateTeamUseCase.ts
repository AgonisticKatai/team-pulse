import type { TeamResponseDTO, UpdateTeamDTO } from '@team-pulse/shared'
import { DuplicatedError, NotFoundError, type RepositoryError, type ValidationError } from '../../domain/errors/index.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, Ok, type Result } from '../../domain/types/index.js'

/**
 * Update Team Use Case
 *
 * Updates an existing team
 */
export class UpdateTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): UpdateTeamUseCase {
    return new UpdateTeamUseCase({ teamRepository })
  }

  async execute(
    id: string,
    dto: UpdateTeamDTO,
  ): Promise<Result<TeamResponseDTO, DuplicatedError | NotFoundError | ValidationError | RepositoryError>> {
    const findTeamResult = await this.teamRepository.findById({ id })

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    if (!findTeamResult.value) {
      return Err(NotFoundError.create({ entityName: 'Team', identifier: id }))
    }

    if (dto.name && dto.name !== findTeamResult.value.name.getValue()) {
      const findTeamResult = await this.teamRepository.findByName({ name: dto.name })

      if (!findTeamResult.ok) {
        return Err(findTeamResult.error)
      }

      if (findTeamResult.value && findTeamResult.value.id.getValue() !== id) {
        return Err(DuplicatedError.create({ entityName: 'Team', identifier: dto.name }))
      }
    }

    const updateResult = findTeamResult.value.update({ city: dto.city, foundedYear: dto.foundedYear, name: dto.name })

    if (!updateResult.ok) {
      return Err(updateResult.error)
    }

    const saveResult = await this.teamRepository.save({ team: updateResult.value })

    if (!saveResult.ok) {
      return Err(saveResult.error)
    }

    return Ok(saveResult.value.toDTO())
  }
}
