import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index.js'
import { Email, EntityId, Role, UserRole } from '../value-objects/index.js'
import { User } from './User.js'

describe('User Domain Entity', () => {
  describe('create', () => {
    it('should create a valid user', () => {
      // Arrange & Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hashed-password',
          role: 'USER',
        }),
      )

      // Assert
      expect(user).toBeInstanceOf(User)
      expect(user.id).toBeInstanceOf(EntityId)
      expect(user.id.getValue()).toBe('user-123')
      expect(user.email).toBeInstanceOf(Email)
      expect(user.email.getValue()).toBe('test@example.com')
      expect(user.role).toBeInstanceOf(Role)
      expect(user.role.getValue()).toBe(UserRole.User)
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
    })

    it('should create user with different roles', () => {
      // Arrange & Act
      const user1 = expectSuccess(
        User.create({
          email: 'user@example.com',
          id: 'user-1',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      const user2 = expectSuccess(
        User.create({
          email: 'admin@example.com',
          id: 'user-2',
          passwordHash: 'hash',
          role: 'ADMIN',
        }),
      )

      const user3 = expectSuccess(
        User.create({
          email: 'superadmin@example.com',
          id: 'user-3',
          passwordHash: 'hash',
          role: 'SUPER_ADMIN',
        }),
      )

      // Assert
      expect(user1.role.getValue()).toBe(UserRole.User)
      expect(user2.role.getValue()).toBe(UserRole.Admin)
      expect(user3.role.getValue()).toBe(UserRole.SuperAdmin)
    })

    it('should return error for empty email', () => {
      // Arrange & Act
      const error = expectError(
        User.create({
          email: '',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('email')
    })

    it('should return error for invalid email format', () => {
      // Arrange & Act
      const error = expectError(
        User.create({
          email: 'invalid-email',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('email')
    })

    it('should return error for email without domain', () => {
      // Arrange & Act
      const error = expectError(
        User.create({
          email: 'test@',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('email')
    })

    it('should return error for email too long', () => {
      // Arrange - create a string of 250 a's plus @example.com
      const longLocalPart = Array(250).fill('a').join('')
      const longEmail = `${longLocalPart}@example.com`

      // Act
      const error = expectError(
        User.create({
          email: longEmail,
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('email')
    })

    it('should return error for invalid role', () => {
      // Arrange & Act
      const error = expectError(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'INVALID_ROLE',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('role')
    })

    it('should return error for empty password hash', () => {
      // Arrange & Act
      const error = expectError(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: '',
          role: 'USER',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('password')
    })

    it('should return error for empty id', () => {
      // Arrange & Act
      const error = expectError(
        User.create({
          email: 'test@example.com',
          id: '',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('id')
    })
  })

  describe('create with timestamps', () => {
    it('should create user with provided timestamps', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00Z')
      const updatedAt = new Date('2025-01-02T00:00:00Z')

      // Act
      const user = expectSuccess(
        User.create({
          createdAt,
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'ADMIN',
          updatedAt,
        }),
      )

      // Assert
      expect(user).toBeInstanceOf(User)
      expect(user.createdAt).toBe(createdAt)
      expect(user.updatedAt).toBe(updatedAt)
    })

    it('should create user with auto-generated timestamps when not provided', () => {
      // Arrange
      const before = new Date()

      // Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      const after = new Date()

      // Assert
      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.updatedAt).toBeInstanceOf(Date)
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('fromValueObjects', () => {
    it('should create user from validated value objects without re-validation', () => {
      // Arrange
      const id = expectSuccess(EntityId.create({ value: 'user-123' }))
      const email = expectSuccess(Email.create({ value: 'test@example.com' }))
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))
      const createdAt = new Date()
      const updatedAt = new Date()

      // Act
      const user = User.fromValueObjects({
        createdAt,
        email,
        id,
        passwordHash: 'hash',
        role,
        updatedAt,
      })

      // Assert
      expect(user).toBeInstanceOf(User)
      expect(user.id).toBe(id)
      expect(user.email).toBe(email)
      expect(user.role).toBe(role)
      expect(user.getPasswordHash()).toBe('hash')
    })
  })

  describe('update', () => {
    it('should update user email', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'old@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Act
      const updated = expectSuccess(user.update({ email: 'new@example.com' }))

      // Assert
      expect(updated.email.getValue()).toBe('new@example.com')
      expect(updated.id.equals({ other: user.id })).toBe(true)
      expect(updated.updatedAt).not.toBe(user.updatedAt)
    })

    it('should update user role', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Act
      const updated = expectSuccess(user.update({ role: 'ADMIN' }))

      // Assert
      expect(updated.role.getValue()).toBe(UserRole.Admin)
    })

    it('should update password hash', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'old-hash',
          role: 'USER',
        }),
      )

      // Act
      const updated = expectSuccess(user.update({ passwordHash: 'new-hash' }))

      // Assert
      expect(updated.getPasswordHash()).toBe('new-hash')
    })

    it('should preserve original values if not updated', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Act
      const updated = expectSuccess(user.update({ email: 'new@example.com' }))

      // Assert
      expect(updated.role.getValue()).toBe(user.role.getValue())
      expect(updated.getPasswordHash()).toBe(user.getPasswordHash())
    })

    it('should return new instance (immutability)', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Act
      const updated = expectSuccess(user.update({ email: 'new@example.com' }))

      // Assert
      expect(updated).not.toBe(user)
      expect(user.email.getValue()).toBe('test@example.com') // Original unchanged
    })

    it('should return error for invalid email update', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Act
      const error = expectError(user.update({ email: 'invalid-email' }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('email')
    })

    it('should return error for invalid role update', () => {
      // Arrange
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Act
      const error = expectError(user.update({ role: 'INVALID' }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('role')
    })
  })

  describe('role checking methods', () => {
    it('hasRole should check exact role', () => {
      // Arrange & Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'ADMIN',
        }),
      )

      // Assert
      expect(user.hasRole('ADMIN')).toBe(true)
      expect(user.hasRole('USER')).toBe(false)
      expect(user.hasRole('SUPER_ADMIN')).toBe(false)
    })

    it('hasRoleLevel should check role hierarchy', () => {
      // Arrange & Act
      const superAdmin = expectSuccess(
        User.create({
          email: 'super@example.com',
          id: 'user-1',
          passwordHash: 'hash',
          role: 'SUPER_ADMIN',
        }),
      )

      const admin = expectSuccess(
        User.create({
          email: 'admin@example.com',
          id: 'user-2',
          passwordHash: 'hash',
          role: 'ADMIN',
        }),
      )

      const user = expectSuccess(
        User.create({
          email: 'user@example.com',
          id: 'user-3',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert - SUPER_ADMIN has all levels
      expect(superAdmin.hasRoleLevel('USER')).toBe(true)
      expect(superAdmin.hasRoleLevel('ADMIN')).toBe(true)
      expect(superAdmin.hasRoleLevel('SUPER_ADMIN')).toBe(true)

      // Assert - ADMIN has ADMIN and USER level
      expect(admin.hasRoleLevel('USER')).toBe(true)
      expect(admin.hasRoleLevel('ADMIN')).toBe(true)
      expect(admin.hasRoleLevel('SUPER_ADMIN')).toBe(false)

      // Assert - USER only has USER level
      expect(user.hasRoleLevel('USER')).toBe(true)
      expect(user.hasRoleLevel('ADMIN')).toBe(false)
      expect(user.hasRoleLevel('SUPER_ADMIN')).toBe(false)
    })

    it('isSuperAdmin should identify SUPER_ADMIN', () => {
      // Arrange & Act
      const superAdmin = expectSuccess(
        User.create({
          email: 'super@example.com',
          id: 'user-1',
          passwordHash: 'hash',
          role: 'SUPER_ADMIN',
        }),
      )

      const admin = expectSuccess(
        User.create({
          email: 'admin@example.com',
          id: 'user-2',
          passwordHash: 'hash',
          role: 'ADMIN',
        }),
      )

      // Assert
      expect(superAdmin.isSuperAdmin()).toBe(true)
      expect(admin.isSuperAdmin()).toBe(false)
    })

    it('isAdmin should identify ADMIN or SUPER_ADMIN', () => {
      // Arrange & Act
      const superAdmin = expectSuccess(
        User.create({
          email: 'super@example.com',
          id: 'user-1',
          passwordHash: 'hash',
          role: 'SUPER_ADMIN',
        }),
      )

      const admin = expectSuccess(
        User.create({
          email: 'admin@example.com',
          id: 'user-2',
          passwordHash: 'hash',
          role: 'ADMIN',
        }),
      )

      const user = expectSuccess(
        User.create({
          email: 'user@example.com',
          id: 'user-3',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(superAdmin.isAdmin()).toBe(true)
      expect(admin.isAdmin()).toBe(true)
      expect(user.isAdmin()).toBe(false)
    })
  })

  describe('toObject', () => {
    it('should convert to plain object', () => {
      // Arrange & Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'USER',
        }),
      )

      const obj = user.toObject()

      // Assert
      expect(obj.id).toBe('user-123')
      expect(obj.email).toBe('test@example.com')
      expect(obj.role).toBe(UserRole.User)
      expect(obj.createdAt).toBeInstanceOf(Date)
      expect(obj.updatedAt).toBeInstanceOf(Date)
    })

    it('should NOT include password hash in toObject', () => {
      // Arrange & Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'secret-hash',
          role: 'USER',
        }),
      )

      const obj = user.toObject()

      // Assert
      expect(obj).not.toHaveProperty('passwordHash')
      expect(JSON.stringify(obj)).not.toContain('secret-hash')
    })
  })

  describe('toDTO', () => {
    it('should convert to UserResponseDTO with ISO date strings', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00.000Z')
      const updatedAt = new Date('2025-01-02T00:00:00.000Z')

      const user = expectSuccess(
        User.create({
          createdAt,
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'hash',
          role: 'ADMIN',
          updatedAt,
        }),
      )

      // Act
      const dto = user.toDTO()

      // Assert
      expect(dto.id).toBe('user-123')
      expect(dto.email).toBe('test@example.com')
      expect(dto.role).toBe(UserRole.Admin)
      expect(dto.createdAt).toBe('2025-01-01T00:00:00.000Z')
      expect(dto.updatedAt).toBe('2025-01-02T00:00:00.000Z')
    })

    it('should NOT include password hash in DTO', () => {
      // Arrange & Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'secret-hash',
          role: 'USER',
        }),
      )

      const dto = user.toDTO()

      // Assert
      expect(dto).not.toHaveProperty('passwordHash')
      expect(JSON.stringify(dto)).not.toContain('secret-hash')
    })
  })

  describe('getPasswordHash', () => {
    it('should return password hash', () => {
      // Arrange & Act
      const user = expectSuccess(
        User.create({
          email: 'test@example.com',
          id: 'user-123',
          passwordHash: 'secret-hash',
          role: 'USER',
        }),
      )

      // Assert
      expect(user.getPasswordHash()).toBe('secret-hash')
    })
  })
})
