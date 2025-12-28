import { faker } from '@faker-js/faker'
import { User } from '@features/users/domain/models/user/User.js'
import { buildCreateUserDTO, buildUser } from '@shared/testing/builders/user-builders.js'
import { ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { describe, expect, it } from 'vitest'

describe('User Entity', () => {
  // ===========================================================================
  // 1. CREATE (Factory & Validation)
  // ===========================================================================
  describe('create', () => {
    it('should create a valid User instance with full data', () => {
      const input = buildCreateUserDTO()

      const result = User.create({ ...input, id: faker.string.uuid(), passwordHash: 'hashed-password' })

      const user = expectSuccess(result)
      expect(user).toBeInstanceOf(User)
      expect(user.id).toBeDefined()
      expect(user.email.getValue()).toBe(input.email.toLowerCase())
    })

    it('should fail if any inner Value Object is invalid (Fail Fast)', () => {
      const input = buildCreateUserDTO({ email: 'invalid-email' })
      const result = User.create({ ...input, id: faker.string.uuid(), passwordHash: 'hashed-password' })

      expectErrorType({ errorType: ValidationError, result })
    })
  })

  // ===========================================================================
  // 2. UPDATE (Immutability & Merge Logic)
  // ===========================================================================
  describe('update', () => {
    it('should update email and return a NEW instance', () => {
      // Arrange
      const user = buildUser({ updatedAt: faker.date.past() })
      const newEmail = 'updated@example.com'

      // Act
      const result = user.update({ email: newEmail })

      // Assert
      const updatedUser = expectSuccess(result)

      expect(updatedUser).not.toBe(user) // Immutability
      expect(updatedUser.id).toBe(user.id) // Identity preserved
      expect(updatedUser.email.getValue()).toBe(newEmail) // Change applied
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime()) // Audit updated
    })

    it('should IGNORE undefined fields (Keep original value)', () => {
      const originalEmail = 'original@example.com'
      const user = buildUser({ email: originalEmail })

      // Act
      const updatedUser = expectSuccess(user.update({ email: undefined }))

      // Assert
      expect(updatedUser.email.getValue()).toBe(originalEmail)
    })

    it('should fail if the update creates an invalid state', () => {
      const user = buildUser()

      // Act: Try to update with an invalid email (empty)
      const result = user.update({ email: '' })

      // Assert
      expectErrorType({ errorType: ValidationError, result })
    })
  })

  // ===========================================================================
  // 3. SERIALIZATION
  // ===========================================================================
  describe('toPrimitives', () => {
    it('should return a plain object matching the internal state', () => {
      const user = buildUser()
      const primitives = user.toPrimitives()

      expect(primitives.id).toBe(user.id)
      expect(primitives.email).toBe(user.email.getValue())
      expect(primitives.role).toBe(user.role.getValue())
      expect(primitives.createdAt).toBeInstanceOf(Date)
      expect(primitives.updatedAt).toBeInstanceOf(Date)
    })

    it('should NOT include password hash in primitives', () => {
      const user = buildUser({ passwordHash: 'secret-hash' })
      const primitives = user.toPrimitives()

      expect(primitives).not.toHaveProperty('passwordHash')
      expect(JSON.stringify(primitives)).not.toContain('secret-hash')
    })
  })
})
