import { RefreshToken } from '@domain/models/RefreshToken.js'
import { faker } from '@faker-js/faker'
import { IdUtils, type RefreshTokenId, type UserId } from '@team-pulse/shared/domain/ids'
import type { LoginDTO, RefreshTokenDTO } from '@team-pulse/shared/dtos'

// ==========================================
// DTO BUILDERS (Simple data containers)
// ==========================================

/**
 * Builder for LoginDTO
 */
export function buildLoginDTO(overrides: Partial<LoginDTO> = {}): LoginDTO {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    ...overrides,
  }
}

/**
 * Builder for RefreshTokenDTO
 * NOTE: Returns the raw string token (the "key"), not the entity ID.
 */
export function buildRefreshTokenDTO(overrides: Partial<RefreshTokenDTO> = {}): RefreshTokenDTO {
  return {
    refreshToken: faker.string.uuid(), // Generates a random opaque string
    ...overrides,
  }
}

// ==========================================
// ENTITY BUILDERS (Domain logic)
// ==========================================

// 1. PRIMITIVES DEFINITION
// Defines the raw shape of the data needed to create the entity
type RefreshTokenPrimitives = {
  id: string
  token: string
  userId: string
  expiresAt: Date
  createdAt: Date
}

// 2. DATA GENERATOR
// Pure function, no side effects, just returns random data
const generateRandomTokenData = (): RefreshTokenPrimitives => ({
  createdAt: new Date(),
  expiresAt: faker.date.future(),
  id: IdUtils.generate<RefreshTokenId>(),
  token: faker.string.uuid(),
  userId: IdUtils.generate<UserId>(),
})

// 3. MAIN BUILDER
export function buildRefreshToken(overrides: Partial<RefreshTokenPrimitives> = {}): RefreshToken {
  // A. Merge defaults with overrides (Spread Pattern)
  const raw = {
    ...generateRandomTokenData(),
    ...overrides,
  }

  // B. Domain Instantiation
  // Convert primitives to Domain Types here
  const result = RefreshToken.create({
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    id: IdUtils.toId<RefreshTokenId>(raw.id), // Ensure Brand Safety
    token: raw.token,
    userId: IdUtils.toId<UserId>(raw.userId), // Ensure Brand Safety
  })

  if (!result.ok) {
    throw new Error(`Failed to build RefreshToken in test: ${result.error.message}`)
  }

  return result.value
}

// ==========================================
// SPECIALIZED WRAPPERS
// ==========================================

/**
 * Builds a RefreshToken that is already expired
 */
export function buildExpiredRefreshToken(overrides: Partial<RefreshTokenPrimitives> = {}): RefreshToken {
  return buildRefreshToken({
    expiresAt: faker.date.past(), // Override default future date with a past one
    ...overrides,
  })
}

/**
 * Builds a RefreshToken that is valid (explicitly future expiration)
 */
export function buildValidRefreshToken(overrides: Partial<RefreshTokenPrimitives> = {}): RefreshToken {
  return buildRefreshToken({
    expiresAt: faker.date.future(),
    ...overrides,
  })
}
