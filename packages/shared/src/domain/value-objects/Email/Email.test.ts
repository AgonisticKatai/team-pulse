import { VALIDATION_MESSAGES } from '@team-pulse/shared/constants/validation'
import { ValidationError } from '@team-pulse/shared/errors'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { Email } from './Email'

describe('Email', () => {
  const { emails } = TEST_CONSTANTS

  describe('create', () => {
    it('should create an Email from a valid email string', () => {
      // Act
      const result = Email.create({ value: emails.valid })

      // Assert
      const email = expectSuccess(result)
      expect(email.getValue()).toBe(emails.valid)
    })

    it('should normalize email by trimming and lowercasing', () => {
      // Arrange
      const expected = 'test@example.com' // Expected normalized value

      // Act
      const result = Email.create({ value: emails.withSpaces })

      // Assert
      const email = expectSuccess(result)
      expect(email.getValue()).toBe(expected)
    })

    it('should normalize uppercase email to lowercase', () => {
      // Act
      const result = Email.create({ value: emails.uppercase })

      // Assert
      const email = expectSuccess(result)
      expect(email.getValue()).toBe(emails.valid)
    })

    it('should return ValidationError for empty string', () => {
      // Act
      const result = Email.create({ value: emails.empty })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.TOO_SHORT)
    })

    it('should return ValidationError for whitespace only', () => {
      // Act
      const result = Email.create({ value: emails.whitespaceOnly })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.TOO_SHORT)
    })

    it('should return ValidationError for invalid format without @', () => {
      // Act
      const result = Email.create({ value: emails.noAt })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT)
    })

    it('should return ValidationError for missing local part', () => {
      // Act
      const result = Email.create({ value: emails.noLocal })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT)
    })

    it('should return ValidationError for missing domain', () => {
      // Act
      const result = Email.create({ value: emails.noDomain })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT)
    })

    it('should return ValidationError for email exceeding 255 characters', () => {
      // Act
      const result = Email.create({ value: emails.tooLong })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.TOO_LONG)
    })

    it('should accept valid email with subdomain', () => {
      // Act
      const result = Email.create({ value: emails.withSubdomain })

      // Assert
      const email = expectSuccess(result)
      expect(email.getValue()).toBe(emails.withSubdomain)
    })

    it('should accept valid email with plus sign', () => {
      // Act
      const result = Email.create({ value: emails.withPlus })

      // Assert
      const email = expectSuccess(result)
      expect(email.getValue()).toBe(emails.withPlus)
    })

    it('should accept valid email with numbers', () => {
      // Act
      const result = Email.create({ value: emails.withNumbers })

      // Assert
      const email = expectSuccess(result)
      expect(email.getValue()).toBe(emails.withNumbers)
    })
  })

  describe('validate', () => {
    it('should validate a correct email', () => {
      // Act
      const result = Email.validate({ value: emails.valid })

      // Assert
      const value = expectSuccess(result)
      expect(value).toBe(emails.valid)
    })

    it('should return error for invalid email', () => {
      // Act
      const result = Email.validate({ value: emails.noAt })

      // Assert
      const error = expectErrorType({ errorType: ValidationError, result })
      expect(error.message).toBe(VALIDATION_MESSAGES.SPECIFIC.EMAIL.INVALID_FORMAT)
    })
  })

  describe('isValid', () => {
    it('should return true for valid email', () => {
      // Assert
      expect(Email.isValid({ value: emails.valid })).toBe(true)
    })

    it('should return true for email with subdomain', () => {
      // Assert
      expect(Email.isValid({ value: emails.withSubdomain })).toBe(true)
    })

    it('should return false for invalid email', () => {
      // Assert
      expect(Email.isValid({ value: emails.noAt })).toBe(false)
    })

    it('should return false for empty string', () => {
      // Assert
      expect(Email.isValid({ value: emails.empty })).toBe(false)
    })

    it('should return false for email without domain', () => {
      // Assert
      expect(Email.isValid({ value: emails.noDomain })).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for equal emails', () => {
      // Arrange
      const result1 = Email.create({ value: emails.valid })
      const result2 = Email.create({ value: emails.valid })

      // Act
      const email1 = expectSuccess(result1)
      const email2 = expectSuccess(result2)

      // Assert
      expect(email1.equals({ other: email2 })).toBe(true)
    })

    it('should return true for emails that normalize to same value', () => {
      // Arrange
      const result1 = Email.create({ value: emails.valid })
      const result2 = Email.create({ value: emails.uppercase })

      // Act
      const email1 = expectSuccess(result1)
      const email2 = expectSuccess(result2)

      // Assert
      expect(email1.equals({ other: email2 })).toBe(true)
    })

    it('should return false for different emails', () => {
      // Arrange
      const result1 = Email.create({ value: emails.valid })
      const result2 = Email.create({ value: emails.nonexistent })

      // Act
      const email1 = expectSuccess(result1)
      const email2 = expectSuccess(result2)

      // Assert
      expect(email1.equals({ other: email2 })).toBe(false)
    })
  })

  describe('getValue', () => {
    it('should return the normalized email value', () => {
      // Arrange
      const result = Email.create({ value: emails.valid })
      const email = expectSuccess(result)

      // Act & Assert
      expect(email.getValue()).toBe(emails.valid)
    })

    it('should return immutable value', () => {
      // Arrange
      const result = Email.create({ value: emails.valid })
      const email = expectSuccess(result)

      // Act
      const value1 = email.getValue()
      const value2 = email.getValue()

      // Assert
      expect(value1).toBe(value2)
      expect(value1).toBe(emails.valid)
    })
  })

  describe('toString', () => {
    it('should return the email as string', () => {
      // Arrange
      const result = Email.create({ value: emails.valid })
      const email = expectSuccess(result)

      // Act & Assert
      expect(email.toString()).toBe(emails.valid)
    })

    it('should return same value as getValue', () => {
      // Arrange
      const result = Email.create({ value: emails.valid })
      const email = expectSuccess(result)

      // Act & Assert
      expect(email.toString()).toBe(email.getValue())
    })
  })
})
