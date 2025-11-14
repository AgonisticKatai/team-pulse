import type { CreateUserDTO } from '@team-pulse/shared'
import { User } from '../../domain/models/User.js'
import { TEST_CONSTANTS } from './test-constants.js'

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

/**
 * Builder for User entity test data
 *
 * Creates a valid User entity with sensible defaults
 * Throws if User.create returns an error (which should never happen with valid defaults)
 *
 * @example
 * // Use defaults
 * const user = buildUser()
 *
 * // Override specific fields
 * const user = buildUser({ email: 'custom@example.com' })
 */
export function buildUser(
  overrides: { id?: string; email?: string; passwordHash?: string; role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'; createdAt?: Date; updatedAt?: Date } = {},
): User {
  const result = User.create({
    createdAt: TEST_CONSTANTS.mockDate,
    email: TEST_CONSTANTS.users.johnDoe.email,
    id: TEST_CONSTANTS.users.johnDoe.id,
    passwordHash: TEST_CONSTANTS.users.johnDoe.passwordHash,
    role: TEST_CONSTANTS.users.johnDoe.role,
    updatedAt: TEST_CONSTANTS.mockDate,
    ...overrides,
  })

  if (!result.ok) {
    throw new Error(`Failed to build User in test: ${result.error.message}`)
  }

  return result.value
}

/**
 * Builds an "existing" user (with a different ID to simulate conflicts)
 */
export function buildExistingUser(
  overrides: { id?: string; email?: string; passwordHash?: string; role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'; createdAt?: Date; updatedAt?: Date } = {},
): User {
  return buildUser({
    id: TEST_CONSTANTS.existingUserId,
    ...overrides,
  })
}

/**
 * Builds a user with ADMIN role
 */
export function buildAdminUser(overrides: { id?: string; email?: string; passwordHash?: string; createdAt?: Date; updatedAt?: Date } = {}): User {
  return buildUser({
    email: TEST_CONSTANTS.users.adminUser.email,
    id: TEST_CONSTANTS.users.adminUser.id,
    passwordHash: TEST_CONSTANTS.users.adminUser.passwordHash,
    role: TEST_CONSTANTS.users.adminUser.role,
    ...overrides,
  })
}

/**
 * Builds a user with SUPER_ADMIN role
 */
export function buildSuperAdminUser(
  overrides: { id?: string; email?: string; passwordHash?: string; createdAt?: Date; updatedAt?: Date } = {},
): User {
  return buildUser({
    email: TEST_CONSTANTS.users.superAdminUser.email,
    id: TEST_CONSTANTS.users.superAdminUser.id,
    passwordHash: TEST_CONSTANTS.users.superAdminUser.passwordHash,
    role: TEST_CONSTANTS.users.superAdminUser.role,
    ...overrides,
  })
}
