import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess } from '../../infrastructure/testing/result-helpers.js'
import { ValidationError } from '../errors/index.js'
import { Email } from './Email.js'

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create valid email', () => {
      // Arrange
      const emailString = 'test@example.com'

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should normalize email to lowercase', () => {
      // Arrange
      const emailString = 'Test@EXAMPLE.COM'

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should trim whitespace', () => {
      // Arrange
      const emailString = '  test@example.com  '

      // Act
      const email = expectSuccess(Email.create({ value: emailString }))

      // Assert
      expect(email).toBeDefined()
      expect(email.getValue()).toBe('test@example.com')
    })

    it('should accept various valid email formats', () => {
      // Arrange
      const validEmails = [
        'simple@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@test123.com',
      ]

      // Act & Assert
      for (const emailString of validEmails) {
        const email = expectSuccess(Email.create({ value: emailString }))
        expect(email).toBeDefined()
      }
    })

    it('should fail with empty string', () => {
      // Arrange
      const emailString = ''

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address is required')
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const emailString = '   '

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address is required')
    })

    it('should fail with invalid format - no @', () => {
      // Arrange
      const emailString = 'notanemail.com'

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with invalid format - no domain', () => {
      // Arrange
      const emailString = 'user@'

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with invalid format - no local part', () => {
      // Arrange
      const emailString = '@example.com'

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with invalid format - no extension', () => {
      // Arrange
      const emailString = 'user@domain'

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address format is invalid')
    })

    it('should fail with email exceeding 255 characters', () => {
      // Arrange
      const localPart = 'a'.repeat(250)
      const emailString = `${localPart}@example.com` // > 255 chars

      // Act
      const error = expectError(Email.create({ value: emailString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Email address must not exceed 255 characters')
    })

    it('should accept email with exactly 255 characters', () => {
      // Arrange
      // Create email with exactly 255 chars: 243 + '@' + 'example.com' = 255
      const localPart = 'a'.repeat(243)
      const emailString = `${localPart}@example.com`

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
      const email = expectSuccess(Email.create({ value: 'test@example.com' }))

      // Act
      const value = email.getValue()

      // Assert
      expect(value).toBe('test@example.com')
    })
  })

  describe('getDomain', () => {
    it('should return domain part', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'user@example.com' }))

      // Act
      const domain = email.getDomain()

      // Assert
      expect(domain).toBe('example.com')
    })

    it('should handle subdomain', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'user@mail.example.com' }))

      // Act
      const domain = email.getDomain()

      // Assert
      expect(domain).toBe('mail.example.com')
    })
  })

  describe('getLocalPart', () => {
    it('should return local part', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'username@example.com' }))

      // Act
      const localPart = email.getLocalPart()

      // Assert
      expect(localPart).toBe('username')
    })

    it('should handle complex local part', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'user.name+tag@example.com' }))

      // Act
      const localPart = email.getLocalPart()

      // Assert
      expect(localPart).toBe('user.name+tag')
    })
  })

  describe('equals', () => {
    it('should return true for same email', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: 'test@example.com' }))
      const email2 = expectSuccess(Email.create({ value: 'test@example.com' }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return true for same email with different casing', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: 'test@example.com' }))
      const email2 = expectSuccess(Email.create({ value: 'TEST@EXAMPLE.COM' }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different emails', () => {
      // Arrange
      const email1 = expectSuccess(Email.create({ value: 'test1@example.com' }))
      const email2 = expectSuccess(Email.create({ value: 'test2@example.com' }))

      // Act
      const isEqual = email1.equals({ other: email2 })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'test@example.com' }))

      // Act
      const str = email.toString()

      // Assert
      expect(str).toBe('test@example.com')
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'test@example.com' }))

      // Act
      const json = email.toJSON()

      // Assert
      expect(json).toBe('test@example.com')
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const email = expectSuccess(Email.create({ value: 'test@example.com' }))
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
      const email = expectSuccess(Email.create({ value: 'test@example.com' }))

      // Act & Assert
      // TypeScript should prevent modification of the value property
      // This test verifies the getValue() returns the same value
      expect(email.getValue()).toBe('test@example.com')
      expect(email.getValue()).toBe('test@example.com') // Still the same
    })
  })
})
