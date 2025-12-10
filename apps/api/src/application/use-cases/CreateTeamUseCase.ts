import { randomUUID } from 'node:crypto'
import { Team } from '@domain/models/team/Team.js'
import type { ITeamRepository } from '@domain/repositories/ITeamRepository.js'
import type { CreateTeamDTO, RepositoryError, Result, TeamResponseDTO, ValidationError } from '@team-pulse/shared'
import { ConflictError, Err, Ok } from '@team-pulse/shared'

export class CreateTeamUseCase {
  private readonly teamRepository: ITeamRepository

  private constructor({ teamRepository }: { teamRepository: ITeamRepository }) {
    this.teamRepository = teamRepository
  }

  static create({ teamRepository }: { teamRepository: ITeamRepository }): CreateTeamUseCase {
    return new CreateTeamUseCase({ teamRepository })
  }

  async execute({
    dto,
  }: {
    dto: CreateTeamDTO
  }): Promise<Result<TeamResponseDTO, ConflictError | RepositoryError | ValidationError>> {
    const findTeamResult = await this.teamRepository.findByName({ name: dto.name })

    if (!findTeamResult.ok) return Err(findTeamResult.error)

    if (findTeamResult.value) return Err(ConflictError.duplicate({ identifier: dto.name, resource: 'Team' }))

    const createTeamResult = Team.create({ id: randomUUID(), name: dto.name })

    if (!createTeamResult.ok) return Err(createTeamResult.error)

    const saveTeamResult = await this.teamRepository.save({ team: createTeamResult.value })

    if (!saveTeamResult.ok) return Err(saveTeamResult.error)

    return Ok(saveTeamResult.value.toDTO())
  }
}
