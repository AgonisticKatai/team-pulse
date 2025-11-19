import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { ValidationError } from '../errors/index.js'
import { Email } from './Email.js'

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.valid

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.uppercase

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.withSpaces

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should accept various valid email formats', () => {
      // Arrange
      const validEmails = [
        TEST_CONSTANTS.emails.valid,
        TEST_CONSTANTS.emails.withDot,
        TEST_CONSTANTS.emails.withPlus,
        TEST_CONSTANTS.emails.withUnderscore,
        TEST_CONSTANTS.emails.withNumbers,
      ]

      // Act & Assert
      for (const emailString of validEmails) {
        const email = expectSuccess(Email.create({ value: emailString }))
        expect(email).toBeDefined()
      }
    })

    it('should fail with empty string', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.empty

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address is required')
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.whitespaceOnly

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address is required')
    })

    it('should fail with invalid format - no @', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.noAt

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with invalid format - no domain', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.noDomain

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with invalid format - no local part', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.noLocal

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with invalid format - no extension', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.noExtension

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with email exceeding 255 characters', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.tooLong

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address must not exceed 255 characters')
    })

    it('should accept email with exactly 255 characters', () => {
      // Arrange
      const emailString = TEST_CONSTANTS.emails.validExactly255

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue().length).toBe(255)
    })
  })

  describe('getValue', () => {
    it('should return the email value', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const value = email.getValue()

      // Assert
      expect(value).toBe('test@example.com')
    })
  })

  describe('getDomain', () => {
    it('should return domain part', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const domain = email.getDomain()

      // Assert
      expect(domain).toBe('example.com')
    })

    it('should handle subdomain', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.withSubdomain }))

      // Act
      const domain = email.getDomain()

      // Assert
      expect(domain).toBe('mail.example.com')
    })
  })

  describe('getLocalPart', () => {
    it('should return local part', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const localPart = email.getLocalPart()

      // Assert
      expect(localPart).toBe('test')
    })

    it('should handle complex local part', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.withPlus }))

      // Act
      const localPart = email.getLocalPart()

      // Assert
      expect(localPart).toBe('user+tag')
    })
  })

  describe('equals', () => {
    it('should return true for same email', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))
      const email2 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return true for same email with different casing', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))
      const email2 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.uppercase }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different emails', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))
      const email2 = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.withDot }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const str = email.toString()

      // Assert
      expect(str).toBe('test@example.com')
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act
      const json = email.toJSON()

      // Assert
      expect(json).toBe('test@example.com')
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))
      const obj = { email }

      // Act
      const jsonString = JSON.stringify(obj)

      // Assert
      expect(jsonString).toBe('{"email":"test@example.com"}')
    })
  })

  describe('Immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: TEST_CONSTANTS.emails.valid }))

      // Act & Assert
      // TypeScript should prevent modification of the value property
      // This test verifies the getValue() returns the same value
      expect(email.getValue()).toBe('test@example.com')
      expect(email.getValue()).toBe('test@example.com') // Still the same
    })
  })
})
