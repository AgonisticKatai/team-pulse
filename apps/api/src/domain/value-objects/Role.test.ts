import { ValidationError } from '@domain/errors/ValidationError.js'
import { Role, UserRole } from '@domain/value-objects/Role.js'
import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'

describe('Role Value Object', () => {
  describe('create', () => {
    it('should create USER role', () => {
      // Arrange
      const roleString = 'USER'

      // Act
      const role = expectSuccess(Role.create({ value: roleString }))

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.User)
    })

    it('should create ADMIN role', () => {
      // Arrange
      const roleString = 'ADMIN'

      // Act
      const role = expectSuccess(Role.create({ value: roleString }))

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.Admin)
    })

    it('should create SUPER_ADMIN role', () => {
      // Arrange
      const roleString = 'SUPER_ADMIN'

      // Act
      const role = expectSuccess(Role.create({ value: roleString }))

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.SuperAdmin)
    })

    it('should normalize to uppercase', () => {
      // Arrange
      const roleString = 'user'

      // Act
      const role = expectSuccess(Role.create({ value: roleString }))

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.User)
    })

    it('should trim whitespace', () => {
      // Arrange
      const roleString = '  ADMIN  '

      // Act
      const role = expectSuccess(Role.create({ value: roleString }))

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.Admin)
    })

    it('should fail with empty string', () => {
      // Arrange
      const roleString = ''

      // Act
      const error = expectError(Role.create({ value: roleString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Role is required')
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const roleString = '   '

      // Act
      const error = expectError(Role.create({ value: roleString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Role is required')
    })

    it('should fail with invalid role', () => {
      // Arrange
      const roleString = 'INVALID_ROLE'

      // Act
      const error = expectError(Role.create({ value: roleString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Invalid role')
    })
  })

  describe('fromEnum', () => {
    it('should create role from enum value', () => {
      // Act
      const role = Role.fromEnum({ value: UserRole.Admin })

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.Admin)
    })
  })

  describe('getValue', () => {
    it('should return the role value', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const value = role.getValue()

      // Assert
      expect(value).toBe(UserRole.User)
    })
  })

  describe('getLevel', () => {
    it('should return level 1 for USER', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const level = role.getLevel()

      // Assert
      expect(level).toBe(1)
    })

    it('should return level 2 for ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const level = role.getLevel()

      // Assert
      expect(level).toBe(2)
    })

    it('should return level 3 for SUPER_ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'SUPER_ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const level = role.getLevel()

      // Assert
      expect(level).toBe(3)
    })
  })

  describe('hasLevelOf', () => {
    it('should return true when role has equal level', () => {
      // Arrange
      const admin1 = expectSuccess(Role.create({ value: 'ADMIN' }))
      const admin2 = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(admin1).toBeDefined()
      expect(admin2).toBeDefined()

      // Act
      const hasLevel = admin1.hasLevelOf({ other: admin2 })

      // Assert
      expect(hasLevel).toBe(true)
    })

    it('should return true when role has higher level', () => {
      // Arrange
      const superAdmin = expectSuccess(Role.create({ value: 'SUPER_ADMIN' }))
      const admin = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(superAdmin).toBeDefined()
      expect(admin).toBeDefined()

      // Act
      const hasLevel = superAdmin.hasLevelOf({ other: admin })

      // Assert
      expect(hasLevel).toBe(true)
    })

    it('should return false when role has lower level', () => {
      // Arrange
      const user = expectSuccess(Role.create({ value: 'USER' }))
      const admin = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(user).toBeDefined()
      expect(admin).toBeDefined()

      // Act
      const hasLevel = user.hasLevelOf({ other: admin })

      // Assert
      expect(hasLevel).toBe(false)
    })
  })

  describe('is', () => {
    it('should return true for matching role', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isAdmin = role.is({ role: UserRole.Admin })

      // Assert
      expect(isAdmin).toBe(true)
    })

    it('should return false for non-matching role', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isAdmin = role.is({ role: UserRole.Admin })

      // Assert
      expect(isAdmin).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('should return true for SUPER_ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'SUPER_ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isSuperAdmin = role.isSuperAdmin()

      // Assert
      expect(isSuperAdmin).toBe(true)
    })

    it('should return false for ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isSuperAdmin = role.isSuperAdmin()

      // Assert
      expect(isSuperAdmin).toBe(false)
    })

    it('should return false for USER', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isSuperAdmin = role.isSuperAdmin()

      // Assert
      expect(isSuperAdmin).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true for SUPER_ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'SUPER_ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isAdmin = role.isAdmin()

      // Assert
      expect(isAdmin).toBe(true)
    })

    it('should return true for ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isAdmin = role.isAdmin()

      // Assert
      expect(isAdmin).toBe(true)
    })

    it('should return false for USER', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isAdmin = role.isAdmin()

      // Assert
      expect(isAdmin).toBe(false)
    })
  })

  describe('isUser', () => {
    it('should return true for USER', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isUser = role.isUser()

      // Assert
      expect(isUser).toBe(true)
    })

    it('should return false for ADMIN', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const isUser = role.isUser()

      // Assert
      expect(isUser).toBe(false)
    })
  })

  describe('canPerform', () => {
    it('should allow SUPER_ADMIN to perform ADMIN actions', () => {
      // Arrange
      const superAdmin = expectSuccess(Role.create({ value: 'SUPER_ADMIN' }))
      const requiredRole = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(superAdmin).toBeDefined()
      expect(requiredRole).toBeDefined()

      // Act
      const canPerform = superAdmin.canPerform({ requiredRole: requiredRole })

      // Assert
      expect(canPerform).toBe(true)
    })

    it('should allow ADMIN to perform USER actions', () => {
      // Arrange
      const admin = expectSuccess(Role.create({ value: 'ADMIN' }))
      const requiredRole = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(admin).toBeDefined()
      expect(requiredRole).toBeDefined()

      // Act
      const canPerform = admin.canPerform({ requiredRole: requiredRole })

      // Assert
      expect(canPerform).toBe(true)
    })

    it('should not allow USER to perform ADMIN actions', () => {
      // Arrange
      const user = expectSuccess(Role.create({ value: 'USER' }))
      const requiredRole = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(user).toBeDefined()
      expect(requiredRole).toBeDefined()

      // Act
      const canPerform = user.canPerform({ requiredRole: requiredRole })

      // Assert
      expect(canPerform).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same role', () => {
      // Arrange
      const role1 = expectSuccess(Role.create({ value: 'ADMIN' }))
      const role2 = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role1).toBeDefined()
      expect(role2).toBeDefined()

      // Act
      const isEqual = role1.equals({ other: role2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different roles', () => {
      // Arrange
      const role1 = expectSuccess(Role.create({ value: 'ADMIN' }))
      const role2 = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role1).toBeDefined()
      expect(role2).toBeDefined()

      // Act
      const isEqual = role1.equals({ other: role2 })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const str = role.toString()

      // Assert
      expect(str).toBe('ADMIN')
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'USER' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const json = role.toJSON()

      // Assert
      expect(json).toBe('USER')
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act
      const obj = { role }
      const jsonString = JSON.stringify(obj)

      // Assert
      expect(jsonString).toBe('{"role":"ADMIN"}')
    })
  })

  describe('Immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const role = expectSuccess(Role.create({ value: 'ADMIN' }))

      // Assert
      expect(role).toBeDefined()

      // Act & Assert
      expect(role.getValue()).toBe(UserRole.Admin)
      expect(role.getValue()).toBe(UserRole.Admin) // Still the same
    })
  })
})
