import { CreateUserUseCase } from '@features/users/application/use-cases/create-user/CreateUserUseCase.js'
import { ListUsersUseCase } from '@features/users/application/use-cases/list-users/ListUsersUseCase.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import { KyselyUserRepository } from '@features/users/infrastructure/repositories/user/KyselyUserRepository.js'
import type { Database } from '@shared/database/connection/connection.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import type { IPasswordHasher } from '@shared/security/IPasswordHasher.js'

/**
 * Users Feature Container
 *
 * Dependency Injection container for the Users feature.
 * Manages all user-specific dependencies and use cases.
 *
 * Architecture:
 * - Feature-scoped DI container
 * - Lazy initialization via getters
 * - Dependencies injected via constructor
 * - Implements Composition Root pattern
 *
 * Benefits:
 * - Users feature is self-contained
 * - Clear dependency boundaries
 * - Easy to test (inject mocks)
 * - Can be worked on independently
 *
 * Shared Dependencies (injected):
 * - database: From shared container
 * - passwordHasher: From shared security
 *
 * Public API:
 * - userRepository: Used by other features (e.g., auth for login)
 * - createUserUseCase: User creation
 * - listUsersUseCase: User listing
 */
export class UsersContainer {
  private _userRepository?: IUserRepository

  // Use Cases
  private _createUserUseCase?: CreateUserUseCase
  private _listUsersUseCase?: ListUsersUseCase

  constructor(
    private readonly database: Database,
    private readonly passwordHasher: IPasswordHasher,
    private readonly metricsService: IMetricsService,
  ) {}

  /**
   * User Repository (singleton)
   *
   * PUBLIC: Exposed to other features via container registry
   */
  get userRepository(): IUserRepository {
    if (!this._userRepository) {
      this._userRepository = KyselyUserRepository.create({ db: this.database })
    }
    return this._userRepository
  }

  /**
   * Create User Use Case (singleton)
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
   * List Users Use Case (singleton)
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
}
