import type { ITeamRepository } from '@features/teams/domain/repositories/team/ITeamRepository.js'
import type { RepositoryError, TeamId } from '@team-pulse/shared'
import { Err, NotFoundError, Ok, type Result } from '@team-pulse/shared'

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

  async execute({ id }: { id: TeamId }): Promise<Result<void, NotFoundError | RepositoryError>> {
    const findTeamResult = await this.teamRepository.findById({ id })

    if (!findTeamResult.ok) return Err(findTeamResult.error)

    if (!findTeamResult.value) return Err(NotFoundError.forResource({ identifier: id, resource: 'Team' }))

    const deleteResult = await this.teamRepository.delete({ id })

    if (!deleteResult.ok) return Err(deleteResult.error)

    return Ok(undefined)
  }
}
