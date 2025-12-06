import { VALIDATION_MESSAGES } from '@team-pulse/shared/constants/validation'
import { ValidationError } from '@team-pulse/shared/errors'
import { expectErrorType, expectSuccess } from '@testing/helpers'
import { describe, expect, it } from 'vitest'
import { UserRoles } from './Role.constants.js'
import { Role } from './Role.js'

describe('Role Value Object', () => {
  describe('create', () => {
    it.each(Object.values(UserRoles))('should create a valid role for %s', (roleValue) => {
      // Act
      const result = Role.create({ value: roleValue })

      // Assert
      const role = expectSuccess(result)

      expect(role).toBeInstanceOf(Role)
      expect(role.getValue()).toBe(roleValue)
    })

    it('should fail when creating a role with invalid string', () => {
      // Act
      const result = Role.create({ value: 'INVALID_POTATO_ROLE' })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })

      expect(error.message).toContain(VALIDATION_MESSAGES.SPECIFIC.ROLE.INVALID_OPTION)
    })

    it('should fail when creating a role with empty string', () => {
      const result = Role.create({ value: '' })
      expectErrorType({ errorType: ValidationError, result })
    })
  })

  describe('equals', () => {
    it('should return true for different instances with same value', () => {
      // Act
      const role1Result = Role.create({ value: UserRoles.Admin })
      const role2Result = Role.create({ value: UserRoles.Admin })

      const role1 = expectSuccess(role1Result)
      const role2 = expectSuccess(role2Result)

      // Assert
      expect(role1.equals({ other: role2 })).toBe(true)
    })

    it('should return false for different values', () => {
      // Act
      const adminResult = Role.create({ value: UserRoles.Admin })
      const userResult = Role.create({ value: UserRoles.User })

      if (!(adminResult.ok && userResult.ok)) throw new Error('Setup failed')

      // Assert
      expect(adminResult.value.equals({ other: userResult.value })).toBe(false)
    })
  })

  describe('utilities', () => {
    it('toString should return the raw string value', () => {
      // Act
      const result = Role.create({ value: UserRoles.SuperAdmin })
      const role = expectSuccess(result)

      // Assert
      expect(role.toString()).toBe(UserRoles.SuperAdmin)
    })

    it('getValue should return the strict UserRoleType', () => {
      // Act
      const result = Role.create({ value: UserRoles.SuperAdmin })
      const role = expectSuccess(result)

      // Assert
      const value = role.getValue()
      expect(value).toBe(UserRoles.SuperAdmin)
    })
  })

  describe('business logic', () => {
    it('isAdmin should return true only for Admin', () => {
      // Act
      const admin = expectSuccess(Role.create({ value: UserRoles.Admin }))
      const superAdmin = expectSuccess(Role.create({ value: UserRoles.SuperAdmin }))
      const user = expectSuccess(Role.create({ value: UserRoles.User }))

      // Assert
      expect(admin.isAdmin()).toBe(true)
      expect(superAdmin.isAdmin()).toBe(false)
      expect(user.isAdmin()).toBe(false)
    })

    it('isSuperAdmin should return true only for SuperAdmin', () => {
      // Act
      const admin = expectSuccess(Role.create({ value: UserRoles.Admin }))
      const superAdmin = expectSuccess(Role.create({ value: UserRoles.SuperAdmin }))
      const user = expectSuccess(Role.create({ value: UserRoles.User }))

      // Assert
      expect(superAdmin.isSuperAdmin()).toBe(true)
      expect(admin.isSuperAdmin()).toBe(false)
      expect(user.isSuperAdmin()).toBe(false)
    })

    it('isUser should return true only for User', () => {
      // Act
      const admin = expectSuccess(Role.create({ value: UserRoles.Admin }))
      const superAdmin = expectSuccess(Role.create({ value: UserRoles.SuperAdmin }))
      const user = expectSuccess(Role.create({ value: UserRoles.User }))

      // Assert
      expect(user.isUser()).toBe(true)
      expect(admin.isUser()).toBe(false)
      expect(superAdmin.isUser()).toBe(false)
    })
  })
})
