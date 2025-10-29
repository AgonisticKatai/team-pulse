import { sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../../app'
import { User } from '../../../domain/models/User'
import { hashPassword } from '../../auth/passwordUtils'
import type { Container } from '../../config/container'
import type { Database } from '../../database/connection'
import { setupTestContainer } from '../../testing/testContainers'

describe('Protected Routes and RBAC', () => {
  let app: FastifyInstance
  let container: Container
  let db: Database
  let cleanup: () => Promise<void>
  let superAdminToken: string
  let adminToken: string
  let userToken: string

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long'
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-chars-long'

    // Setup isolated PostgreSQL container for this test suite
    const result = await setupTestContainer()
    db = result.db
    cleanup = result.cleanup

    // Set DATABASE_URL to use the test container
    process.env.DATABASE_URL = result.container.getConnectionUri()
  }, 120_000) // 2 minute timeout for container startup

  beforeEach(async () => {
    // Build app with test container database
    const result = await buildApp()
    app = result.app
    container = result.container

    // Clean database for test isolation
    await db.execute(sql`TRUNCATE TABLE users, refresh_tokens, teams RESTART IDENTITY CASCADE`)

    // Create test users with different roles (fixed emails since we have isolated container)
    const superAdminEmail = 'superadmin@test.com'
    const adminEmail = 'admin@test.com'
    const userEmail = 'user@test.com'

    const superAdmin = User.create({
      id: 'super-admin',
      email: superAdminEmail,
      passwordHash: await hashPassword('SuperAdmin123!'),
      role: 'SUPER_ADMIN',
    })

    const admin = User.create({
      id: 'admin',
      email: adminEmail,
      passwordHash: await hashPassword('Admin123!'),
      role: 'ADMIN',
    })

    const user = User.create({
      id: 'user',
      email: userEmail,
      passwordHash: await hashPassword('User123!'),
      role: 'USER',
    })

    await container.userRepository.save(superAdmin)
    await container.userRepository.save(admin)
    await container.userRepository.save(user)

    // Get tokens for each user
    const superAdminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: superAdminEmail, password: 'SuperAdmin123!' },
    })
    superAdminToken = JSON.parse(superAdminLogin.body).data.accessToken

    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: adminEmail, password: 'Admin123!' },
    })
    adminToken = JSON.parse(adminLogin.body).data.accessToken

    const userLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: userEmail, password: 'User123!' },
    })
    userToken = JSON.parse(userLogin.body).data.accessToken
  })

  afterEach(async () => {
    if (container) {
      await container.close()
    }
    if (app) {
      await app.close()
    }
  })

  afterAll(async () => {
    // Stop the test container
    if (cleanup) {
      await cleanup()
    }
  })

  describe('POST /api/users - Create User', () => {
    it('should allow SUPER_ADMIN to create users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        payload: {
          email: 'newuser@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.email).toBe('newuser@test.com')
      expect(body.data.role).toBe('USER')
    })

    it('should allow ADMIN to create users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          email: 'newuser2@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should NOT allow USER to create users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        payload: {
          email: 'newuser3@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error.code).toBe('FORBIDDEN')
      expect(body.error.message).toContain('ADMIN')
      expect(body.error.message).toContain('SUPER_ADMIN')
    })

    it('should NOT allow unauthenticated users to create users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          email: 'newuser4@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
      })

      expect(response.statusCode).toBe(401)
    })

    it('should validate password strength', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        payload: {
          email: 'weak@test.com',
          password: 'weak', // Too weak
          role: 'USER',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should prevent duplicate emails', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        payload: {
          email: 'duplicate@test.com',
          password: 'Password123!',
          role: 'USER',
        },
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        payload: {
          email: 'duplicate@test.com',
          password: 'Password123!',
          role: 'USER',
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('already exists')
    })
  })

  describe('GET /api/users - List Users', () => {
    it('should allow SUPER_ADMIN to list users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.users).toBeInstanceOf(Array)
      expect(body.data.total).toBeGreaterThan(0)
    })

    it('should allow ADMIN to list users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should NOT allow USER to list users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error.code).toBe('FORBIDDEN')
    })

    it('should NOT expose password hashes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
      })

      const body = JSON.parse(response.body)
      const users = body.data.users

      for (const user of users) {
        expect(user).not.toHaveProperty('passwordHash')
        expect(user).not.toHaveProperty('password')
      }
    })
  })

  describe('Team Routes RBAC', () => {
    describe('POST /api/teams - Create Team', () => {
      it('should allow SUPER_ADMIN to create teams', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          payload: {
            name: 'Real Madrid',
            city: 'Madrid',
            foundedYear: 1902,
          },
        })

        expect(response.statusCode).toBe(201)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
        expect(body.data.name).toBe('Real Madrid')
      })

      it('should allow ADMIN to create teams', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            name: 'Barcelona',
            city: 'Barcelona',
            foundedYear: 1899,
          },
        })

        expect(response.statusCode).toBe(201)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
      })

      it('should NOT allow USER to create teams', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            name: 'Atletico Madrid',
            city: 'Madrid',
            foundedYear: 1903,
          },
        })

        expect(response.statusCode).toBe(403)
        const body = JSON.parse(response.body)
        expect(body.error.code).toBe('FORBIDDEN')
      })
    })

    describe('GET /api/teams - List Teams', () => {
      beforeEach(async () => {
        // Create a test team
        await app.inject({
          method: 'POST',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          payload: {
            name: 'Test Team',
            city: 'Test City',
            foundedYear: 2000,
          },
        })
      })

      it('should allow SUPER_ADMIN to view teams', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
      })

      it('should allow ADMIN to view teams', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        })

        expect(response.statusCode).toBe(200)
      })

      it('should allow USER to view teams (read-only)', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
        expect(body.data.teams).toBeInstanceOf(Array)
      })

      it('should NOT allow unauthenticated users to view teams', async () => {
        const response = await app.inject({
          method: 'GET',
          url: '/api/teams',
        })

        expect(response.statusCode).toBe(401)
      })
    })

    describe('PATCH /api/teams/:id - Update Team', () => {
      let teamId: string

      beforeEach(async () => {
        const createResponse = await app.inject({
          method: 'POST',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          payload: {
            name: 'Team To Update',
            city: 'City',
            foundedYear: 2000,
          },
        })
        teamId = JSON.parse(createResponse.body).data.id
      })

      it('should allow SUPER_ADMIN to update teams', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: `/api/teams/${teamId}`,
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          payload: {
            name: 'Updated Team Name',
          },
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.data.name).toBe('Updated Team Name')
      })

      it('should allow ADMIN to update teams', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: `/api/teams/${teamId}`,
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          payload: {
            name: 'Admin Updated',
          },
        })

        expect(response.statusCode).toBe(200)
      })

      it('should NOT allow USER to update teams', async () => {
        const response = await app.inject({
          method: 'PATCH',
          url: `/api/teams/${teamId}`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          payload: {
            name: 'Unauthorized Update',
          },
        })

        expect(response.statusCode).toBe(403)
      })
    })

    describe('DELETE /api/teams/:id - Delete Team', () => {
      let teamId: string

      beforeEach(async () => {
        const createResponse = await app.inject({
          method: 'POST',
          url: '/api/teams',
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          payload: {
            name: 'Team To Delete',
            city: 'City',
            foundedYear: 2000,
          },
        })
        teamId = JSON.parse(createResponse.body).data.id
      })

      it('should allow SUPER_ADMIN to delete teams', async () => {
        const response = await app.inject({
          method: 'DELETE',
          url: `/api/teams/${teamId}`,
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
        })

        expect(response.statusCode).toBe(204)
      })

      it('should allow ADMIN to delete teams', async () => {
        const response = await app.inject({
          method: 'DELETE',
          url: `/api/teams/${teamId}`,
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
        })

        expect(response.statusCode).toBe(204)
      })

      it('should NOT allow USER to delete teams', async () => {
        const response = await app.inject({
          method: 'DELETE',
          url: `/api/teams/${teamId}`,
          headers: {
            authorization: `Bearer ${userToken}`,
          },
        })

        expect(response.statusCode).toBe(403)
      })
    })
  })
})
