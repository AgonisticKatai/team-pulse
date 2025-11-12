import type { LoginDTO, RefreshTokenDTO } from '@team-pulse/shared'
import { RefreshToken } from '../../domain/models/RefreshToken.js'
import { TEST_CONSTANTS } from './test-constants.js'

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
    email: TEST_CONSTANTS.USERS.JOHN_DOE.email,
    password: TEST_CONSTANTS.USERS.JOHN_DOE.password,
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
    refreshToken: TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN,
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
 * const expiredToken = buildRefreshToken({ expiresAt: TEST_CONSTANTS.PAST_DATE })
 */
export function buildRefreshToken(
  overrides: {
    id?: string
    token?: string
    userId?: string
    expiresAt?: Date
    createdAt?: Date
  } = {},
): RefreshToken {
  const result = RefreshToken.create({
    createdAt: TEST_CONSTANTS.MOCK_DATE,
    expiresAt: TEST_CONSTANTS.FUTURE_DATE,
    id: TEST_CONSTANTS.MOCK_TOKEN_ID,
    token: TEST_CONSTANTS.AUTH.MOCK_REFRESH_TOKEN,
    userId: TEST_CONSTANTS.USERS.JOHN_DOE.id,
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
export function buildExpiredRefreshToken(
  overrides: { id?: string; token?: string; userId?: string; createdAt?: Date } = {},
): RefreshToken {
  return buildRefreshToken({
    expiresAt: TEST_CONSTANTS.PAST_DATE,
    token: TEST_CONSTANTS.AUTH.EXPIRED_REFRESH_TOKEN,
    ...overrides,
  })
}

/**
 * Builds a RefreshToken that is valid (not expired)
 */
export function buildValidRefreshToken(
  overrides: { id?: string; token?: string; userId?: string; createdAt?: Date } = {},
): RefreshToken {
  return buildRefreshToken({
    expiresAt: TEST_CONSTANTS.FUTURE_DATE,
    token: TEST_CONSTANTS.AUTH.VALID_REFRESH_TOKEN,
    ...overrides,
  })
}
