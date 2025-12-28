import { buildApp } from '@core/app/app.js'
import type { Container } from '@core/container/container.js'
import { ScryptPasswordHasher } from '@features/auth/infrastructure/services/password-hasher/ScryptPasswordHasher.js'
import { User } from '@features/users/domain/models/user/User.js'
import type { Database } from '@shared/database/connection/connection.js'
import { setupTestEnvironment } from '@shared/testing/helpers/test-helpers.js'
import { USER_ROLES } from '@team-pulse/shared'
import { expectSuccess } from '@team-pulse/shared/testing'
import type { FastifyInstance } from 'fastify'
import { sql } from 'kysely'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Authentication Endpoints', () => {
  let app: FastifyInstance
  let container: Container
  let db: Database
  let testUserPassword: string
  let testAdminPassword: string
  let testUserEmail: string
  let testAdminEmail: string
  let passwordHasher: ScryptPasswordHasher

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    // Get database instance for test isolation
    db = getDatabase()
    passwordHasher = ScryptPasswordHasher.create({ cost: 1024 }) // Low cost for fast tests
  })

  beforeEach(async () => {
    // Build app with test container database
    // Schema is already created by setupTestContainer() using Kysely migrations
    const result = await buildApp()
    app = result.app
    container = result.container

    // Clean database for test isolation
    await sql`TRUNCATE TABLE users, refresh_tokens, teams RESTART IDENTITY CASCADE`.execute(db)

    // Create test users (fixed emails since we have isolated container)
    testUserEmail = 'user@test.com'
    testAdminEmail = 'admin@test.com'
    testUserPassword = 'UserPassword123!'
    testAdminPassword = 'AdminPassword123!'

    const userPasswordHash = expectSuccess(await passwordHasher.hash({ password: testUserPassword }))
    const adminPasswordHash = expectSuccess(await passwordHasher.hash({ password: testAdminPassword }))

    const testUser = expectSuccess(
      User.create({
        email: testUserEmail,
        id: '550e8400-e29b-41d4-a716-446655490001',
        passwordHash: userPasswordHash,
        role: USER_ROLES.GUEST,
      }),
    )

    const testAdmin = expectSuccess(
      User.create({
        email: testAdminEmail,
        id: '550e8400-e29b-41d4-a716-446655490002',
        passwordHash: adminPasswordHash,
        role: USER_ROLES.ADMIN,
      }),
    )

    await container.users.userRepository.save({ user: testUser })
    await container.users.userRepository.save({ user: testAdmin })
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
        payload: {
          email: testUserEmail,
          password: testUserPassword,
        },
        url: '/api/auth/login',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data).toHaveProperty('refreshToken')
      expect(body.data.user).toMatchObject({
        email: testUserEmail,
        role: USER_ROLES.GUEST,
      })
      expect(body.data.user).not.toHaveProperty('passwordHash')
    })

    it('should fail with invalid email', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          email: 'nonexistent@test.com',
          password: 'SomePassword123!',
        },
        url: '/api/auth/login',
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
        payload: {
          email: testUserEmail,
          password: 'WrongPassword123!',
        },
        url: '/api/auth/login',
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should fail with invalid email format', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          email: 'not-an-email',
          password: testUserPassword,
        },
        url: '/api/auth/login',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should fail with missing email', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          password: testUserPassword,
        },
        url: '/api/auth/login',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should fail with missing password', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          email: testUserEmail,
        },
        url: '/api/auth/login',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should login ADMIN users', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          email: testAdminEmail,
          password: testAdminPassword,
        },
        url: '/api/auth/login',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.user.role).toBe(USER_ROLES.ADMIN)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await app.inject({
        method: 'POST',
        payload: {
          email: testUserEmail,
          password: testUserPassword,
        },
        url: '/api/auth/login',
      })

      const loginBody = JSON.parse(loginResponse.body)
      const refreshToken = loginBody.data.refreshToken

      // Now use refresh token
      const refreshResponse = await app.inject({
        method: 'POST',
        payload: {
          refreshToken,
        },
        url: '/api/auth/refresh',
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
        payload: {
          refreshToken: 'invalid.token.here',
        },
        url: '/api/auth/refresh',
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should fail with missing refresh token', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {},
        url: '/api/auth/refresh',
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
        payload: {
          email: testUserEmail,
          password: testUserPassword,
        },
        url: '/api/auth/login',
      })

      const loginBody = JSON.parse(loginResponse.body)
      const accessToken = loginBody.data.accessToken

      // Get current user
      const meResponse = await app.inject({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        method: 'GET',
        url: '/api/auth/me',
      })

      expect(meResponse.statusCode).toBe(200)
      const body = JSON.parse(meResponse.body)
      expect(body.success).toBe(true)
      expect(body.data).toMatchObject({
        email: testUserEmail,
        role: USER_ROLES.GUEST,
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
        headers: {
          authorization: 'Bearer invalid.token.here',
        },
        method: 'GET',
        url: '/api/auth/me',
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should fail with malformed authorization header', async () => {
      const response = await app.inject({
        headers: {
          authorization: 'InvalidFormat token',
        },
        method: 'GET',
        url: '/api/auth/me',
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
        payload: {
          email: testUserEmail,
          password: testUserPassword,
        },
        url: '/api/auth/login',
      })

      const loginBody = JSON.parse(loginResponse.body)
      const accessToken = loginBody.data.accessToken
      const refreshToken = loginBody.data.refreshToken

      // Logout
      const logoutResponse = await app.inject({
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
        method: 'POST',
        payload: {
          refreshToken,
        },
        url: '/api/auth/logout',
      })

      expect(logoutResponse.statusCode).toBe(204)

      // Try to use refresh token after logout (should fail)
      const refreshResponse = await app.inject({
        method: 'POST',
        payload: {
          refreshToken,
        },
        url: '/api/auth/refresh',
      })

      expect(refreshResponse.statusCode).toBe(401)
    })

    it('should fail without authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        payload: {
          refreshToken: 'some-token',
        },
        url: '/api/auth/logout',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
