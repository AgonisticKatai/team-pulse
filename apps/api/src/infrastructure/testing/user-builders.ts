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
    email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
    password: TEST_CONSTANTS.USERS.JOHN_DOE.password,
    role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
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
  overrides: {
    id?: string
    email?: string
    passwordHash?: string
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    createdAt?: Date
    updatedAt?: Date
  } = {},
): User {
  const result = User.create({
    createdAt: TEST_CONSTANTS.MOCK_DATE,
    email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
    id: TEST_CONSTANTS.USERS.JOHN_DOE.id,
    passwordHash: TEST_CONSTANTS.USERS.JOHN_DOE.passwordHash,
    role: TEST_CONSTANTS.USERS.JOHN_DOE.role,
    updatedAt: TEST_CONSTANTS.MOCK_DATE,
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
  overrides: {
    id?: string
    email?: string
    passwordHash?: string
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    createdAt?: Date
    updatedAt?: Date
  } = {},
): User {
  return buildUser({
    id: TEST_CONSTANTS.EXISTING_USER_ID,
    ...overrides,
  })
}

/**
 * Builds a user with ADMIN role
 */
export function buildAdminUser(
  overrides: {
    id?: string
    email?: string
    passwordHash?: string
    createdAt?: Date
    updatedAt?: Date
  } = {},
): User {
  return buildUser({
    email: TEST_CONSTANTS.USERS.ADMIN_USER.email,
    id: TEST_CONSTANTS.USERS.ADMIN_USER.id,
    passwordHash: TEST_CONSTANTS.USERS.ADMIN_USER.passwordHash,
    role: TEST_CONSTANTS.USERS.ADMIN_USER.role,
    ...overrides,
  })
}

/**
 * Builds a user with SUPER_ADMIN role
 */
export function buildSuperAdminUser(
  overrides: {
    id?: string
    email?: string
    passwordHash?: string
    createdAt?: Date
    updatedAt?: Date
  } = {},
): User {
  return buildUser({
    email: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.email,
    id: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.id,
    passwordHash: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.passwordHash,
    role: TEST_CONSTANTS.USERS.SUPER_ADMIN_USER.role,
    ...overrides,
  })
}
