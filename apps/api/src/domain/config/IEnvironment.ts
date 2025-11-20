/**
 * Environment configuration interface (Domain Layer)
 *
 * This interface defines the contract for environment configuration
 * needed by the Application layer, without coupling to Infrastructure.
 *
 * Architecture:
 * - Domain defines the INTERFACE (what is needed)
 * - Infrastructure provides the IMPLEMENTATION (how to get it)
 * - Application uses the INTERFACE (dependency injection)
 *
 * This respects hexagonal architecture:
 * - Domain stays pure (no dependencies on Infrastructure)
 * - Application depends on Domain abstractions
 * - Infrastructure implements Domain interfaces
 */
export interface IEnvironment {
  /**
   * Secret key for signing/verifying access tokens
   * Must be at least 32 characters long
   */
  // biome-ignore lint/style/useNamingConvention: Environment variables use SCREAMING_SNAKE_CASE convention
  JWT_SECRET: string

  /**
   * Secret key for signing/verifying refresh tokens
   * Must be at least 32 characters long
   */
  // biome-ignore lint/style/useNamingConvention: Environment variables use SCREAMING_SNAKE_CASE convention
  JWT_REFRESH_SECRET: string
}
