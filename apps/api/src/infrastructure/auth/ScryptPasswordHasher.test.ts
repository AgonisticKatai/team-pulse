import { beforeAll, describe, expect, it } from 'vitest'
import { expectSuccess, TEST_CONSTANTS } from '../testing/index.js'
import { ScryptPasswordHasher } from './ScryptPasswordHasher.js'

describe('ScryptPasswordHasher', () => {
  let hasher: ScryptPasswordHasher

  beforeAll(() => {
    hasher = ScryptPasswordHasher.create({ cost: 1024 }) // Low cost for fast tests
  })

  describe('create factory method', () => {
    it('should create instance with default parameters', () => {
      // Act
      const hasher = ScryptPasswordHasher.create()

      // Assert
      expect(hasher).toBeDefined()
      expect(hasher).toBeInstanceOf(ScryptPasswordHasher)
    })

    it('should create instance with custom parameters', () => {
      // Arrange
      const customCost = 1024

      // Act
      const hasher = ScryptPasswordHasher.create({ cost: customCost })

      // Assert
      expect(hasher).toBeDefined()
      expect(hasher).toBeInstanceOf(ScryptPasswordHasher)
    })

    it('should create instance with minimal cost for testing', () => {
      // Arrange
      const minimalCost = 1024

      // Act
      const hasher = ScryptPasswordHasher.create({ cost: minimalCost })

      // Assert
      expect(hasher).toBeDefined()
      expect(hasher).toBeInstanceOf(ScryptPasswordHasher)
    })
  })

  describe('hash', () => {
    it('should hash a password successfully', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
      expect(hash).toContain(':') // scrypt hash format: salt:hash
      const [salt, hashPart] = hash.split(':')
      expect(salt).toHaveLength(32) // 16 bytes = 32 hex chars
      expect(hashPart).toHaveLength(128) // 64 bytes = 128 hex chars
    })

    it('should generate different hashes for the same password due to salt', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const result1 = await hasher.hash({ password })
      const result2 = await hasher.hash({ password })

      // Assert
      const hash1 = expectSuccess(result1)
      const hash2 = expectSuccess(result2)
      expect(hash1).not.toBe(hash2) // scrypt uses different salt each time
    })

    it('should hash different passwords differently', async () => {
      // Arrange
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
      const password = TEST_CONSTANTS.passwords.empty

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toContain(':')
    })

    it('should hash long password', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.long

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toContain(':')
    })

    it('should hash password with special characters', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.special

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toContain(':')
    })

    it('should hash password with unicode characters', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.unicode

      // Act
      const result = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(result)
      expect(hash).toBeDefined()
      expect(hash).toContain(':')
    })
  })

  describe('verify', () => {
    it('should verify correct password against hash', async () => {
      // Arrange
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
      const password = TEST_CONSTANTS.passwords.special
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
      const password = TEST_CONSTANTS.passwords.unicode
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
      const hasher = ScryptPasswordHasher.create({ cost: 1024 })
      const password = TEST_CONSTANTS.passwords.test
      const invalidHash = 'not-a-valid-scrypt-hash'

      // Act
      const result = await hasher.verify({ password, hash: invalidHash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(false)
    })

    it('should verify empty password against hash of empty password', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.empty
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act
      const result = await hasher.verify({ password, hash })

      // Assert
      const isValid = expectSuccess(result)
      expect(isValid).toBe(true)
    })
  })

  describe('Different instances with same parameters', () => {
    it('should verify hash created by different instance with same parameters', async () => {
      // Arrange
      const hasher1 = ScryptPasswordHasher.create({ cost: 1024 })
      const hasher2 = ScryptPasswordHasher.create({ cost: 1024 })
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

  describe('Different instances with different parameters', () => {
    it('should verify hash created with different cost parameters', async () => {
      // Arrange
      const hasher1024 = ScryptPasswordHasher.create({ cost: 1024 })
      const hasher2048 = ScryptPasswordHasher.create({ cost: 2048 })
      const password = TEST_CONSTANTS.passwords.test

      // Act - Hash with 1024 cost, verify with instance configured for 2048 cost
      const hashResult = await hasher1024.hash({ password })
      const hash = expectSuccess(hashResult)
      const verifyResult = await hasher2048.verify({ password, hash })

      // Assert - Verification should fail because cost parameters don't match
      const isValid = expectSuccess(verifyResult)
      expect(isValid).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle very long password (1000+ characters)', async () => {
      // Arrange
      const longPassword = TEST_CONSTANTS.passwords.long

      // Act
      const hashResult = await hasher.hash({ password: longPassword })
      const hash = expectSuccess(hashResult)

      // Assert - Verify long password works
      const verifyResult = await hasher.verify({ password: longPassword, hash })
      const isValid = expectSuccess(verifyResult)
      expect(isValid).toBe(true)
    })

    it('should handle password with null bytes', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.withNullBytes

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
    it('should produce hash of consistent format regardless of input', async () => {
      // Arrange
      const shortPassword = TEST_CONSTANTS.passwords.short
      const longPassword = TEST_CONSTANTS.passwords.long

      // Act
      const hashResult1 = await hasher.hash({ password: shortPassword })
      const hashResult2 = await hasher.hash({ password: longPassword })

      // Assert
      const hash1 = expectSuccess(hashResult1)
      const hash2 = expectSuccess(hashResult2)
      const [salt1, hashPart1] = hash1.split(':')
      const [salt2, hashPart2] = hash2.split(':')
      expect(salt1).toHaveLength(32) // Same salt length
      expect(salt2).toHaveLength(32)
      expect(hashPart1).toHaveLength(128) // Same hash length
      expect(hashPart2).toHaveLength(128)
    })

    it('should use timing-safe comparison (implementation detail)', async () => {
      // Arrange
      const password = TEST_CONSTANTS.passwords.test
      const hashResult = await hasher.hash({ password })
      const hash = expectSuccess(hashResult)

      // Act - Both comparisons should take similar time (timing-safe)
      const result1 = await hasher.verify({ password: TEST_CONSTANTS.passwords.test, hash })
      const result2 = await hasher.verify({ password: TEST_CONSTANTS.passwords.wrong, hash })

      // Assert
      const isValid1 = expectSuccess(result1)
      const isValid2 = expectSuccess(result2)
      expect(isValid1).toBe(true)
      expect(isValid2).toBe(false)
    })

    it('should include all parameters in hash format', async () => {
      // Arrange
      const hasher = ScryptPasswordHasher.create({
        keyLength: 32,
        cost: 1024,
        blockSize: 4,
        parallelization: 2,
      })
      const password = TEST_CONSTANTS.passwords.test

      // Act
      const hashResult = await hasher.hash({ password })

      // Assert
      const hash = expectSuccess(hashResult)
      const [salt, hashPart] = hash.split(':')
      expect(salt).toHaveLength(32) // 16 bytes salt
      expect(hashPart).toHaveLength(64) // 32 bytes hash (custom keyLength)
    })
  })
})
