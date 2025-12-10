import type { CreateTeamDTO, CreateUserDTO, LoginDTO, RefreshTokenDTO } from '../dtos/index.js'
import { TEST_CONSTANTS } from './constants.js'

/**
 * DTO Builders for Testing
 *
 * Provides builder functions for creating test DTOs with sensible defaults.
 * These builders use TEST_CONSTANTS for consistency across tests.
 *
 * Note: Entity builders (buildUser, buildTeam, etc.) remain in apps/api
 * because they depend on domain models which are not in shared.
 */

// ============================================================================
// AUTH DTO BUILDERS
// ============================================================================

/**
 * Builder for LoginDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildLoginDTO()
 *
 * // Override specific fields
 * const dto = buildLoginDTO({ email: 'custom@example.com' })
 */
export function buildLoginDTO(overrides: Partial<LoginDTO> = {}): LoginDTO {
  return {
    email: TEST_CONSTANTS.users.johnDoe.email,
    password: TEST_CONSTANTS.users.johnDoe.password,
    ...overrides,
  }
}

/**
 * Builder for RefreshTokenDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildRefreshTokenDTO()
 *
 * // Override specific fields
 * const dto = buildRefreshTokenDTO({ refreshToken: 'custom-token' })
 */
export function buildRefreshTokenDTO(overrides: Partial<RefreshTokenDTO> = {}): RefreshTokenDTO {
  return {
    refreshToken: TEST_CONSTANTS.auth.mockRefreshToken,
    ...overrides,
  }
}

// ============================================================================
// USER DTO BUILDERS
// ============================================================================

/**
 * Builder for CreateUserDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildCreateUserDTO()
 *
 * // Override specific fields
 * const dto = buildCreateUserDTO({ email: 'custom@example.com' })
 */
export function buildCreateUserDTO(overrides: Partial<CreateUserDTO> = {}): CreateUserDTO {
  return {
    email: TEST_CONSTANTS.users.johnDoe.email,
    password: TEST_CONSTANTS.users.johnDoe.password,
    role: TEST_CONSTANTS.users.johnDoe.role,
    ...overrides,
  }
}

// ============================================================================
// TEAM DTO BUILDERS
// ============================================================================

/**
 * Builder for CreateTeamDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildCreateTeamDTO()
 *
 * // Override specific fields
 * const dto = buildCreateTeamDTO({ name: 'Custom Team' })
 */
export function buildCreateTeamDTO(overrides: Partial<CreateTeamDTO> = {}): CreateTeamDTO {
  return {
    name: TEST_CONSTANTS.teams.fcBarcelona.name,
    ...overrides,
  }
}
