import { sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../../app'
import { User } from '../../../domain/models/User'
import { hashPassword } from '../../auth/passwordUtils'
import type { Container } from '../../config/container'

describe('Authentication Endpoints', () => {
  let app: FastifyInstance
  let container: Container
  let testUserPassword: string
  let testAdminPassword: string

  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars-long'
  })

  beforeEach(async () => {
    const result = await buildApp()
    app = result.app
    container = result.container

    // Clean database before creating test users
    try {
      await container.database.execute(
        sql`TRUNCATE TABLE users, refresh_tokens, teams RESTART IDENTITY CASCADE`,
      )
    } catch (error) {
      // Ignore errors (tables might not exist yet)
    }

    // Create test users
    testUserPassword = 'UserPassword123!'
    testAdminPassword = 'AdminPassword123!'

    const userPasswordHash = await hashPassword(testUserPassword)
    const adminPasswordHash = await hashPassword(testAdminPassword)

    const testUser = User.create({
      id: 'test-user-id',
      email: 'user@test.com',
      passwordHash: userPasswordHash,
      role: 'USER',
    })

    const testAdmin = User.create({
      id: 'test-admin-id',
      email: 'admin@test.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    })

    await container.userRepository.save(testUser)
    await container.userRepository.save(testAdmin)
  })

  afterEach(async () => {
    if (container) {
      await container.close()
    }
    if (app) {
      await app.close()
    }
  })

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'user@test.com',
          password: testUserPassword,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data).toHaveProperty('refreshToken')
      expect(body.data.user).toMatchObject({
        email: 'user@test.com',
        role: 'USER',
      })
      expect(body.data.user).not.toHaveProperty('passwordHash')
    })

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@test.com',
          password: 'SomePassword123!',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTHENTICATION_ERROR')
      expect(body.error.message).toBe('Invalid email or password')
    })

    it('should fail with invalid password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'user@test.com',
          password: 'WrongPassword123!',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should fail with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'not-an-email',
          password: testUserPassword,
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should fail with missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          password: testUserPassword,
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should fail with missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'user@test.com',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should login ADMIN users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'admin@test.com',
          password: testAdminPassword,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.user.role).toBe('ADMIN')
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'user@test.com',
          password: testUserPassword,
        },
      })

      const loginBody = JSON.parse(loginResponse.body)
      const refreshToken = loginBody.data.refreshToken

      // Now use refresh token
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken,
        },
      })

      expect(refreshResponse.statusCode).toBe(200)
      const refreshBody = JSON.parse(refreshResponse.body)
      expect(refreshBody.success).toBe(true)
      expect(refreshBody.data).toHaveProperty('accessToken')
      // Refresh endpoint returns a new accessToken (and optionally a new refreshToken with rotation)
    })

    it('should fail with invalid refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken: 'invalid.token.here',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should fail with missing refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return current user info with valid JWT', async () => {
      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'user@test.com',
          password: testUserPassword,
        },
      })

      const loginBody = JSON.parse(loginResponse.body)
      const accessToken = loginBody.data.accessToken

      // Get current user
      const meResponse = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

      expect(meResponse.statusCode).toBe(200)
      const body = JSON.parse(meResponse.body)
      expect(body.success).toBe(true)
      expect(body.data).toMatchObject({
        email: 'user@test.com',
        role: 'USER',
      })
    })

    it('should fail without JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('should fail with invalid JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should fail with malformed authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: 'InvalidFormat token',
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.message).toContain('Bearer')
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should logout and invalidate refresh token', async () => {
      // Login first
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'user@test.com',
          password: testUserPassword,
        },
      })

      const loginBody = JSON.parse(loginResponse.body)
      const accessToken = loginBody.data.accessToken
      const refreshToken = loginBody.data.refreshToken

      // Logout
      const logoutResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        payload: {
          refreshToken,
        },
      })

      expect(logoutResponse.statusCode).toBe(204)

      // Try to use refresh token after logout (should fail)
      const refreshResponse = await app.inject({
        method: 'POST',
        url: '/api/auth/refresh',
        payload: {
          refreshToken,
        },
      })

      expect(refreshResponse.statusCode).toBe(401)
    })

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        payload: {
          refreshToken: 'some-token',
        },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
