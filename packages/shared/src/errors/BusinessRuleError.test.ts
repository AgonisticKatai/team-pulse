import { describe, expect, it } from 'vitest'
import { BusinessRuleError } from './BusinessRuleError'

describe('BusinessRuleError', () => {
  describe('Factory Methods', () => {
    it('should create business rule error', () => {
      // Act
      const error = BusinessRuleError.create({
        rule: 'CANNOT_DELETE_TEAM_WITH_MATCHES',
        message: 'Cannot delete team with active matches',
      })

      // Assert
      expect(error.message).toBe('Cannot delete team with active matches')
      expect(error.metadata.rule).toBe('CANNOT_DELETE_TEAM_WITH_MATCHES')
    })
  })

  describe('Properties', () => {
    it('should have business_rule category', () => {
      // Act
      const error = BusinessRuleError.create({ rule: 'TEST', message: 'Test' })

      // Assert
      expect(error.category).toBe(BusinessRuleError.CATEGORY)
    })

    it('should have medium severity', () => {
      // Act
      const error = BusinessRuleError.create({ rule: 'TEST', message: 'Test' })

      // Assert
      expect(error.severity).toBe('medium')
    })

    it('should be operational', () => {
      // Act
      const error = BusinessRuleError.create({ rule: 'TEST', message: 'Test' })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have correct code', () => {
      // Act
      const error = BusinessRuleError.create({ rule: 'TEST', message: 'Test' })

      // Assert
      expect(error.code).toBe(BusinessRuleError.CODE)
    })
  })
})
