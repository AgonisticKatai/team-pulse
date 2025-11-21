import { describe, expect, it } from 'vitest'
import { ApplicationError, type ErrorCategory, type ErrorSeverity } from './core.js'
import { TestError } from './testing/TestError.js'

describe('ApplicationError', () => {
  describe('Factory Pattern', () => {
    it('should create error instance with factory method', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error).toBeInstanceOf(TestError)
      expect(error).toBeInstanceOf(ApplicationError)
      expect(error).toBeInstanceOf(Error)
    })
  })

  describe('Properties', () => {
    it('should have correct code', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.code).toBe(TestError.CODE)
    })

    it('should have correct category', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.category).toBe(TestError.CATEGORY)
    })

    it('should have message', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.message).toBe('Initial test error')
    })

    it('should have default severity of medium', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.severity).toBe('medium')
    })

    it('should accept custom severity', () => {
      // Act
      const error = TestError.create({ message: 'Test error', severity: 'critical' })

      // Assert
      expect(error.severity).toBe('critical')
    })

    it('should have timestamp', () => {
      // Arrange
      const before = new Date()

      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      const after = new Date()
      expect(error.timestamp).toBeInstanceOf(Date)
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should have empty metadata by default', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.metadata).toEqual({})
    })

    it('should accept custom metadata', () => {
      // Act
      const error = TestError.create({
        message: 'Test error',
        metadata: { field: 'email', value: 'invalid' },
      })

      // Assert
      expect(error.metadata).toEqual({ field: 'email', value: 'invalid' })
    })

    it('should be operational by default', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name set to class name', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.name).toBe('TestError')
    })

    it('should have stack trace', () => {
      // Act
      const error = TestError.create({ message: 'Test error' })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('TestError')
    })
  })

  describe('withContext', () => {
    it('should add context to error', () => {
      // Arrange
      const error = TestError.create({ message: 'Test error', metadata: { field: 'email' } })

      // Act
      const enriched = error.withContext({ userId: '123', requestId: 'abc' })

      // Assert
      expect(enriched.metadata).toEqual({
        field: 'email',
        userId: '123',
        requestId: 'abc',
      })
    })

    it('should not modify original error', () => {
      // Arrange
      const error = TestError.create({ message: 'Test error', metadata: { field: 'email' } })

      // Act
      error.withContext({ userId: '123' })

      // Assert - Original unchanged
      expect(error.metadata).toEqual({ field: 'email' })
    })

    it('should override existing metadata keys', () => {
      // Arrange
      const error = TestError.create({ message: 'Test error', metadata: { field: 'email' } })

      // Act
      const enriched = error.withContext({ field: 'password' })

      // Assert
      expect(enriched.metadata).toEqual({ field: 'password' })
    })

    it('should preserve other error properties', () => {
      // Arrange
      const error = TestError.create({ message: 'Test error', severity: 'critical' })

      // Act
      const enriched = error.withContext({ userId: '123' })

      // Assert
      expect(enriched.message).toBe('Test error')
      expect(enriched.severity).toBe('critical')
      expect(enriched.code).toBe('TEST_ERROR')
      expect(enriched.category).toBe('validation')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON object', () => {
      // Arrange
      const error = TestError.create({
        message: 'Test error',
        severity: 'high',
        metadata: { field: 'email' },
      })

      // Act
      const json = error.toJSON()

      // Assert
      expect(json).toMatchObject({
        name: 'TestError',
        code: 'TEST_ERROR',
        message: 'Test error',
        category: 'validation',
        severity: 'high',
        metadata: { field: 'email' },
        isOperational: true,
      })
    })

    it('should include timestamp as ISO string', () => {
      // Arrange
      const error = TestError.create({ message: 'Test error' })

      // Act
      const json = error.toJSON() as { timestamp: string }

      // Assert
      expect(json.timestamp).toBeDefined()
      expect(new Date(json.timestamp)).toBeInstanceOf(Date)
    })

    it('should include stack trace', () => {
      // Arrange
      const error = TestError.create({ message: 'Test' })

      // Act
      const json = error.toJSON() as { stack?: string }

      // Assert
      expect(json.stack).toBeDefined()
      expect(json.stack).toContain('TestError')
    })
  })

  describe('Error Categories', () => {
    it('should support validation category', () => {
      // Arrange
      const category: ErrorCategory = 'validation'

      // Assert
      expect(category).toBe('validation')
    })

    it('should support authentication category', () => {
      // Arrange
      const category: ErrorCategory = 'authentication'

      // Assert
      expect(category).toBe('authentication')
    })

    it('should support authorization category', () => {
      // Arrange
      const category: ErrorCategory = 'authorization'

      // Assert
      expect(category).toBe('authorization')
    })

    it('should support not_found category', () => {
      // Arrange
      const category: ErrorCategory = 'not_found'

      // Assert
      expect(category).toBe('not_found')
    })

    it('should support conflict category', () => {
      // Arrange
      const category: ErrorCategory = 'conflict'

      // Assert
      expect(category).toBe('conflict')
    })

    it('should support business_rule category', () => {
      // Arrange
      const category: ErrorCategory = 'business_rule'

      // Assert
      expect(category).toBe('business_rule')
    })

    it('should support external category', () => {
      // Arrange
      const category: ErrorCategory = 'external'

      // Assert
      expect(category).toBe('external')
    })

    it('should support internal category', () => {
      // Arrange
      const category: ErrorCategory = 'internal'

      // Assert
      expect(category).toBe('internal')
    })
  })

  describe('Error Severity', () => {
    it('should support low severity', () => {
      // Arrange
      const severity: ErrorSeverity = 'low'

      // Assert
      expect(severity).toBe('low')
    })

    it('should support medium severity', () => {
      // Arrange
      const severity: ErrorSeverity = 'medium'

      // Assert
      expect(severity).toBe('medium')
    })

    it('should support high severity', () => {
      // Arrange
      const severity: ErrorSeverity = 'high'

      // Assert
      expect(severity).toBe('high')
    })

    it('should support critical severity', () => {
      // Arrange
      const severity: ErrorSeverity = 'critical'

      // Assert
      expect(severity).toBe('critical')
    })
  })
})
