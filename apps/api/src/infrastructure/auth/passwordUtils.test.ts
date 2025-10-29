import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from './passwordUtils'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2) // bcrypt uses salt, so hashes differ
    })

    it('should hash different passwords differently', async () => {
      const password1 = 'TestPassword123!'
      const password2 = 'DifferentPassword456!'

      const hash1 = await hashPassword(password1)
      const hash2 = await hashPassword(password2)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password against hash', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })

    it('should reject empty password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('', hash)

      expect(isValid).toBe(false)
    })

    it('should handle case-sensitive passwords correctly', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      const isValid = await verifyPassword('testpassword123!', hash)

      expect(isValid).toBe(false)
    })
  })
})
