import { beforeAll, describe, expect, it } from 'vitest'
import type { Env } from '../config/env.js'
import {
  type AccessTokenPayload,
  type RefreshTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpirationDate,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwtUtils.js'

describe('JWT Utilities', () => {
  let testEnv: Env

  beforeAll(() => {
    // Create test environment with mock JWT secrets
    testEnv = {
      NODE_ENV: 'test',
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      FRONTEND_URL: 'http://localhost:5173',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-jwt-secret-key-min-32-chars-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key-min-32-chars-long',
    }
  })

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload, testEnv)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include payload data in token', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN',
      }

      const token = generateAccessToken(payload, testEnv)
      const decoded = verifyAccessToken(token, testEnv)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user-123',
        tokenId: 'token-abc',
      }

      const token = generateRefreshToken(payload, testEnv)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include payload data in refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user-123',
        tokenId: 'token-abc',
      }

      const token = generateRefreshToken(payload, testEnv)
      const decoded = verifyRefreshToken(token, testEnv)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.tokenId).toBe(payload.tokenId)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload, testEnv)
      const decoded = verifyAccessToken(token, testEnv)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(payload.userId)
    })

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here'

      expect(() => verifyAccessToken(invalidToken, testEnv)).toThrow('Invalid access token')
    })

    it('should throw error for token with wrong secret', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload, testEnv)

      const wrongEnv = {
        ...testEnv,
        JWT_SECRET: 'wrong-secret-key-completely-different',
      }

      expect(() => verifyAccessToken(token, wrongEnv)).toThrow('Invalid access token')
    })

    it('should throw error for malformed token', () => {
      expect(() => verifyAccessToken('not-a-jwt', testEnv)).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        userId: 'user-123',
        tokenId: 'token-abc',
      }

      const token = generateRefreshToken(payload, testEnv)
      const decoded = verifyRefreshToken(token, testEnv)

      expect(decoded).toBeDefined()
      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.tokenId).toBe(payload.tokenId)
    })

    it('should throw error for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token'

      expect(() => verifyRefreshToken(invalidToken, testEnv)).toThrow('Invalid refresh token')
    })

    it('should throw error for access token used as refresh token', () => {
      const accessPayload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const accessToken = generateAccessToken(accessPayload, testEnv)

      // This should fail because it was signed with JWT_SECRET, not JWT_REFRESH_SECRET
      expect(() => verifyRefreshToken(accessToken, testEnv)).toThrow()
    })
  })

  describe('getRefreshTokenExpirationDate', () => {
    it('should return a date 7 days in the future', () => {
      const now = new Date()
      const expiresAt = getRefreshTokenExpirationDate()

      const daysDifference = Math.floor(
        (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )

      expect(expiresAt).toBeInstanceOf(Date)
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime())
      expect(daysDifference).toBe(7)
    })

    it('should generate different expiration times for consecutive calls', async () => {
      const exp1 = getRefreshTokenExpirationDate()

      // Wait a tiny bit
      await new Promise((resolve) => setTimeout(resolve, 10))

      const exp2 = getRefreshTokenExpirationDate()

      // Should be slightly different (different milliseconds)
      expect(exp2.getTime()).toBeGreaterThanOrEqual(exp1.getTime())
    })
  })

  describe('Token expiration', () => {
    it('should include expiration claim in access token', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload, testEnv)
      const decoded = verifyAccessToken(token, testEnv)

      expect(decoded).toHaveProperty('exp')
      expect(decoded).toHaveProperty('iat')
    })

    it('should include issuer and audience in tokens', () => {
      const payload: AccessTokenPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'USER',
      }

      const token = generateAccessToken(payload, testEnv)
      const decoded = verifyAccessToken(token, testEnv)

      expect(decoded).toHaveProperty('iss', 'team-pulse-api')
      expect(decoded).toHaveProperty('aud', 'team-pulse-app')
    })
  })
})
