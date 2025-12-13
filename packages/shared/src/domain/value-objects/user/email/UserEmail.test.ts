import { ValidationError } from '@errors/ValidationError.js'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers.js'
import { describe, expect, it } from 'vitest'
import { UserEmail } from './UserEmail.js'
import { USER_EMAIL_RULES } from './UserEmail.rules.js'
import type { UserEmailInput } from './UserEmail.schema.js'

describe('UserEmail Value Object', () => {
  describe('create', () => {
    // ✅ HAPPY PATH
    it('should create a valid instance', () => {
      const input = faker.internet.email() satisfies UserEmailInput

      const userEmail = expectSuccess(UserEmail.create(input))

      expect(userEmail.value).toBe(input.toLowerCase())
      expect(userEmail.getValue()).toEqual(input.toLowerCase())
    })

    // -------------------------------------------------------------------------
    // 📏 BOUNDARY TESTING (Mathematical and Deterministic)
    // -------------------------------------------------------------------------

    it('should accept an email with exactly MIN_LENGTH', () => {
      // Defines the shortest possible email according to Zod and reality: '@a.co'
      // 1 user + 1 @ + 1 domain + 1 dot + 2 extension = 6
      const suffix = '@a.co'
      const userLength = USER_EMAIL_RULES.MIN_LENGTH - suffix.length

      const user = faker.string.alpha(userLength)
      const minEmail = `${user}${suffix}` satisfies UserEmailInput

      expect(minEmail.length).toBe(USER_EMAIL_RULES.MIN_LENGTH)

      const userEmail = expectSuccess(UserEmail.create(minEmail))
      expect(userEmail.value).toBe(minEmail.toLowerCase())
    })

    it('should accept an email with exactly MAX_LENGTH', () => {
      const suffix = '@example.com'
      const userLength = USER_EMAIL_RULES.MAX_LENGTH - suffix.length

      const user = faker.string.alpha(userLength)
      const maxEmail = `${user}${suffix}` satisfies UserEmailInput

      expect(maxEmail.length).toBe(USER_EMAIL_RULES.MAX_LENGTH)

      const userEmail = expectSuccess(UserEmail.create(maxEmail))
      expect(userEmail.value).toBe(maxEmail.toLowerCase())
    })

    // -------------------------------------------------------------------------
    // ❌ ERROR CASES (Isolation of rules)
    // -------------------------------------------------------------------------

    it('should return ValidationError if address is shorter than MIN_LENGTH', () => {
      // Generates a 5-character email (now invalid by both length and format)
      const input = faker.string.alpha(USER_EMAIL_RULES.MIN_LENGTH - 1) satisfies UserEmailInput

      expectErrorType({ errorType: ValidationError, result: UserEmail.create(input) })
    })

    it('should return ValidationError if address is longer than MAX_LENGTH', () => {
      // Generates a 256-character email (now invalid by both length and format)
      const input = faker.string.alpha(USER_EMAIL_RULES.MAX_LENGTH + 1) satisfies UserEmailInput

      expectErrorType({ errorType: ValidationError, result: UserEmail.create(input) })
    })

    // Manual format tests (without Faker, to be explicit)
    it('should return ValidationError if format is invalid', () => {
      const invalidInputs = [
        '', // Empty
        'plainaddress', // No @
        '@example.com', // No user
        'user@', // No domain
        'user@domain', // No TLD (Zod usually requests it)
        'a b@test.com', // Spaces inside
      ] as UserEmailInput[]

      for (const invalid of invalidInputs) {
        expectErrorType({ errorType: ValidationError, result: UserEmail.create(invalid) })
      }
    })
  })
})
