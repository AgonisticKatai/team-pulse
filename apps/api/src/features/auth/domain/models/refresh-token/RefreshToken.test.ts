import { faker } from '@faker-js/faker'
import { buildRefreshToken } from '@shared/testing/auth-builders.js'
import { RefreshTokenId, UserId, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { describe, expect, it } from 'vitest'
import { RefreshToken } from './RefreshToken.js'

describe('RefreshToken Entity', () => {
  // ===========================================================================
  // 1. CREATE (Factory & Validation)
  // ===========================================================================
  describe('create', () => {
    it('should create a valid RefreshToken instance with full data', () => {
      const input = {
        expiresAt: faker.date.future(),
        id: RefreshTokenId.random(),
        token: faker.string.uuid(),
        userId: UserId.random(),
      }

      const result = RefreshToken.create(input)

      const refreshToken = expectSuccess(result)
      expect(refreshToken).toBeInstanceOf(RefreshToken)
      expect(refreshToken.id).toBe(input.id)
      expect(refreshToken.token).toBe(input.token)
      expect(refreshToken.userId).toBe(input.userId)
      expect(refreshToken.expiresAt).toBe(input.expiresAt)
      expect(refreshToken.createdAt).toBeInstanceOf(Date)
    })

    it('should fail if token is empty (Fail Fast)', () => {
      const input = {
        expiresAt: faker.date.future(),
        id: RefreshTokenId.random(),
        token: '',
        userId: UserId.random(),
      }

      const result = RefreshToken.create(input)

      expectErrorType({ errorType: ValidationError, result })
    })

    it('should fail if id is invalid', () => {
      const input = {
        expiresAt: faker.date.future(),
        id: 'invalid-id',
        token: faker.string.uuid(),
        userId: UserId.random(),
      }

      const result = RefreshToken.create(input)

      expectErrorType({ errorType: ValidationError, result })
    })

    it('should fail if userId is invalid', () => {
      const input = {
        expiresAt: faker.date.future(),
        id: RefreshTokenId.random(),
        token: faker.string.uuid(),
        userId: 'invalid-user-id',
      }

      const result = RefreshToken.create(input)

      expectErrorType({ errorType: ValidationError, result })
    })

    it('should create with provided timestamp', () => {
      const createdAt = faker.date.past()
      const input = {
        createdAt,
        expiresAt: faker.date.future(),
        id: RefreshTokenId.random(),
        token: faker.string.uuid(),
        userId: UserId.random(),
      }

      const result = RefreshToken.create(input)

      const refreshToken = expectSuccess(result)
      expect(refreshToken.createdAt).toBe(createdAt)
    })
  })

  // ===========================================================================
  // 2. BUSINESS LOGIC (Expiration)
  // ===========================================================================
  describe('isExpired', () => {
    it('should return false for future expiration', () => {
      const token = buildRefreshToken({ expiresAt: faker.date.future() })

      expect(token.isExpired()).toBe(false)
    })

    it('should return true for past expiration', () => {
      const token = buildRefreshToken({ expiresAt: faker.date.past() })

      expect(token.isExpired()).toBe(true)
    })
  })

  describe('isValid', () => {
    it('should return true for non-expired token', () => {
      const token = buildRefreshToken({ expiresAt: faker.date.future() })

      expect(token.isValid()).toBe(true)
    })

    it('should return false for expired token', () => {
      const token = buildRefreshToken({ expiresAt: faker.date.past() })

      expect(token.isValid()).toBe(false)
    })
  })

  // ===========================================================================
  // 3. SERIALIZATION
  // ===========================================================================
  describe('toPrimitives', () => {
    it('should return a plain object matching the internal state', () => {
      const token = buildRefreshToken()
      const primitives = token.toPrimitives()

      expect(primitives.id).toBe(token.id)
      expect(primitives.token).toBe(token.token)
      expect(primitives.userId).toBe(token.userId)
      expect(primitives.expiresAt).toBe(token.expiresAt)
      expect(primitives.createdAt).toBeInstanceOf(Date)
    })
  })
})
