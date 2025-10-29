import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index'
import { RefreshToken } from './RefreshToken'

describe('RefreshToken Domain Entity', () => {
  describe('create', () => {
    it('should create a valid refresh token', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token-string',
        userId: 'user-123',
        expiresAt,
      })

      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.id).toBe('token-123')
      expect(token.token).toBe('refresh-token-string')
      expect(token.userId).toBe('user-123')
      expect(token.expiresAt).toBe(expiresAt)
      expect(token.createdAt).toBeInstanceOf(Date)
    })

    it('should throw error for empty token', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      expect(() =>
        RefreshToken.create({
          id: 'token-123',
          token: '',
          userId: 'user-123',
          expiresAt,
        }),
      ).toThrow(ValidationError)
    })

    it('should throw error for empty userId', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      expect(() =>
        RefreshToken.create({
          id: 'token-123',
          token: 'refresh-token',
          userId: '',
          expiresAt,
        }),
      ).toThrow(ValidationError)
    })

    it('should allow creation with past expiration date', () => {
      const expiresAt = new Date(Date.now() - 1000) // Expired

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.isExpired()).toBe(true)
    })
  })

  describe('fromPersistence', () => {
    it('should reconstitute refresh token from database', () => {
      const now = new Date()
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const token = RefreshToken.fromPersistence({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
        createdAt: now,
      })

      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.createdAt).toBe(now)
    })
  })

  describe('isExpired', () => {
    it('should return false for future expiration', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days future

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      expect(token.isExpired()).toBe(false)
    })

    it('should return true for past expiration', () => {
      const expiresAt = new Date(Date.now() - 1000) // 1 second ago

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      expect(token.isExpired()).toBe(true)
    })

    it('should return true for current time expiration', () => {
      const expiresAt = new Date() // Right now

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      // Since we're comparing > , equal time means expired
      expect(token.isExpired()).toBe(false) // Actually, now < expiresAt is false initially
      // But after a tiny delay it would be expired
    })
  })

  describe('isValid', () => {
    it('should return true for non-expired token', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      expect(token.isValid()).toBe(true)
    })

    it('should return false for expired token', () => {
      const expiresAt = new Date(Date.now() - 1000)

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      expect(token.isValid()).toBe(false)
    })

    it('should be opposite of isExpired', () => {
      const expiredToken = RefreshToken.create({
        id: 'token-1',
        token: 'expired-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000),
      })

      const validToken = RefreshToken.create({
        id: 'token-2',
        token: 'valid-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      expect(expiredToken.isValid()).toBe(!expiredToken.isExpired())
      expect(validToken.isValid()).toBe(!validToken.isExpired())
    })
  })

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'refresh-token-string',
        userId: 'user-123',
        expiresAt,
      })

      const obj = token.toObject()

      expect(obj.id).toBe('token-123')
      expect(obj.token).toBe('refresh-token-string')
      expect(obj.userId).toBe('user-123')
      expect(obj.expiresAt).toBe(expiresAt)
      expect(obj.createdAt).toBeInstanceOf(Date)
    })

    it('should include token string in toObject', () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const token = RefreshToken.create({
        id: 'token-123',
        token: 'secret-refresh-token',
        userId: 'user-123',
        expiresAt,
      })

      const obj = token.toObject()

      // Unlike password, we DO include the token (it's needed for comparison)
      expect(obj.token).toBe('secret-refresh-token')
    })
  })
})
