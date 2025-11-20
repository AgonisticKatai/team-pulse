import type { LoginResponseDTO } from '@team-pulse/shared/dtos'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors'
import { Token } from '../value-objects'
import { Session } from './Session'
import { User } from './User'

describe('Session', () => {
  // Test data helpers
  const createValidUser = () => {
    const [, user] = User.create({
      createdAt: new Date('2024-01-01'),
      email: 'user@example.com',
      id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'USER',
      updatedAt: new Date('2024-01-01'),
    })
    return user!
  }

  const createValidSessionData = () => ({
    accessToken: 'valid.jwt.token',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    refreshToken: 'valid.refresh.token',
    user: createValidUser(),
  })

  describe('create()', () => {
    it('should create session with valid data', () => {
      // Arrange
      const data = createValidSessionData()

      // Act
      const [error, session] = Session.create(data)

      // Assert
      expect(error).toBeNull()
      expect(session).toBeDefined()
      expect(session?.getAccessToken()).toBe('valid.jwt.token')
      expect(session?.getRefreshToken()).toBe('valid.refresh.token')
      expect(session?.getUser()).toBe(data.user)
      expect(session?.getCreatedAt()).toBe(data.createdAt)
    })

    it('should fail when accessToken is empty', () => {
      // Arrange
      const data = {
        ...createValidSessionData(),
        accessToken: '',
      }

      // Act
      const [error, session] = Session.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Token is required')
      expect(session).toBeNull()
    })

    it('should fail when refreshToken is empty', () => {
      // Arrange
      const data = {
        ...createValidSessionData(),
        refreshToken: '',
      }

      // Act
      const [error, session] = Session.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Token is required')
      expect(session).toBeNull()
    })

    it('should fail when createdAt is invalid date', () => {
      // Arrange
      const data = {
        ...createValidSessionData(),
        createdAt: new Date('invalid'),
      }

      // Act
      const [error, session] = Session.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Invalid date')
      expect(session).toBeNull()
    })

    it('should trim whitespace from tokens', () => {
      // Arrange
      const data = {
        ...createValidSessionData(),
        accessToken: '  valid.jwt.token  ',
        refreshToken: '  valid.refresh.token  ',
      }

      // Act
      const [error, session] = Session.create(data)

      // Assert
      expect(error).toBeNull()
      expect(session?.getAccessToken()).toBe('valid.jwt.token')
      expect(session?.getRefreshToken()).toBe('valid.refresh.token')
    })
  })

  describe('fromValueObjects()', () => {
    it('should create session from value objects', () => {
      // Arrange
      const [, accessToken] = Token.create({ value: 'valid.jwt.token' })
      const [, refreshToken] = Token.create({ value: 'valid.refresh.token' })
      const user = createValidUser()

      const props = {
        accessToken: accessToken!,
        refreshToken: refreshToken!,
        user,
      }

      // Act
      const [error, session] = Session.fromValueObjects(props)

      // Assert
      expect(error).toBeNull()
      expect(session).toBeDefined()
      expect(session?.getAccessToken()).toBe('valid.jwt.token')
      expect(session?.getRefreshToken()).toBe('valid.refresh.token')
      expect(session?.getUser()).toBe(user)
      expect(session?.getCreatedAt()).toBeInstanceOf(Date)
    })

    it('should set createdAt to current date', () => {
      // Arrange
      const [, accessToken] = Token.create({ value: 'valid.jwt.token' })
      const [, refreshToken] = Token.create({ value: 'valid.refresh.token' })
      const user = createValidUser()
      const before = Date.now()

      // Act
      const [, session] = Session.fromValueObjects({
        accessToken: accessToken!,
        refreshToken: refreshToken!,
        user,
      })

      const after = Date.now()

      // Assert
      const createdAt = session?.getCreatedAt().getTime()
      expect(createdAt).toBeGreaterThanOrEqual(before)
      expect(createdAt).toBeLessThanOrEqual(after)
    })
  })

  describe('fromDTO()', () => {
    it('should create session from valid DTO', () => {
      // Arrange
      const dto: LoginResponseDTO = {
        accessToken: 'valid.jwt.token',
        refreshToken: 'valid.refresh.token',
        user: {
          createdAt: '2024-01-01T00:00:00Z',
          email: 'user@example.com',
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      }

      // Act
      const [error, session] = Session.fromDTO(dto)

      // Assert
      expect(error).toBeNull()
      expect(session).toBeDefined()
      expect(session?.getAccessToken()).toBe('valid.jwt.token')
      expect(session?.getRefreshToken()).toBe('valid.refresh.token')
      expect(session?.getUser().getEmail().getValue()).toBe('user@example.com')
    })

    it('should fail when user DTO is invalid', () => {
      // Arrange
      const dto: LoginResponseDTO = {
        accessToken: 'valid.jwt.token',
        refreshToken: 'valid.refresh.token',
        user: {
          createdAt: '2024-01-01T00:00:00Z',
          email: 'invalid-email', // Invalid email format
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      }

      // Act
      const [error, session] = Session.fromDTO(dto)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Failed to create Session from DTO')
      expect(session).toBeNull()
    })

    it('should fail when tokens are invalid', () => {
      // Arrange
      const dto: LoginResponseDTO = {
        accessToken: '',
        refreshToken: 'valid.refresh.token',
        user: {
          createdAt: '2024-01-01T00:00:00Z',
          email: 'user@example.com',
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'USER',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      }

      // Act
      const [error, session] = Session.fromDTO(dto)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error?.message).toContain('Failed to create Session from DTO')
      expect(session).toBeNull()
    })
  })

  describe('empty()', () => {
    it('should return null for empty session', () => {
      // Act
      const result = Session.empty()

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('updateAccessToken()', () => {
    it('should return new session with updated access token', () => {
      // Arrange
      const [, originalSession] = Session.create(createValidSessionData())
      const newToken = 'new.jwt.token'

      // Act
      const [error, updatedSession] = originalSession!.updateAccessToken({
        newAccessToken: newToken,
      })

      // Assert
      expect(error).toBeNull()
      expect(updatedSession).toBeDefined()
      expect(updatedSession?.getAccessToken()).toBe(newToken)
      expect(updatedSession?.getRefreshToken()).toBe(originalSession?.getRefreshToken())
      expect(updatedSession?.getUser()).toBe(originalSession?.getUser())
    })

    it('should preserve immutability (return new instance)', () => {
      // Arrange
      const [, originalSession] = Session.create(createValidSessionData())
      const originalAccessToken = originalSession?.getAccessToken()

      // Act
      const [, updatedSession] = originalSession!.updateAccessToken({
        newAccessToken: 'new.jwt.token',
      })

      // Assert
      expect(updatedSession).not.toBe(originalSession)
      expect(originalSession?.getAccessToken()).toBe(originalAccessToken)
      expect(updatedSession?.getAccessToken()).toBe('new.jwt.token')
    })

    it('should fail with invalid access token', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act
      const [error, updatedSession] = session!.updateAccessToken({
        newAccessToken: '',
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(updatedSession).toBeNull()
    })

    it('should preserve createdAt date', () => {
      // Arrange
      const [, originalSession] = Session.create(createValidSessionData())
      const originalCreatedAt = originalSession?.getCreatedAt()

      // Act
      const [, updatedSession] = originalSession!.updateAccessToken({
        newAccessToken: 'new.jwt.token',
      })

      // Assert
      expect(updatedSession?.getCreatedAt()).toBe(originalCreatedAt)
    })
  })

  describe('updateTokens()', () => {
    it('should return new session with both tokens updated', () => {
      // Arrange
      const [, originalSession] = Session.create(createValidSessionData())
      const newAccessToken = 'new.jwt.token'
      const newRefreshToken = 'new.refresh.token'

      // Act
      const [error, updatedSession] = originalSession!.updateTokens({
        newAccessToken,
        newRefreshToken,
      })

      // Assert
      expect(error).toBeNull()
      expect(updatedSession).toBeDefined()
      expect(updatedSession?.getAccessToken()).toBe(newAccessToken)
      expect(updatedSession?.getRefreshToken()).toBe(newRefreshToken)
      expect(updatedSession?.getUser()).toBe(originalSession?.getUser())
    })

    it('should preserve immutability (return new instance)', () => {
      // Arrange
      const [, originalSession] = Session.create(createValidSessionData())
      const originalAccessToken = originalSession?.getAccessToken()
      const originalRefreshToken = originalSession?.getRefreshToken()

      // Act
      const [, updatedSession] = originalSession!.updateTokens({
        newAccessToken: 'new.jwt.token',
        newRefreshToken: 'new.refresh.token',
      })

      // Assert
      expect(updatedSession).not.toBe(originalSession)
      expect(originalSession?.getAccessToken()).toBe(originalAccessToken)
      expect(originalSession?.getRefreshToken()).toBe(originalRefreshToken)
      expect(updatedSession?.getAccessToken()).toBe('new.jwt.token')
      expect(updatedSession?.getRefreshToken()).toBe('new.refresh.token')
    })

    it('should fail with invalid access token', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act
      const [error, updatedSession] = session!.updateTokens({
        newAccessToken: '',
        newRefreshToken: 'new.refresh.token',
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(updatedSession).toBeNull()
    })

    it('should fail with invalid refresh token', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act
      const [error, updatedSession] = session!.updateTokens({
        newAccessToken: 'new.jwt.token',
        newRefreshToken: '',
      })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(updatedSession).toBeNull()
    })
  })

  describe('getters', () => {
    it('should return user', () => {
      // Arrange
      const data = createValidSessionData()
      const [, session] = Session.create(data)

      // Act & Assert
      expect(session?.getUser()).toBe(data.user)
    })

    it('should return access token as string', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.getAccessToken()).toBe('valid.jwt.token')
    })

    it('should return refresh token as string', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.getRefreshToken()).toBe('valid.refresh.token')
    })

    it('should return createdAt date', () => {
      // Arrange
      const data = createValidSessionData()
      const [, session] = Session.create(data)

      // Act & Assert
      expect(session?.getCreatedAt()).toBe(data.createdAt)
    })
  })

  describe('isAuthenticated()', () => {
    it('should return true for valid session', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.isAuthenticated()).toBe(true)
    })
  })

  describe('hasRole()', () => {
    it('should return true when user has the role', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.hasRole('USER')).toBe(true)
    })

    it('should return false when user does not have the role', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.hasRole('ADMIN')).toBe(false)
    })
  })

  describe('isSuperAdmin()', () => {
    it('should return false for regular user', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.isSuperAdmin()).toBe(false)
    })

    it('should return true for super admin user', () => {
      // Arrange
      const [, superAdminUser] = User.create({
        createdAt: new Date(),
        email: 'admin@example.com',
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'SUPER_ADMIN',
        updatedAt: new Date(),
      })

      const [, session] = Session.create({
        accessToken: 'valid.jwt.token',
        createdAt: new Date(),
        refreshToken: 'valid.refresh.token',
        user: superAdminUser!,
      })

      // Act & Assert
      expect(session?.isSuperAdmin()).toBe(true)
    })
  })

  describe('isAdmin()', () => {
    it('should return false for regular user', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act & Assert
      expect(session?.isAdmin()).toBe(false)
    })

    it('should return true for admin user', () => {
      // Arrange
      const [, adminUser] = User.create({
        createdAt: new Date(),
        email: 'admin@example.com',
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'ADMIN',
        updatedAt: new Date(),
      })

      const [, session] = Session.create({
        accessToken: 'valid.jwt.token',
        createdAt: new Date(),
        refreshToken: 'valid.refresh.token',
        user: adminUser!,
      })

      // Act & Assert
      expect(session?.isAdmin()).toBe(true)
    })

    it('should return true for super admin user', () => {
      // Arrange
      const [, superAdminUser] = User.create({
        createdAt: new Date(),
        email: 'admin@example.com',
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'SUPER_ADMIN',
        updatedAt: new Date(),
      })

      const [, session] = Session.create({
        accessToken: 'valid.jwt.token',
        createdAt: new Date(),
        refreshToken: 'valid.refresh.token',
        user: superAdminUser!,
      })

      // Act & Assert
      expect(session?.isAdmin()).toBe(true)
    })
  })

  describe('getAgeInMs()', () => {
    it('should return age in milliseconds', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 5000) // 5 seconds ago
      const [, session] = Session.create({
        ...createValidSessionData(),
        createdAt: pastDate,
      })

      // Act
      const ageMs = session?.getAgeInMs()

      // Assert
      expect(ageMs).toBeGreaterThanOrEqual(5000)
      expect(ageMs).toBeLessThan(6000) // Allow small timing variations
    })

    it('should return 0 or near 0 for just created session', () => {
      // Arrange
      const [, session] = Session.create({
        ...createValidSessionData(),
        createdAt: new Date(),
      })

      // Act
      const ageMs = session?.getAgeInMs()

      // Assert
      expect(ageMs).toBeLessThan(100) // Should be very small
    })
  })

  describe('getAgeInMinutes()', () => {
    it('should return age in minutes', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      const [, session] = Session.create({
        ...createValidSessionData(),
        createdAt: pastDate,
      })

      // Act
      const ageMinutes = session?.getAgeInMinutes()

      // Assert
      expect(ageMinutes).toBe(5)
    })

    it('should return 0 for sessions less than 1 minute old', () => {
      // Arrange
      const [, session] = Session.create({
        ...createValidSessionData(),
        createdAt: new Date(Date.now() - 30 * 1000), // 30 seconds ago
      })

      // Act
      const ageMinutes = session?.getAgeInMinutes()

      // Assert
      expect(ageMinutes).toBe(0)
    })

    it('should floor the minutes (not round)', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 5.9 * 60 * 1000) // 5.9 minutes ago
      const [, session] = Session.create({
        ...createValidSessionData(),
        createdAt: pastDate,
      })

      // Act
      const ageMinutes = session?.getAgeInMinutes()

      // Assert
      expect(ageMinutes).toBe(5) // Should be floored, not 6
    })
  })

  describe('toObject()', () => {
    it('should return plain object with all properties', () => {
      // Arrange
      const data = createValidSessionData()
      const [, session] = Session.create(data)

      // Act
      const obj = session?.toObject()

      // Assert
      expect(obj).toEqual({
        accessToken: 'valid.jwt.token',
        createdAt: data.createdAt,
        refreshToken: 'valid.refresh.token',
        user: data.user,
      })
    })

    it('should match create() signature for symmetry', () => {
      // Arrange
      const data = createValidSessionData()
      const [, session] = Session.create(data)

      // Act
      const obj = session?.toObject()
      const [, recreated] = Session.create(obj!)

      // Assert
      expect(recreated?.getAccessToken()).toBe(session?.getAccessToken())
      expect(recreated?.getRefreshToken()).toBe(session?.getRefreshToken())
      expect(recreated?.getUser()).toBe(session?.getUser())
    })
  })

  describe('toDTO()', () => {
    it('should return DTO with serialized properties', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act
      const dto = session?.toDTO()

      // Assert
      expect(dto).toHaveProperty('accessToken', 'valid.jwt.token')
      expect(dto).toHaveProperty('refreshToken', 'valid.refresh.token')
      expect(dto).toHaveProperty('user')
      expect(dto!.user).toHaveProperty('id')
      expect(dto!.user).toHaveProperty('email')
      expect(dto!.user).toHaveProperty('role')
    })

    it('should serialize user to DTO format', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act
      const dto = session?.toDTO()

      // Assert
      expect(dto!.user.email).toBe('user@example.com')
      expect(dto!.user.role).toBe('USER')
    })
  })

  describe('toJSON()', () => {
    it('should return same as toObject()', () => {
      // Arrange
      const [, session] = Session.create(createValidSessionData())

      // Act
      const json = session?.toJSON()
      const obj = session?.toObject()

      // Assert
      expect(json).toEqual(obj)
    })
  })
})
