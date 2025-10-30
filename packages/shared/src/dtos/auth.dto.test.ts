import { describe, expect, it } from 'vitest'
import { CreateUserDTOSchema, LoginDTOSchema, RefreshTokenDTOSchema } from './auth.dto.js'

describe('Auth DTOs', () => {
  describe('LoginDTOSchema', () => {
    describe('valid cases', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'user@example.com',
          password: 'securePassword123',
        }

        const result = LoginDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.email).toBe('user@example.com')
          expect(result.data.password).toBe('securePassword123')
        }
      })

      it('should trim and lowercase email', () => {
        const data = {
          email: '  USER@EXAMPLE.COM  ',
          password: 'password',
        }

        const result = LoginDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.email).toBe('user@example.com')
        }
      })
    })

    describe('invalid cases', () => {
      it('should reject invalid email format', () => {
        const invalidData = {
          email: 'not-an-email',
          password: 'password123',
        }

        const result = LoginDTOSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].message).toBe('Invalid email format')
        }
      })

      it('should reject empty password', () => {
        const invalidData = {
          email: 'user@example.com',
          password: '',
        }

        const result = LoginDTOSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].message).toBe('Password is required')
        }
      })

      it('should reject missing fields', () => {
        const result = LoginDTOSchema.safeParse({})
        expect(result.success).toBe(false)
      })
    })
  })

  describe('CreateUserDTOSchema', () => {
    describe('valid cases', () => {
      it('should validate correct user data', () => {
        const validData = {
          email: 'newuser@example.com',
          password: 'SecurePass123',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.email).toBe('newuser@example.com')
          expect(result.data.role).toBe('USER')
        }
      })

      it('should accept ADMIN role', () => {
        const data = {
          email: 'admin@example.com',
          password: 'AdminPass123',
          role: 'ADMIN',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept SUPER_ADMIN role', () => {
        const data = {
          email: 'super@example.com',
          password: 'SuperPass123',
          role: 'SUPER_ADMIN',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('email validation', () => {
      it('should reject invalid email', () => {
        const data = {
          email: 'invalid-email',
          password: 'ValidPass123',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].message).toBe('Invalid email format')
        }
      })

      it('should trim and lowercase email', () => {
        const data = {
          email: '  TEST@EXAMPLE.COM  ',
          password: 'ValidPass123',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.email).toBe('test@example.com')
        }
      })
    })

    describe('password validation', () => {
      it('should reject password shorter than 8 characters', () => {
        const data = {
          email: 'user@example.com',
          password: 'Pass1',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].message).toBe('Password must be at least 8 characters')
        }
      })

      it('should reject password longer than 100 characters', () => {
        const data = {
          email: 'user@example.com',
          password: `${'A'.repeat(101)}a1`,
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].message).toBe('Password cannot exceed 100 characters')
        }
      })

      it('should reject password without uppercase letter', () => {
        const data = {
          email: 'user@example.com',
          password: 'password123',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          const uppercaseError = result.error.issues.find((issue) =>
            issue.message.includes('uppercase'),
          )
          expect(uppercaseError).toBeDefined()
        }
      })

      it('should reject password without lowercase letter', () => {
        const data = {
          email: 'user@example.com',
          password: 'PASSWORD123',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          const lowercaseError = result.error.issues.find((issue) =>
            issue.message.includes('lowercase'),
          )
          expect(lowercaseError).toBeDefined()
        }
      })

      it('should reject password without number', () => {
        const data = {
          email: 'user@example.com',
          password: 'PasswordOnly',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
        if (!result.success) {
          const numberError = result.error.issues.find((issue) => issue.message.includes('number'))
          expect(numberError).toBeDefined()
        }
      })

      it('should accept password at minimum length boundary (8 chars)', () => {
        const data = {
          email: 'user@example.com',
          password: 'Pass123a',
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })

      it('should accept password at maximum length boundary (100 chars)', () => {
        const data = {
          email: 'user@example.com',
          password: `A${'a'.repeat(97)}12`,
          role: 'USER',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    describe('role validation', () => {
      it('should reject invalid role', () => {
        const data = {
          email: 'user@example.com',
          password: 'ValidPass123',
          role: 'INVALID_ROLE',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })

      it('should reject missing role', () => {
        const data = {
          email: 'user@example.com',
          password: 'ValidPass123',
        }

        const result = CreateUserDTOSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('RefreshTokenDTOSchema', () => {
    describe('valid cases', () => {
      it('should validate correct refresh token', () => {
        const validData = {
          refreshToken: 'valid-jwt-token-string',
        }

        const result = RefreshTokenDTOSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.refreshToken).toBe('valid-jwt-token-string')
        }
      })
    })

    describe('invalid cases', () => {
      it('should reject empty refresh token', () => {
        const invalidData = {
          refreshToken: '',
        }

        const result = RefreshTokenDTOSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0)
          expect(result.error.issues[0].message).toBe('Refresh token is required')
        }
      })

      it('should reject missing refresh token', () => {
        const result = RefreshTokenDTOSchema.safeParse({})
        expect(result.success).toBe(false)
      })
    })
  })
})
