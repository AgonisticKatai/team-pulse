import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { RepositoryError } from '@team-pulse/shared/errors'
import { NotFoundError } from '@team-pulse/shared/errors'
import { Err, Ok, type Result } from '@team-pulse/shared/result'

/**
 * Delete Team Use Case
 *
 * Deletes a team by ID
 */
export class DeleteTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): DeleteTeamUseCase {
    return new DeleteTeamUseCase({ teamRepository })
  }

  async execute(id: string): Promise<Result<void, NotFoundError | RepositoryError>> {
    const findTeamResult = await this.teamRepository.findById({ id })

    if (!findTeamResult.ok) {
      return Err(findTeamResult.error)
    }

    if (!findTeamResult.value) {
      return Err(NotFoundError.forResource({ resource: 'Team', identifier: id }))
    }

    const deleteResult = await this.teamRepository.delete({ id })

    if (!deleteResult.ok) {
      return Err(deleteResult.error)
    }

    return Ok(undefined)
  }
}
