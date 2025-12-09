import { ValidationError } from '@errors/ValidationError.js'
import { expectErrorType, expectSuccess } from '@testing/helpers.js'
import { describe, expect, it } from 'vitest'
import { USER_ROLES } from './UserRole.constants.js'
import { UserRole } from './UserRole.js'
import type { UserRoleInput } from './UserRole.schema.js'

describe('UserRole Value Object', () => {
  describe('create', () => {
    // -------------------------------------------------------------------------
    // ✅ EXHAUSTIVE HAPPY PATH (Data Driven Testing)
    // -------------------------------------------------------------------------

    it.each(Object.values(USER_ROLES))('should create a valid instance for role: "%s"', (role) => {
      // Arrange
      const input = { name: role } satisfies UserRoleInput

      // Act
      const userRole = expectSuccess(UserRole.create(input))

      // Assert
      expect(userRole).toBeInstanceOf(UserRole)
      expect(userRole.name).toBe(role)
      expect(userRole.getValue()).toEqual({ name: role })
    })

    // -------------------------------------------------------------------------
    // 🧠 DOMAIN LOGIC
    // -------------------------------------------------------------------------

    it('should correctly identify ADMIN role', () => {
      const admin = expectSuccess(UserRole.create({ name: USER_ROLES.ADMIN }))
      const guest = expectSuccess(UserRole.create({ name: USER_ROLES.GUEST }))

      expect(admin.isAdmin()).toBe(true)
      expect(guest.isAdmin()).toBe(false)
    })

    // -------------------------------------------------------------------------
    // ❌ ERROR CASES
    // -------------------------------------------------------------------------

    it('should return ValidationError if role is not in the allowed list', () => {
      expectErrorType({
        errorType: ValidationError,
        // @ts-expect-error
        result: UserRole.create({ name: 'mega_admin' }),
      })
    })

    it('should return ValidationError if role is case sensitive (Admin != admin)', () => {
      expectErrorType({
        errorType: ValidationError,
        // @ts-expect-error
        result: UserRole.create({ name: 'Admin' }),
      })
    })

    it('should return ValidationError if input is not a string', () => {
      expectErrorType({
        errorType: ValidationError,
        // @ts-expect-error
        result: UserRole.create({ name: 12345 }),
      })
    })
  })
})
