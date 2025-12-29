import { faker } from '@faker-js/faker'
import { USER_ROLES } from '../domain/value-objects/user/role/UserRole.constants.js'
import type {
  CreateTeamDTO,
  CreateUserDTO,
  LoginDTO,
  LoginResponseDTO,
  RefreshTokenDTO,
  UserResponseDTO,
} from '../dtos/index.js'
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
// AUTH DTO BUILDERS - REQUESTS
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
// AUTH DTO BUILDERS - RESPONSES
// ============================================================================

/**
 * Builder for UserResponseDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildUserResponseDTO()
 *
 * // Override specific fields
 * const dto = buildUserResponseDTO({ email: 'custom@example.com' })
 */
export function buildUserResponseDTO(overrides: Partial<UserResponseDTO> = {}): UserResponseDTO {
  return {
    createdAt: faker.date.past().toISOString(),
    email: faker.internet.email(),
    id: faker.string.uuid(),
    role: faker.helpers.arrayElement(Object.values(USER_ROLES)),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  }
}

/**
 * Builder for LoginResponseDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildLoginResponseDTO()
 *
 * // Override specific fields
 * const dto = buildLoginResponseDTO({ accessToken: 'custom-token' })
 */
export function buildLoginResponseDTO(overrides: Partial<LoginResponseDTO> = {}): LoginResponseDTO {
  return {
    accessToken: faker.internet.jwt(),
    refreshToken: faker.internet.jwt(),
    user: buildUserResponseDTO(),
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
