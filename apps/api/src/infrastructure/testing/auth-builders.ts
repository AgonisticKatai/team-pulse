import { RefreshToken } from '@domain/models/RefreshToken.js'
import type { LoginDTO, RefreshTokenDTO } from '@team-pulse/shared/dtos'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'

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

/**
 * Builder for RefreshToken entity test data
 *
 * Creates a valid RefreshToken entity with sensible defaults
 * Throws if RefreshToken.create returns an error (which should never happen with valid defaults)
 *
 * @example
 * // Use defaults (valid, not expired token)
 * const token = buildRefreshToken()
 *
 * // Override specific fields
 * const token = buildRefreshToken({ token: 'custom-token' })
 *
 * // Create expired token
 * const expiredToken = buildRefreshToken({ expiresAt: TEST_CONSTANTS.pastDate })
 */
export function buildRefreshToken(
  overrides: { id?: string; token?: string; userId?: string; expiresAt?: Date; createdAt?: Date } = {},
): RefreshToken {
  const result = RefreshToken.create({
    createdAt: TEST_CONSTANTS.mockDate,
    expiresAt: TEST_CONSTANTS.futureDate,
    id: TEST_CONSTANTS.mockTokenId,
    token: TEST_CONSTANTS.auth.mockRefreshToken,
    userId: TEST_CONSTANTS.users.johnDoe.id,
    ...overrides,
  })

  if (!result.ok) {
    throw new Error(`Failed to build RefreshToken in test: ${result.error.message}`)
  }

  return result.value
}

/**
 * Builds a RefreshToken that is expired
 */
export function buildExpiredRefreshToken(overrides: { id?: string; token?: string; userId?: string; createdAt?: Date } = {}): RefreshToken {
  return buildRefreshToken({
    expiresAt: TEST_CONSTANTS.pastDate,
    token: TEST_CONSTANTS.auth.expiredRefreshToken,
    ...overrides,
  })
}

/**
 * Builds a RefreshToken that is valid (not expired)
 */
export function buildValidRefreshToken(overrides: { id?: string; token?: string; userId?: string; createdAt?: Date } = {}): RefreshToken {
  return buildRefreshToken({
    expiresAt: TEST_CONSTANTS.futureDate,
    token: TEST_CONSTANTS.auth.validRefreshToken,
    ...overrides,
  })
}
