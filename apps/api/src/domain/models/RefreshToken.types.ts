import type { EntityId } from '../value-objects/index.js'

/**
 * RefreshToken Factory Input
 *
 * Data structure for creating a RefreshToken with primitive values.
 * The factory method will convert these to value objects.
 */
export interface RefreshTokenFactoryInput {
  id: string
  token: string
  userId: string
  expiresAt: Date
  createdAt?: Date
}

/**
 * RefreshToken Value Objects
 *
 * Validated value objects that compose the RefreshToken entity.
 * Used by fromValueObjects() to create entities without re-validation.
 */
export interface RefreshTokenValueObjects {
  id: EntityId
  token: string
  userId: EntityId
  expiresAt: Date
  createdAt: Date
}
