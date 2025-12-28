import { AuthContainer } from '@features/auth/config/auth.container.js'
import { ScryptPasswordHasher } from '@features/auth/infrastructure/services/password-hasher/ScryptPasswordHasher.js'
import { TeamsContainer } from '@features/teams/config/teams.container.js'
import { UsersContainer } from '@features/users/config/users.container.js'
import type { Env } from '@shared/config/environment/env.js'
import { createDatabase, type Database } from '@shared/database/connection/connection.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import { PrometheusMetricsFactory } from '@shared/monitoring/prometheus/factory/PrometheusMetricsFactory.js'
import { MetricsService } from '@shared/monitoring/services/MetricsService.js'
import type { IPasswordHasher } from '@shared/security/IPasswordHasher.js'

/**
 * Main Application Container
 *
 * COMPOSITION ROOT implementing Screaming Architecture:
 * - Manages shared infrastructure (database, metrics, security)
 * - Composes feature-specific containers
 * - Coordinates cross-feature dependencies
 *
 * Architecture Pattern:
 * 1. Shared infrastructure initialized first
 * 2. Feature containers created with injected dependencies
 * 3. Cross-feature dependencies injected (e.g., userRepository → auth)
 * 4. Clean boundaries between features
 *
 * Why Feature Containers?
 * - Each feature is self-contained and modular
 * - Clear dependency boundaries
 * - Features can be developed independently
 * - Easy to test individual features
 * - Prevents feature coupling
 * - Supports feature extraction to separate services
 *
 * Benefits of Manual DI:
 * - Educational: explicit dependencies visible
 * - No magic: clear and traceable
 * - Type-safe: no reflection or decorators
 * - Zero runtime overhead
 * - Easy to evolve to framework later (TSyringe, InversifyJS)
 */
export class Container {
  // Shared Infrastructure
  private _database: Database
  private _metricsService?: IMetricsService
  private _passwordHasher?: IPasswordHasher

  // Feature Containers
  private _usersContainer?: UsersContainer
  private _authContainer?: AuthContainer
  private _teamsContainer?: TeamsContainer

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
   * Metrics Service (singleton)
   * Shared across all features for observability
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
   * Shared security infrastructure
   */
  get passwordHasher(): IPasswordHasher {
    if (!this._passwordHasher) {
      this._passwordHasher = ScryptPasswordHasher.create()
    }
    return this._passwordHasher
  }

  /**
   * Users Feature Container
   */
  get users(): UsersContainer {
    if (!this._usersContainer) {
      this._usersContainer = new UsersContainer(this.database, this.passwordHasher, this.metricsService)
    }
    return this._usersContainer
  }

  /**
   * Auth Feature Container
   */
  get auth(): AuthContainer {
    if (!this._authContainer) {
      this._authContainer = new AuthContainer(
        this.database,
        this.env,
        this.metricsService,
        this.passwordHasher,
        this.users.userRepository, // Cross-feature dependency injection
      )
    }
    return this._authContainer
  }

  /**
   * Teams Feature Container
   */
  get teams(): TeamsContainer {
    if (!this._teamsContainer) {
      this._teamsContainer = new TeamsContainer(this.database, this.metricsService)
    }
    return this._teamsContainer
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
