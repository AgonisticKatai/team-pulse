import { LoginUseCase } from '@web/features/auth/application/index.js'
import { AuthRepository } from '@web/features/auth/infrastructure/index.js'
import { FetchHttpClient } from '@web/shared/infrastructure/http/FetchHttpClient.js'

/**
 * Dependency Injection Container
 *
 * Manual composition root for the application following hexagonal architecture principles.
 * This file is responsible for wiring all dependencies together at application startup.
 *
 * Architecture:
 * - Uses manual DI instead of reflection-based containers (InversifyJS, TSyringe)
 * - Factory functions provide type-safe, testable dependency creation
 * - Dependencies flow from infrastructure → repositories → use cases
 * - Only use cases are exported as the public API
 *
 * Benefits:
 * - Zero runtime overhead (no decorators, no reflect-metadata)
 * - Explicit dependency graph (easy to understand and debug)
 * - Type-safe with TypeScript inference
 * - Testable by exporting factory functions
 *
 * Lifetimes:
 * - All dependencies are singletons (created once at module load)
 * - If you need transient instances, call the factory functions directly
 */

// ============================================================================
// LAYER 1: Infrastructure
// ============================================================================
// Core infrastructure services that don't depend on domain logic

/**
 * Creates HTTP client for making API requests
 * Singleton instance shared across all repositories
 */
const createHttpClient = () =>
  new FetchHttpClient({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  })

// ============================================================================
// LAYER 2: Repositories (Adapters)
// ============================================================================
// Implement domain interfaces using infrastructure services

/**
 * Creates auth repository implementing IAuthRepository
 * Adapts HTTP client to domain port
 */
const createAuthRepository = (httpClient: ReturnType<typeof createHttpClient>) => AuthRepository.create({ httpClient })

// ============================================================================
// LAYER 3: Use Cases (Application Logic)
// ============================================================================
// Orchestrate domain logic using repository ports

/**
 * Creates login use case
 * Depends on IAuthRepository port (implementation detail injected)
 */
const createLoginUseCase = (authRepository: ReturnType<typeof createAuthRepository>) =>
  LoginUseCase.create({ authRepository })

// ============================================================================
// COMPOSITION ROOT
// ============================================================================
// Wire everything together (dependency graph construction)

// 1. Infrastructure layer
const httpClient = createHttpClient()

// 2. Repository layer (depends on infrastructure)
const authRepository = createAuthRepository(httpClient)

// 3. Application layer (depends on repositories)
// Only export use cases - repositories and infrastructure are internal details
export const loginUseCase = createLoginUseCase(authRepository)
