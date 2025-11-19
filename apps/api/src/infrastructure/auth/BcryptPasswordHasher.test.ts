import { describe, expect, it } from 'vitest'
import { expectSuccess, TEST_CONSTANTS } from '../testing/index.js'
import { BcryptPasswordHasher } from './BcryptPasswordHasher.js'

describe('BcryptPasswordHasher', () => {
  describe('create factory method', () => {
    it('should create instance with default salt rounds', () => {
      // Act
      const hasher = BcryptPasswordHasher.create()

      // Assert
      expect(hasher).toBeDefined()
      expect(hasher).toBeInstanceOf(BcryptPasswordHasher)
    })

    it('should create instance with custom salt rounds', () => {
      // Arrange
      const customSaltRounds = 12

      // Act
      const hasher = BcryptPasswordHasher.create({ saltRounds: customSaltRounds })

      // Assert
      expect(hasher).toBeDefined()
      expect(hasher).toBeInstanceOf(BcryptPasswordHasher)
    })

    it('should create instance with minimal salt rounds for testing', () => {
      // Arrange
      const minimalSaltRounds = 4

      // Act
      const hasher = BcryptPasswordHasher.create({ saltRounds: minimalSaltRounds })

      // Assert
      expect(hasher).toBeDefined()
      expect(hasher).toBeInstanceOf(BcryptPasswordHasher)
    })
  })

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 }) // Low rounds for fast tests
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/) // bcrypt hash format
    })

    it('should generate different hashes for the same password due to salt', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const result1 = await hasher.hash({ password })
      const result2 = await hasher.hash({ password })

      // Assert
      const hash1 = expectSuccess(result1)
      const hash2 = expectSuccess(result2)
      expect(hash1).not.toBe(hash2) // bcrypt uses different salt each time
    })

    it('should hash different passwords differently', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password1 = TEST_CONSTANTS.passwords.test
      const password2 = TEST_CONSTANTS.passwords.different

      // Act
      const result1 = await hasher.hash({ password: password1 })
      const result2 = await hasher.hash({ password: password2 })

      // Assert
      const hash1 = expectSuccess(result1)
      const hash2 = expectSuccess(result2)
      expect(hash1).not.toBe(hash2)
    })

    it('should hash empty password', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = ''

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('should hash long password', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = 'a'.repeat(100)

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('should hash password with special characters', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?'

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('should hash password with unicode characters', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = 'パスワード123'

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })
  })

  describe('verify', () => {
    it('should verify correct password against hash', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test
      const wrongPassword = TEST_CONSTANTS.passwords.wrong
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password: wrongPassword, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(false)
    })

    it('should reject empty password when hash is for non-empty password', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password: '', hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(false)
    })

    it('should handle case-sensitive passwords correctly', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password: TEST_CONSTANTS.passwords.lowercase, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(false)
    })

    it('should verify password with special characters', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = 'P@ssw0rd!#$%'
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(true)
    })

    it('should verify password with unicode characters', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = 'パスワード123'
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(true)
    })

    it('should return false for invalid hash format', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test
      const invalidHash = 'not-a-valid-bcrypt-hash'

      // Act
      const result = await hasher.verify({ password, hash: invalidHash })

      // Assert - bcrypt.compare returns false for invalid hashes instead of throwing
      const isValid = expectSuccess(result)
      expect(isValid).toBe(false)
    })

    it('should verify empty password against hash of empty password', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = ''
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(true)
    })
  })

  describe('Different instances with same salt rounds', () => {
    it('should verify hash created by different instance with same salt rounds', async () => {
      // Arrange
      const hasher1 = BcryptPasswordHasher.create({ saltRounds: 4 })
      const hasher2 = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const hashResult = await hasher1.hash({ password })
      const hash = expectSuccess(hashResult)
      const verifyResult = await hasher2.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(verifyResult)
      expect(isValid).toBe(true)
    })
  })

  describe('Different instances with different salt rounds', () => {
    it('should verify hash created with different salt rounds', async () => {
      // Arrange
      const hasher4 = BcryptPasswordHasher.create({ saltRounds: 4 })
      const hasher10 = BcryptPasswordHasher.create({ saltRounds: 10 })
      const password = TEST_CONSTANTS.passwords.test

      // Act - Hash with 4 rounds, verify with instance configured for 10 rounds
      const hashResult = await hasher4.hash({ password })
      const hash = expectSuccess(hashResult)
      const verifyResult = await hasher10.verify({ password, hash })

      // Assert - Verification should still work regardless of instance configuration
      const isValid = expectSuccess(verifyResult)
      expect(isValid).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle very long password (72+ characters)', async () => {
      // Arrange - bcrypt truncates to 72 characters
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const longPassword = 'a'.repeat(100)
      const truncatedPassword = 'a'.repeat(72)

      // Act
      const hashResult = await hasher.hash({ password: longPassword })
      const hash = expectSuccess(hashResult)

      // Assert - First 72 chars should match
      const verifyLongResult = await hasher.verify({ password: longPassword, hash })
      const verifyTruncatedResult = await hasher.verify({ password: truncatedPassword, hash })

      expect(expectSuccess(verifyLongResult)).toBe(true)
      expect(expectSuccess(verifyTruncatedResult)).toBe(true)
    })

    it('should handle password with null bytes', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const password = 'test\x00password'

      // Act
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)
      const verifyResult = await hasher.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(verifyResult)
      expect(isValid).toBe(true)
    })
  })

  describe('Security properties', () => {
    it('should produce hash of consistent length regardless of input', async () => {
      // Arrange
      const hasher = BcryptPasswordHasher.create({ saltRounds: 4 })
      const shortPassword = 'ab'
      const longPassword = 'a'.repeat(50)

      // Act
      const hashResult1 = await hasher.hash({ password: shortPassword })
      const hashResult2 = await hasher.hash({ password: longPassword })

      // Assert
      const hash1 = expectSuccess(hashResult1)
      const hash2 = expectSuccess(hashResult2)
      expect(hash1.length).toBe(hash2.length) // bcrypt always produces 60-char hash
    })

    it('should include salt rounds in hash', async () => {
      // Arrange
      const hasher4 = BcryptPasswordHasher.create({ saltRounds: 4 })
      const hasher10 = BcryptPasswordHasher.create({ saltRounds: 10 })
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const hashResult4 = await hasher4.hash({ password })
      const hashResult10 = await hasher10.hash({ password })

      // Assert
      const hash4 = expectSuccess(hashResult4)
      const hash10 = expectSuccess(hashResult10)
      expect(hash4).toContain('$04$') // 4 rounds
      expect(hash10).toContain('$10$') // 10 rounds
    })
  })
})
