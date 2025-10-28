import { CreateTeamUseCase } from '../../application/use-cases/CreateTeamUseCase.js'
import { DeleteTeamUseCase } from '../../application/use-cases/DeleteTeamUseCase.js'
import { GetTeamUseCase } from '../../application/use-cases/GetTeamUseCase.js'
import { ListTeamsUseCase } from '../../application/use-cases/ListTeamsUseCase.js'
import { UpdateTeamUseCase } from '../../application/use-cases/UpdateTeamUseCase.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { type Database, createDatabase } from '../database/connection.js'
import { DrizzleTeamRepository } from '../database/repositories/DrizzleTeamRepository.js'
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

  // Use Cases
  private _createTeamUseCase?: CreateTeamUseCase
  private _getTeamUseCase?: GetTeamUseCase
  private _listTeamsUseCase?: ListTeamsUseCase
  private _updateTeamUseCase?: UpdateTeamUseCase
  private _deleteTeamUseCase?: DeleteTeamUseCase

  constructor(_env: Env, database: Database) {
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
   * Create Team Use Case
   */
  get createTeamUseCase(): CreateTeamUseCase {
    if (!this._createTeamUseCase) {
      this._createTeamUseCase = new CreateTeamUseCase(this.teamRepository)
    }
    return this._createTeamUseCase
  }

  /**
   * Get Team Use Case
   */
  get getTeamUseCase(): GetTeamUseCase {
    if (!this._getTeamUseCase) {
      this._getTeamUseCase = new GetTeamUseCase(this.teamRepository)
    }
    return this._getTeamUseCase
  }

  /**
   * List Teams Use Case
   */
  get listTeamsUseCase(): ListTeamsUseCase {
    if (!this._listTeamsUseCase) {
      this._listTeamsUseCase = new ListTeamsUseCase(this.teamRepository)
    }
    return this._listTeamsUseCase
  }

  /**
   * Update Team Use Case
   */
  get updateTeamUseCase(): UpdateTeamUseCase {
    if (!this._updateTeamUseCase) {
      this._updateTeamUseCase = new UpdateTeamUseCase(this.teamRepository)
    }
    return this._updateTeamUseCase
  }

  /**
   * Delete Team Use Case
   */
  get deleteTeamUseCase(): DeleteTeamUseCase {
    if (!this._deleteTeamUseCase) {
      this._deleteTeamUseCase = new DeleteTeamUseCase(this.teamRepository)
    }
    return this._deleteTeamUseCase
  }

  /**
   * Close all resources
   *
   * Call this on application shutdown
   */
  async close(): Promise<void> {
    // Future: Close database connections, cleanup resources
    // For now, SQLite auto-closes
  }
}

/**
 * Create and configure the dependency injection container
 */
export async function createContainer(env: Env): Promise<Container> {
  const database = await createDatabase(env.DATABASE_URL)
  return new Container(env, database)
}
