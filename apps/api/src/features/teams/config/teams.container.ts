import { CreateTeamUseCase } from '@features/teams/application/use-cases/create-team/CreateTeamUseCase.js'
import { DeleteTeamUseCase } from '@features/teams/application/use-cases/delete-team/DeleteTeamUseCase.js'
import { GetTeamUseCase } from '@features/teams/application/use-cases/get-team/GetTeamUseCase.js'
import { ListTeamsUseCase } from '@features/teams/application/use-cases/list-teams/ListTeamsUseCase.js'
import { UpdateTeamUseCase } from '@features/teams/application/use-cases/update-team/UpdateTeamUseCase.js'
import type { ITeamRepository } from '@features/teams/domain/repositories/team/ITeamRepository.js'
import { KyselyTeamRepository } from '@features/teams/infrastructure/repositories/team/KyselyTeamRepository.js'
import type { Database } from '@shared/database/connection/connection.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'

/**
 * Teams Feature Container
 *
 * Dependency Injection container for the Teams feature.
 * Manages all team-specific dependencies and use cases.
 *
 * Architecture:
 * - Feature-scoped DI container
 * - Lazy initialization via getters
 * - Dependencies injected via constructor
 * - Implements Composition Root pattern
 *
 * Benefits:
 * - Teams feature is self-contained
 * - Clear dependency boundaries
 * - Easy to test (inject mocks)
 * - Can be worked on independently
 *
 * Shared Dependencies (injected):
 * - database: From shared container
 *
 * Public API:
 * - teamRepository: Team data access
 * - createTeamUseCase: Team creation
 * - getTeamUseCase: Team retrieval
 * - listTeamsUseCase: Team listing
 * - updateTeamUseCase: Team updates
 * - deleteTeamUseCase: Team deletion
 */
export class TeamsContainer {
  private _teamRepository?: ITeamRepository

  // Use Cases
  private _createTeamUseCase?: CreateTeamUseCase
  private _getTeamUseCase?: GetTeamUseCase
  private _listTeamsUseCase?: ListTeamsUseCase
  private _updateTeamUseCase?: UpdateTeamUseCase
  private _deleteTeamUseCase?: DeleteTeamUseCase

  constructor(
    private readonly database: Database,
    private readonly metricsService: IMetricsService,
  ) {}

  /**
   * Team Repository (singleton)
   */
  get teamRepository(): ITeamRepository {
    if (!this._teamRepository) {
      this._teamRepository = KyselyTeamRepository.create({ db: this.database })
    }
    return this._teamRepository
  }

  /**
   * Create Team Use Case (singleton)
   */
  get createTeamUseCase(): CreateTeamUseCase {
    if (!this._createTeamUseCase) {
      this._createTeamUseCase = CreateTeamUseCase.create({
        teamRepository: this.teamRepository,
      })
    }
    return this._createTeamUseCase
  }

  /**
   * Get Team Use Case (singleton)
   */
  get getTeamUseCase(): GetTeamUseCase {
    if (!this._getTeamUseCase) {
      this._getTeamUseCase = GetTeamUseCase.create({
        teamRepository: this.teamRepository,
      })
    }
    return this._getTeamUseCase
  }

  /**
   * List Teams Use Case (singleton)
   */
  get listTeamsUseCase(): ListTeamsUseCase {
    if (!this._listTeamsUseCase) {
      this._listTeamsUseCase = ListTeamsUseCase.create({
        metricsService: this.metricsService,
        teamRepository: this.teamRepository,
      })
    }
    return this._listTeamsUseCase
  }

  /**
   * Update Team Use Case (singleton)
   */
  get updateTeamUseCase(): UpdateTeamUseCase {
    if (!this._updateTeamUseCase) {
      this._updateTeamUseCase = UpdateTeamUseCase.create({
        teamRepository: this.teamRepository,
      })
    }
    return this._updateTeamUseCase
  }

  /**
   * Delete Team Use Case (singleton)
   */
  get deleteTeamUseCase(): DeleteTeamUseCase {
    if (!this._deleteTeamUseCase) {
      this._deleteTeamUseCase = DeleteTeamUseCase.create({
        teamRepository: this.teamRepository,
      })
    }
    return this._deleteTeamUseCase
  }
}
