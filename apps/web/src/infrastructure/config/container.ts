/**
 * Dependency Injection Container
 *
 * Centralizes the creation and wiring of all dependencies.
 * Following the Composition Root pattern from hexagonal architecture.
 *
 * Benefits:
 * - Single place to configure all dependencies
 * - Easy to test (can inject mocks)
 * - Type-safe dependency injection
 * - No framework magic, explicit wiring
 */

import {
  CreateTeamUseCase,
  CreateUserUseCase,
  DeleteTeamUseCase,
  GetTeamUseCase,
  ListTeamsUseCase,
  ListUsersUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  UpdateTeamUseCase,
} from '../../application/use-cases'
import type {
  IAuthRepository,
  IStorageRepository,
  ITeamRepository,
  IUserRepository,
} from '../../domain/repositories'
import { createApiClient } from '../api/api-client'
import { createAuthApiClient } from '../api/auth-api-client'
import { createTeamApiClient } from '../api/team-api-client'
import { ApiAuthRepository, ApiTeamRepository, ApiUserRepository } from '../repositories'
import { LocalStorageService } from '../storage'

/**
 * Application Container
 * Contains all application dependencies
 */
export interface AppContainer {
  // Infrastructure - API Clients
  apiClient: ReturnType<typeof createApiClient>
  authApiClient: ReturnType<typeof createAuthApiClient>
  teamApiClient: ReturnType<typeof createTeamApiClient>

  // Infrastructure - Repositories
  authRepository: IAuthRepository
  teamRepository: ITeamRepository
  userRepository: IUserRepository
  storageRepository: IStorageRepository

  // Application - Use Cases - Auth
  loginUseCase: LoginUseCase
  logoutUseCase: LogoutUseCase
  refreshTokenUseCase: RefreshTokenUseCase

  // Application - Use Cases - Teams
  listTeamsUseCase: ListTeamsUseCase
  getTeamUseCase: GetTeamUseCase
  createTeamUseCase: CreateTeamUseCase
  updateTeamUseCase: UpdateTeamUseCase
  deleteTeamUseCase: DeleteTeamUseCase

  // Application - Use Cases - Users
  listUsersUseCase: ListUsersUseCase
  createUserUseCase: CreateUserUseCase
}

/**
 * Create and configure the application container
 * This is the composition root of the application
 */
export function createContainer(): AppContainer {
  // === Infrastructure Layer ===

  // Create API clients
  const apiClient = createApiClient()
  const authApiClient = createAuthApiClient(apiClient)
  const teamApiClient = createTeamApiClient(apiClient)

  // Create repositories (adapters)
  const authRepository = new ApiAuthRepository(authApiClient)
  const teamRepository = new ApiTeamRepository(teamApiClient)
  const userRepository = new ApiUserRepository(apiClient)
  const storageRepository = new LocalStorageService()

  // === Application Layer ===

  // Create use cases with injected dependencies

  // Auth use cases
  const loginUseCase = new LoginUseCase(authRepository)
  const logoutUseCase = new LogoutUseCase(authRepository)
  const refreshTokenUseCase = new RefreshTokenUseCase(authRepository)

  // Team use cases
  const listTeamsUseCase = new ListTeamsUseCase(teamRepository)
  const getTeamUseCase = new GetTeamUseCase(teamRepository)
  const createTeamUseCase = new CreateTeamUseCase(teamRepository)
  const updateTeamUseCase = new UpdateTeamUseCase(teamRepository)
  const deleteTeamUseCase = new DeleteTeamUseCase(teamRepository)

  // User use cases
  const listUsersUseCase = new ListUsersUseCase(userRepository)
  const createUserUseCase = new CreateUserUseCase(userRepository)

  // Return container with all dependencies
  return {
    // Infrastructure
    apiClient,
    authApiClient,

    // Repositories
    authRepository,

    // Use Cases - Auth
    createTeamUseCase,
    createUserUseCase,
    deleteTeamUseCase,
    getTeamUseCase,
    listTeamsUseCase,

    // Use Cases - Teams
    listUsersUseCase,
    loginUseCase,

    // Use Cases - Users
    logoutUseCase,
    refreshTokenUseCase,
    storageRepository,
    teamApiClient,
    teamRepository,
    updateTeamUseCase,
    userRepository,
  }
}

/**
 * Global container instance (singleton)
 * In a real application, you might want to use React Context to provide this
 */
let containerInstance: AppContainer | null = null

/**
 * Get the global container instance
 * Creates it if it doesn't exist (lazy initialization)
 */
export function getContainer(): AppContainer {
  if (!containerInstance) {
    containerInstance = createContainer()
  }
  return containerInstance
}

/**
 * Reset the container (useful for testing)
 */
export function resetContainer(): void {
  containerInstance = null
}
