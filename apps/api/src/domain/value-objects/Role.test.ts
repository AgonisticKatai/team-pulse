import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index.js'
import { Role, UserRole } from './Role.js'

describe('Role Value Object', () => {
  describe('create', () => {
    it('should create USER role', () => {
      // Arrange
      const roleString = 'USER'

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeNull()
      expect(role).toBeDefined()
      expect(role!.getValue()).toBe(UserRole.USER)
    })

    it('should create ADMIN role', () => {
      // Arrange
      const roleString = 'ADMIN'

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeNull()
      expect(role).toBeDefined()
      expect(role!.getValue()).toBe(UserRole.ADMIN)
    })

    it('should create SUPER_ADMIN role', () => {
      // Arrange
      const roleString = 'SUPER_ADMIN'

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeNull()
      expect(role).toBeDefined()
      expect(role!.getValue()).toBe(UserRole.SUPER_ADMIN)
    })

    it('should normalize to uppercase', () => {
      // Arrange
      const roleString = 'user'

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeNull()
      expect(role).toBeDefined()
      expect(role!.getValue()).toBe(UserRole.USER)
    })

    it('should trim whitespace', () => {
      // Arrange
      const roleString = '  ADMIN  '

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeNull()
      expect(role).toBeDefined()
      expect(role!.getValue()).toBe(UserRole.ADMIN)
    })

    it('should fail with empty string', () => {
      // Arrange
      const roleString = ''

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Role is required')
      expect(role).toBeNull()
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const roleString = '   '

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Role is required')
      expect(role).toBeNull()
    })

    it('should fail with invalid role', () => {
      // Arrange
      const roleString = 'INVALID_ROLE'

      // Act
      const [error, role] = Role.create({ value: roleString })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error!.message).toContain('Invalid role')
      expect(role).toBeNull()
    })
  })

  describe('fromEnum', () => {
    it('should create role from enum value', () => {
      // Act
      const role = Role.fromEnum({ value: UserRole.ADMIN })

      // Assert
      expect(role).toBeDefined()
      expect(role.getValue()).toBe(UserRole.ADMIN)
    })
  })

  describe('getValue', () => {
    it('should return the role value', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()
      expect(role).toBeDefined()

      // Act
      const value = role!.getValue()

      // Assert
      expect(value).toBe(UserRole.USER)
    })
  })

  describe('getLevel', () => {
    it('should return level 1 for USER', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()

      // Act
      const level = role!.getLevel()

      // Assert
      expect(level).toBe(1)
    })

    it('should return level 2 for ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const level = role!.getLevel()

      // Assert
      expect(level).toBe(2)
    })

    it('should return level 3 for SUPER_ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'SUPER_ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const level = role!.getLevel()

      // Assert
      expect(level).toBe(3)
    })
  })

  describe('hasLevelOf', () => {
    it('should return true when role has equal level', () => {
      // Arrange
      const [error1, admin1] = Role.create({ value: 'ADMIN' })
      const [error2, admin2] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const hasLevel = admin1!.hasLevelOf({ other: admin2! })

      // Assert
      expect(hasLevel).toBe(true)
    })

    it('should return true when role has higher level', () => {
      // Arrange
      const [error1, superAdmin] = Role.create({ value: 'SUPER_ADMIN' })
      const [error2, admin] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const hasLevel = superAdmin!.hasLevelOf({ other: admin! })

      // Assert
      expect(hasLevel).toBe(true)
    })

    it('should return false when role has lower level', () => {
      // Arrange
      const [error1, user] = Role.create({ value: 'USER' })
      const [error2, admin] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const hasLevel = user!.hasLevelOf({ other: admin! })

      // Assert
      expect(hasLevel).toBe(false)
    })
  })

  describe('is', () => {
    it('should return true for matching role', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isAdmin = role!.is({ role: UserRole.ADMIN })

      // Assert
      expect(isAdmin).toBe(true)
    })

    it('should return false for non-matching role', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isAdmin = role!.is({ role: UserRole.ADMIN })

      // Assert
      expect(isAdmin).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('should return true for SUPER_ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'SUPER_ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isSuperAdmin = role!.isSuperAdmin()

      // Assert
      expect(isSuperAdmin).toBe(true)
    })

    it('should return false for ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isSuperAdmin = role!.isSuperAdmin()

      // Assert
      expect(isSuperAdmin).toBe(false)
    })

    it('should return false for USER', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isSuperAdmin = role!.isSuperAdmin()

      // Assert
      expect(isSuperAdmin).toBe(false)
    })
  })

  describe('isAdmin', () => {
    it('should return true for SUPER_ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'SUPER_ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isAdmin = role!.isAdmin()

      // Assert
      expect(isAdmin).toBe(true)
    })

    it('should return true for ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isAdmin = role!.isAdmin()

      // Assert
      expect(isAdmin).toBe(true)
    })

    it('should return false for USER', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isAdmin = role!.isAdmin()

      // Assert
      expect(isAdmin).toBe(false)
    })
  })

  describe('isUser', () => {
    it('should return true for USER', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isUser = role!.isUser()

      // Assert
      expect(isUser).toBe(true)
    })

    it('should return false for ADMIN', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const isUser = role!.isUser()

      // Assert
      expect(isUser).toBe(false)
    })
  })

  describe('canPerform', () => {
    it('should allow SUPER_ADMIN to perform ADMIN actions', () => {
      // Arrange
      const [error1, superAdmin] = Role.create({ value: 'SUPER_ADMIN' })
      const [error2, requiredRole] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const canPerform = superAdmin!.canPerform({ requiredRole: requiredRole! })

      // Assert
      expect(canPerform).toBe(true)
    })

    it('should allow ADMIN to perform USER actions', () => {
      // Arrange
      const [error1, admin] = Role.create({ value: 'ADMIN' })
      const [error2, requiredRole] = Role.create({ value: 'USER' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const canPerform = admin!.canPerform({ requiredRole: requiredRole! })

      // Assert
      expect(canPerform).toBe(true)
    })

    it('should not allow USER to perform ADMIN actions', () => {
      // Arrange
      const [error1, user] = Role.create({ value: 'USER' })
      const [error2, requiredRole] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const canPerform = user!.canPerform({ requiredRole: requiredRole! })

      // Assert
      expect(canPerform).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for same role', () => {
      // Arrange
      const [error1, role1] = Role.create({ value: 'ADMIN' })
      const [error2, role2] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const isEqual = role1!.equals({ other: role2! })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different roles', () => {
      // Arrange
      const [error1, role1] = Role.create({ value: 'ADMIN' })
      const [error2, role2] = Role.create({ value: 'USER' })

      // Assert
      expect(error1).toBeNull()
      expect(error2).toBeNull()

      // Act
      const isEqual = role1!.equals({ other: role2! })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act
      const str = role!.toString()

      // Assert
      expect(str).toBe('ADMIN')
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'USER' })

      // Assert
      expect(error).toBeNull()

      // Act
      const json = role!.toJSON()

      // Assert
      expect(json).toBe('USER')
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

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
      const [error, role] = Role.create({ value: 'ADMIN' })

      // Assert
      expect(error).toBeNull()

      // Act & Assert
      expect(role!.getValue()).toBe(UserRole.ADMIN)
      expect(role!.getValue()).toBe(UserRole.ADMIN) // Still the same
    })
  })
})
