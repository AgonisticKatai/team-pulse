import { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import { LoginUseCase } from '@features/auth/application/use-cases/login/LoginUseCase.js'
import { LogoutUseCase } from '@features/auth/application/use-cases/logout/LogoutUseCase.js'
import { RefreshTokenUseCase } from '@features/auth/application/use-cases/refresh-token/RefreshTokenUseCase.js'
import type { IRefreshTokenRepository } from '@features/auth/domain/repositories/refresh-token/IRefreshTokenRepository.js'
import { KyselyRefreshTokenRepository } from '@features/auth/infrastructure/repositories/refresh-token/KyselyRefreshTokenRepository.js'
import type { IUserRepository } from '@features/users/domain/repositories/user/IUserRepository.js'
import type { Env } from '@shared/config/environment/env.js'
import type { Database } from '@shared/database/connection/connection.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import type { IPasswordHasher } from '@shared/security/IPasswordHasher.js'

/**
 * Auth Feature Container
 *
 * Dependency Injection container for the Auth feature.
 * Manages all auth-specific dependencies and use cases.
 *
 * Architecture:
 * - Feature-scoped DI container
 * - Lazy initialization via getters
 * - Dependencies injected via constructor
 * - Implements Composition Root pattern
 *
 * Benefits:
 * - Auth feature is self-contained
 * - Clear dependency boundaries
 * - Easy to test (inject mocks)
 * - Can be worked on independently
 *
 * Shared Dependencies (injected):
 * - database: From shared container
 * - env: From shared container
 * - metricsService: From shared container
 * - passwordHasher: From shared container
 * - userRepository: From users container (via shared)
 *
 * Note: Cross-feature dependencies (userRepository) are injected
 * to avoid direct feature-to-feature coupling.
 */
export class AuthContainer {
  private _tokenFactory?: TokenFactory
  private _refreshTokenRepository?: IRefreshTokenRepository

  // Use Cases
  private _loginUseCase?: LoginUseCase
  private _refreshTokenUseCase?: RefreshTokenUseCase
  private _logoutUseCase?: LogoutUseCase

  constructor(
    private readonly database: Database,
    private readonly env: Env,
    private readonly metricsService: IMetricsService,
    private readonly passwordHasher: IPasswordHasher,
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Token Factory (singleton)
   * Creates and verifies JWT tokens
   */
  get tokenFactory(): TokenFactory {
    if (!this._tokenFactory) {
      this._tokenFactory = TokenFactory.create({ env: this.env })
    }
    return this._tokenFactory
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
   * Login Use Case (singleton)
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
   * Refresh Token Use Case (singleton)
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
   * Logout Use Case (singleton)
   */
  get logoutUseCase(): LogoutUseCase {
    if (!this._logoutUseCase) {
      this._logoutUseCase = LogoutUseCase.create({
        refreshTokenRepository: this.refreshTokenRepository,
      })
    }
    return this._logoutUseCase
  }
}
