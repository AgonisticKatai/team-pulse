import { TokenFactory } from '../../application/factories/TokenFactory.js'
import { CreateTeamUseCase } from '../../application/use-cases/CreateTeamUseCase.js'
import { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase.js'
import { DeleteTeamUseCase } from '../../application/use-cases/DeleteTeamUseCase.js'
import { GetTeamUseCase } from '../../application/use-cases/GetTeamUseCase.js'
import { ListTeamsUseCase } from '../../application/use-cases/ListTeamsUseCase.js'
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase.js'
import { LoginUseCase } from '../../application/use-cases/LoginUseCase.js'
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase.js'
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase.js'
import { UpdateTeamUseCase } from '../../application/use-cases/UpdateTeamUseCase.js'
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js'
import { createDatabase, type Database } from '../database/connection.js'
import { DrizzleRefreshTokenRepository } from '../database/repositories/DrizzleRefreshTokenRepository.js'
import { DrizzleTeamRepository } from '../database/repositories/DrizzleTeamRepository.js'
import { DrizzleUserRepository } from '../database/repositories/DrizzleUserRepository.js'
import type { Env } from './env.js'

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
  private _teamRepository?: ITeamRepository
  private _userRepository?: IUserRepository
  private _refreshTokenRepository?: IRefreshTokenRepository
  private _tokenFactory?: TokenFactory

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
      this._teamRepository = new DrizzleTeamRepository(this.database)
    }
    return this._teamRepository
  }

  /**
   * User Repository (singleton)
   */
  get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = new DrizzleUserRepository(this.database)
    }
    return this._userRepository
  }

  /**
   * Refresh Token Repository (singleton)
   */
  get refreshTokenRepository(): IRefreshTokenRepository {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = new DrizzleRefreshTokenRepository(this.database)
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
      this._listTeamsUseCase = ListTeamsUseCase.create({ teamRepository: this.teamRepository })
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
        tokenFactory: this.tokenFactory,
        refreshTokenRepository: this.refreshTokenRepository,
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
        tokenFactory: this.tokenFactory,
        refreshTokenRepository: this.refreshTokenRepository,
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
      this._createUserUseCase = CreateUserUseCase.create({ userRepository: this.userRepository })
    }
    return this._createUserUseCase
  }

  /**
   * List Users Use Case
   */
  get listUsersUseCase(): ListUsersUseCase {
    if (!this._listUsersUseCase) {
      this._listUsersUseCase = ListUsersUseCase.create({ userRepository: this.userRepository })
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
