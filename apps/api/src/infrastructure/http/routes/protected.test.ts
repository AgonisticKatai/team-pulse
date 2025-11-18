import { sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'
import { User } from '../../../domain/models/User.js'
import { hashPassword } from '../../auth/password-utils.js'
import type { Container } from '../../config/container.js'
import type { Database } from '../../database/connection.js'
import { expectSuccess } from '../../testing/result-helpers.js'
import { setupTestEnvironment } from '../../testing/test-helpers.js'

describe('Protected Routes and RBAC', () => {
  let app: FastifyInstance
  let container: Container
  let db: Database
  let superAdminToken: string
  let adminToken: string
  let userToken: string

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    // Get database instance for test isolation
    db = getDatabase()
  })

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

    const superAdmin = expectSuccess(
      User.create({
        email: superAdminEmail,
        id: 'super-admin',
        passwordHash: await hashPassword('SuperAdmin123!'),
        role: 'SUPER_ADMIN',
      }),
    )

    const admin = expectSuccess(
      User.create({
        email: adminEmail,
        id: 'admin',
        passwordHash: await hashPassword('Admin123!'),
        role: 'ADMIN',
      }),
    )

    const user = expectSuccess(
      User.create({
        email: userEmail,
        id: 'user',
        passwordHash: await hashPassword('User123!'),
        role: 'USER',
      }),
    )

    await container.userRepository.save({ user: superAdmin })
    await container.userRepository.save({ user: admin })
    await container.userRepository.save({ user })

    // Get tokens for each user
    const superAdminLogin = await app.inject({
      method: 'POST',
      payload: { email: superAdminEmail, password: 'SuperAdmin123!' },
      url: '/api/auth/login',
    })
    superAdminToken = JSON.parse(superAdminLogin.body).data.accessToken

    const adminLogin = await app.inject({
      method: 'POST',
      payload: { email: adminEmail, password: 'Admin123!' },
      url: '/api/auth/login',
    })
    adminToken = JSON.parse(adminLogin.body).data.accessToken

    const userLogin = await app.inject({
      method: 'POST',
      payload: { email: userEmail, password: 'User123!' },
      url: '/api/auth/login',
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

  describe('POST /api/users - Create User', () => {
    it('should allow SUPER_ADMIN to create users', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        method: 'POST',
        payload: {
          email: 'newuser@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
        url: '/api/users',
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.email).toBe('newuser@test.com')
      expect(body.data.role).toBe('USER')
    })

    it('should allow ADMIN to create users', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        method: 'POST',
        payload: {
          email: 'newuser2@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
        url: '/api/users',
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should NOT allow USER to create users', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        method: 'POST',
        payload: {
          email: 'newuser3@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
        url: '/api/users',
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
        payload: {
          email: 'newuser4@test.com',
          password: 'NewUser123!',
          role: 'USER',
        },
        url: '/api/users',
      })

      expect(response.statusCode).toBe(401)
    })

    it('should validate password strength', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        method: 'POST',
        payload: {
          email: 'weak@test.com',
          password: 'weak', // Too weak
          role: 'USER',
        },
        url: '/api/users',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
    })

    it('should prevent duplicate emails', async () => {
      await app.inject({
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        method: 'POST',
        payload: {
          email: 'duplicate@test.com',
          password: 'Password123!',
          role: 'USER',
        },
        url: '/api/users',
      })

      const response = await app.inject({
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        method: 'POST',
        payload: {
          email: 'duplicate@test.com',
          password: 'Password123!',
          role: 'USER',
        },
        url: '/api/users',
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error.message).toContain('already exists')
    })
  })

  describe('GET /api/users - List Users', () => {
    it('should allow SUPER_ADMIN to list users', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.users).toBeInstanceOf(Array)
      expect(body.data.pagination.total).toBeGreaterThan(0)
    })

    it('should allow ADMIN to list users', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })

    it('should NOT allow USER to list users', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${userToken}`,
        },
        method: 'GET',
        url: '/api/users',
      })

      expect(response.statusCode).toBe(403)
      const body = JSON.parse(response.body)
      expect(body.error.code).toBe('FORBIDDEN')
    })

    it('should NOT expose password hashes', async () => {
      const response = await app.inject({
        headers: {
          authorization: `Bearer ${superAdminToken}`,
        },
        method: 'GET',
        url: '/api/users',
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
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'POST',
          payload: {
            city: 'Madrid',
            foundedYear: 1902,
            name: 'Real Madrid',
          },
          url: '/api/teams',
        })

        expect(response.statusCode).toBe(201)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
        expect(body.data.name).toBe('Real Madrid')
      })

      it('should allow ADMIN to create teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          method: 'POST',
          payload: {
            city: 'Barcelona',
            foundedYear: 1899,
            name: 'Barcelona',
          },
          url: '/api/teams',
        })

        expect(response.statusCode).toBe(201)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
      })

      it('should NOT allow USER to create teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          method: 'POST',
          payload: {
            city: 'Madrid',
            foundedYear: 1903,
            name: 'Atletico Madrid',
          },
          url: '/api/teams',
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
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'POST',
          payload: {
            city: 'Test City',
            foundedYear: 2000,
            name: 'Test Team',
          },
          url: '/api/teams',
        })
      })

      it('should allow SUPER_ADMIN to view teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'GET',
          url: '/api/teams',
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.success).toBe(true)
      })

      it('should allow ADMIN to view teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          method: 'GET',
          url: '/api/teams',
        })

        expect(response.statusCode).toBe(200)
      })

      it('should allow USER to view teams (read-only)', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          method: 'GET',
          url: '/api/teams',
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
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'POST',
          payload: {
            city: 'City',
            foundedYear: 2000,
            name: 'Team To Update',
          },
          url: '/api/teams',
        })
        teamId = JSON.parse(createResponse.body).data.id
      })

      it('should allow SUPER_ADMIN to update teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'PATCH',
          payload: {
            name: 'Updated Team Name',
          },
          url: `/api/teams/${teamId}`,
        })

        expect(response.statusCode).toBe(200)
        const body = JSON.parse(response.body)
        expect(body.data.name).toBe('Updated Team Name')
      })

      it('should allow ADMIN to update teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          method: 'PATCH',
          payload: {
            name: 'Admin Updated',
          },
          url: `/api/teams/${teamId}`,
        })

        expect(response.statusCode).toBe(200)
      })

      it('should NOT allow USER to update teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          method: 'PATCH',
          payload: {
            name: 'Unauthorized Update',
          },
          url: `/api/teams/${teamId}`,
        })

        expect(response.statusCode).toBe(403)
      })
    })

    describe('DELETE /api/teams/:id - Delete Team', () => {
      let teamId: string

      beforeEach(async () => {
        const createResponse = await app.inject({
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'POST',
          payload: {
            city: 'City',
            foundedYear: 2000,
            name: 'Team To Delete',
          },
          url: '/api/teams',
        })
        teamId = JSON.parse(createResponse.body).data.id
      })

      it('should allow SUPER_ADMIN to delete teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${superAdminToken}`,
          },
          method: 'DELETE',
          url: `/api/teams/${teamId}`,
        })

        expect(response.statusCode).toBe(204)
      })

      it('should allow ADMIN to delete teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${adminToken}`,
          },
          method: 'DELETE',
          url: `/api/teams/${teamId}`,
        })

        expect(response.statusCode).toBe(204)
      })

      it('should NOT allow USER to delete teams', async () => {
        const response = await app.inject({
          headers: {
            authorization: `Bearer ${userToken}`,
          },
          method: 'DELETE',
          url: `/api/teams/${teamId}`,
        })

        expect(response.statusCode).toBe(403)
      })
    })
  })
})
