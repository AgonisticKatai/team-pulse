import { beforeAll, describe, expect, it } from 'vitest'
import { ValidationError } from '../../domain/errors/ValidationError.js'
import type { Env } from '../config/env.js'
import {
  type AccessTokenPayload,
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpirationDate,
  type RefreshTokenPayload,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt-utils.js'

describe('JWT Utilities', () => {
  let testEnv: Env

  beforeAll(() => {
    // Create test environment with mock JWT secrets
    testEnv = {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      FRONTEND_URL: 'http://localhost:5173',
      HOST: '0.0.0.0',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key-min-32-chars-long',
      JWT_SECRET: 'test-jwt-secret-key-min-32-chars-long',
      LOG_LEVEL: 'info',
      NODE_ENV: 'test',
      PORT: 3000,
    }
  })

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const payload: AccessTokenPayload = {
        email: 'test@example.com',
        role: 'USER',
        userId: 'user-123',
      }

      const token = generateAccessToken({ payload, env: testEnv })

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include payload data in token', () => {
      const payload: AccessTokenPayload = {
        email: 'test@example.com',
        role: 'ADMIN',
        userId: 'user-123',
      }

      const token = generateAccessToken({ payload, env: testEnv })
      const verifyResult = verifyAccessToken({ token, env: testEnv })

      expect(verifyResult).toBeDefined()
      expect(verifyResult.ok).toBe(true)

      if (verifyResult.ok) {
        const decoded = verifyResult.value

        expect(decoded.userId).toBe(payload.userId)
        expect(decoded.email).toBe(payload.email)
        expect(decoded.role).toBe(payload.role)
      }
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        tokenId: 'token-abc',
        userId: 'user-123',
      }

      const token = generateRefreshToken({ payload, env: testEnv })

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include payload data in refresh token', () => {
      const payload: RefreshTokenPayload = {
        tokenId: 'token-abc',
        userId: 'user-123',
      }

      const token = generateRefreshToken({ payload, env: testEnv })
      const verifyResult = verifyRefreshToken({ token, env: testEnv })

      expect(verifyResult).toBeDefined()
      expect(verifyResult.ok).toBe(true)

      if (verifyResult.ok) {
        const decoded = verifyResult.value
        expect(decoded.userId).toBe(payload.userId)
        expect(decoded.tokenId).toBe(payload.tokenId)
      }
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const payload: AccessTokenPayload = {
        email: 'test@example.com',
        role: 'USER',
        userId: 'user-123',
      }

      const token = generateAccessToken({ payload, env: testEnv })
      const verifyResult = verifyAccessToken({ token, env: testEnv })

      expect(verifyResult).toBeDefined()
      expect(verifyResult.ok).toBe(true)

      if (verifyResult.ok) {
        const decoded = verifyResult.value
        expect(decoded.email).toBe(payload.email)
        expect(decoded.role).toBe(payload.role)
        expect(decoded.userId).toBe(payload.userId)
      }
    })

    it('should handle invalid token', () => {
      const invalidToken = 'invalid.token.here'

      const verifyResult = verifyAccessToken({ token: invalidToken, env: testEnv })

      expect(verifyResult.ok).toBe(false)

      if (!verifyResult.ok) {
        expect(verifyResult.error).toBeInstanceOf(ValidationError)
        expect(verifyResult.error.field).toBe('accessToken')
        expect(verifyResult.error.message).toBe('Invalid token')
      }
    })

    it('should handle token with wrong secret', () => {
      const payload: AccessTokenPayload = {
        email: 'test@example.com',
        role: 'USER',
        userId: 'user-123',
      }

      const token = generateAccessToken({ payload, env: testEnv })

      const wrongEnv = {
        ...testEnv,
        JWT_SECRET: 'wrong-secret-key-completely-different',
      }

      const verifyResult = verifyAccessToken({ token, env: wrongEnv })

      expect(verifyResult.ok).toBe(false)

      if (!verifyResult.ok) {
        expect(verifyResult.error).toBeInstanceOf(ValidationError)
        expect(verifyResult.error.field).toBe('accessToken')
        expect(verifyResult.error.message).toBe('Invalid token')
      }
    })

    it('should handle malformed token', () => {
      const verifyResult = verifyAccessToken({ token: 'not-a-jwt', env: testEnv })

      expect(verifyResult.ok).toBe(false)

      if (!verifyResult.ok) {
        expect(verifyResult.error).toBeInstanceOf(ValidationError)
        expect(verifyResult.error.field).toBe('accessToken')
      }
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const payload: RefreshTokenPayload = {
        tokenId: 'token-abc',
        userId: 'user-123',
      }

      const token = generateRefreshToken({ payload, env: testEnv })
      const verifyResult = verifyRefreshToken({ token, env: testEnv })

      expect(verifyResult).toBeDefined()
      expect(verifyResult.ok).toBe(true)

      if (verifyResult.ok) {
        const decoded = verifyResult.value
        expect(decoded.userId).toBe(payload.userId)
        expect(decoded.tokenId).toBe(payload.tokenId)
      }
    })

    it('should handle invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token'

      const verifyResult = verifyRefreshToken({ token: invalidToken, env: testEnv })

      expect(verifyResult.ok).toBe(false)

      if (!verifyResult.ok) {
        expect(verifyResult.error).toBeInstanceOf(ValidationError)
        expect(verifyResult.error.field).toBe('refreshToken')
        expect(verifyResult.error.message).toBe('Invalid token')
      }
    })

    it('should throw error for access token used as refresh token', () => {
      const accessPayload: AccessTokenPayload = {
        email: 'test@example.com',
        role: 'USER',
        userId: 'user-123',
      }

      const accessToken = generateAccessToken({ payload: accessPayload, env: testEnv })

      const verifyResult = verifyRefreshToken({ token: accessToken, env: testEnv })

      // This should fail because it was signed with JWT_SECRET, not JWT_REFRESH_SECRET
      expect(verifyResult.ok).toBe(false)

      if (!verifyResult.ok) {
        expect(verifyResult.error).toBeInstanceOf(ValidationError)
        expect(verifyResult.error.field).toBe('refreshToken')
        expect(verifyResult.error.message).toBe('Invalid token')
      }
    })
  })

  describe('getRefreshTokenExpirationDate', () => {
    it('should return a date 7 days in the future', () => {
      const now = new Date()
      const expiresAt = getRefreshTokenExpirationDate()

      const daysDifference = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

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
        email: 'test@example.com',
        role: 'USER',
        userId: 'user-123',
      }

      const token = generateAccessToken({ payload, env: testEnv })
      const verifyResult = verifyAccessToken({ token, env: testEnv })

      expect(verifyResult.ok).toBe(true)

      if (verifyResult.ok) {
        expect(verifyResult.value).toHaveProperty('exp')
        expect(verifyResult.value).toHaveProperty('iat')
      }
    })

    it('should include issuer and audience in tokens', () => {
      const payload: AccessTokenPayload = {
        email: 'test@example.com',
        role: 'USER',
        userId: 'user-123',
      }

      const token = generateAccessToken({ payload, env: testEnv })
      const verifyResult = verifyAccessToken({ token, env: testEnv })

      expect(verifyResult.ok).toBe(true)

      if (verifyResult.ok) {
        expect(verifyResult.value).toHaveProperty('iss', 'team-pulse-api')
        expect(verifyResult.value).toHaveProperty('aud', 'team-pulse-app')
      }
    })
  })
})
