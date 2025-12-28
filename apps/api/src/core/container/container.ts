import { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import { LoginUseCase } from '@features/auth/application/use-cases/login/LoginUseCase.js'
import { LogoutUseCase } from '@features/auth/application/use-cases/logout/LogoutUseCase.js'
import { RefreshTokenUseCase } from '@features/auth/application/use-cases/refresh-token/RefreshTokenUseCase.js'
import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
import { KyselyRefreshTokenRepository } from '@features/auth/infrastructure/repositories/refresh-token/KyselyRefreshTokenRepository.js'
import { ScryptPasswordHasher } from '@features/auth/infrastructure/services/password-hasher/ScryptPasswordHasher.js'
import { CreateTeamUseCase } from '@features/teams/application/use-cases/create-team/CreateTeamUseCase.js'
import { DeleteTeamUseCase } from '@features/teams/application/use-cases/delete-team/DeleteTeamUseCase.js'
import { GetTeamUseCase } from '@features/teams/application/use-cases/get-team/GetTeamUseCase.js'
import { ListTeamsUseCase } from '@features/teams/application/use-cases/list-teams/ListTeamsUseCase.js'
import { UpdateTeamUseCase } from '@features/teams/application/use-cases/update-team/UpdateTeamUseCase.js'
import type { ITeamRepository } from '@features/teams/domain/repositories/team/ITeamRepository.js'
import { KyselyTeamRepository } from '@features/teams/infrastructure/repositories/team/KyselyTeamRepository.js'
import { CreateUserUseCase } from '@features/users/application/use-cases/create-user/CreateUserUseCase.js'
import { ListUsersUseCase } from '@features/users/application/use-cases/list-users/ListUsersUseCase.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import { KyselyUserRepository } from '@features/users/infrastructure/repositories/user/KyselyUserRepository.js'
import type { Env } from '@shared/config/environment/env.js'
import { createDatabase, type Database } from '@shared/database/connection/connection.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import { PrometheusMetricsFactory } from '@shared/monitoring/prometheus/factory/PrometheusMetricsFactory.js'
import { MetricsService } from '@shared/monitoring/services/MetricsService.js'
import type { IPasswordHasher } from '@shared/security/IPasswordHasher.js'

/**
 * Dependency Injection Container
 *
 * This is the COMPOSITION ROOT of the application:
 * - Creates and wires all dependencies
 * - Manages object lifecycles
 * - Implements Dependency Inversion Principle
 *
 * Why manual DI instead of a framework?
 * 1. More educational - you see exactly what's happening
 * 2. No magic - explicit and clear
 * 3. Type-safe - no reflection or decorators needed
 * 4. Easy to evolve to a framework later (TSyringe, InversifyJS)
 * 5. Zero runtime overhead
 *
 * Benefits:
 * - Domain and application layers don't depend on infrastructure
 * - Easy to swap implementations (different repositories, databases)
 * - Easy to test (inject mocks instead of real implementations)
 * - Clear visualization of dependencies
 */

export class Container {
  // Infrastructure
  private _database: Database
  private _metricsService?: IMetricsService
  private _passwordHasher?: IPasswordHasher
  private _refreshTokenRepository?: IRefreshTokenRepository
  private _teamRepository?: ITeamRepository
  private _tokenFactory?: TokenFactory
  private _userRepository?: IUserRepository

  // Team Use Cases
  private _createTeamUseCase?: CreateTeamUseCase
  private _getTeamUseCase?: GetTeamUseCase
  private _listTeamsUseCase?: ListTeamsUseCase
  private _updateTeamUseCase?: UpdateTeamUseCase
  private _deleteTeamUseCase?: DeleteTeamUseCase

  // Auth Use Cases
  private _loginUseCase?: LoginUseCase
  private _refreshTokenUseCase?: RefreshTokenUseCase
  private _logoutUseCase?: LogoutUseCase

  // User Use Cases
  private _createUserUseCase?: CreateUserUseCase
  private _listUsersUseCase?: ListUsersUseCase

  constructor(
    private env: Env,
    database: Database,
  ) {
    this._database = database
  }

  /**
   * Database instance (singleton)
   */
  get database(): Database {
    return this._database
  }

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
   * User Repository (singleton)
   */
  get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = KyselyUserRepository.create({ db: this.database })
    }
    return this._userRepository
  }

  /**
   * Refresh Token Repository (singleton)
   */
  get refreshTokenRepository(): IRefreshTokenRepository {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = KyselyRefreshTokenRepository.create({ db: this.database })
    }
    return this._refreshTokenRepository
  }

  /**
   * Token Factory (singleton)
   */
  get tokenFactory(): TokenFactory {
    if (!this._tokenFactory) {
      this._tokenFactory = TokenFactory.create({ env: this.env })
    }
    return this._tokenFactory
  }

  /**
   * Metrics Service (singleton)
   */
  get metricsService(): IMetricsService {
    if (!this._metricsService) {
      const metricsFactory = PrometheusMetricsFactory.create()
      this._metricsService = MetricsService.create({ metricsFactory })
    }
    return this._metricsService
  }

  /**
   * Password Hasher (singleton)
   */
  get passwordHasher(): IPasswordHasher {
    if (!this._passwordHasher) {
      this._passwordHasher = ScryptPasswordHasher.create()
    }
    return this._passwordHasher
  }

  /**
   * Create Team Use Case
   */
  get createTeamUseCase(): CreateTeamUseCase {
    if (!this._createTeamUseCase) {
      this._createTeamUseCase = CreateTeamUseCase.create({ teamRepository: this.teamRepository })
    }
    return this._createTeamUseCase
  }

  /**
   * Get Team Use Case
   */
  get getTeamUseCase(): GetTeamUseCase {
    if (!this._getTeamUseCase) {
      this._getTeamUseCase = GetTeamUseCase.create({ teamRepository: this.teamRepository })
    }
    return this._getTeamUseCase
  }

  /**
   * List Teams Use Case
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
   * Update Team Use Case
   */
  get updateTeamUseCase(): UpdateTeamUseCase {
    if (!this._updateTeamUseCase) {
      this._updateTeamUseCase = UpdateTeamUseCase.create({ teamRepository: this.teamRepository })
    }
    return this._updateTeamUseCase
  }

  /**
   * Delete Team Use Case
   */
  get deleteTeamUseCase(): DeleteTeamUseCase {
    if (!this._deleteTeamUseCase) {
      this._deleteTeamUseCase = DeleteTeamUseCase.create({ teamRepository: this.teamRepository })
    }
    return this._deleteTeamUseCase
  }

  /**
   * Login Use Case
   */
  get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = LoginUseCase.create({
        metricsService: this.metricsService,
        passwordHasher: this.passwordHasher,
        refreshTokenRepository: this.refreshTokenRepository,
        tokenFactory: this.tokenFactory,
        userRepository: this.userRepository,
      })
    }
    return this._loginUseCase
  }

  /**
   * Refresh Token Use Case
   */
  get refreshTokenUseCase(): RefreshTokenUseCase {
    if (!this._refreshTokenUseCase) {
      this._refreshTokenUseCase = RefreshTokenUseCase.create({
        refreshTokenRepository: this.refreshTokenRepository,
        tokenFactory: this.tokenFactory,
        userRepository: this.userRepository,
      })
    }
    return this._refreshTokenUseCase
  }

  /**
   * Logout Use Case
   */
  get logoutUseCase(): LogoutUseCase {
    if (!this._logoutUseCase) {
      this._logoutUseCase = LogoutUseCase.create({
        refreshTokenRepository: this.refreshTokenRepository,
      })
    }
    return this._logoutUseCase
  }

  /**
   * Create User Use Case
   */
  get createUserUseCase(): CreateUserUseCase {
    if (!this._createUserUseCase) {
      this._createUserUseCase = CreateUserUseCase.create({
        passwordHasher: this.passwordHasher,
        userRepository: this.userRepository,
      })
    }
    return this._createUserUseCase
  }

  /**
   * List Users Use Case
   */
  get listUsersUseCase(): ListUsersUseCase {
    if (!this._listUsersUseCase) {
      this._listUsersUseCase = ListUsersUseCase.create({
        metricsService: this.metricsService,
        userRepository: this.userRepository,
      })
    }
    return this._listUsersUseCase
  }

  /**
   * Close all resources
   *
   * Call this on application shutdown
   */
  async close(): Promise<void> {
    // Future: Close database connections, cleanup resources
  }
}

/**
 * Create and configure the dependency injection container
 */
export function createContainer(env: Env): Container {
  const database = createDatabase(env.DATABASE_URL)
  return new Container(env, database)
}
