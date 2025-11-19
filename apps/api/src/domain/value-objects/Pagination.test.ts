import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess } from '../../infrastructure/testing/index.js'
import { Pagination } from './Pagination.js'

describe('Pagination Value Object', () => {
  describe('create', () => {
    describe('successful creation', () => {
      it('should create valid pagination with all parameters', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 100 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.page).toBe(1)
        expect(pagination.limit).toBe(10)
        expect(pagination.total).toBe(100)
        expect(pagination.totalPages).toBe(10)
      })

      it('should create pagination with page 1', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 50 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.page).toBe(1)
      })

      it('should create pagination with limit 1 (minimum)', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 1, total: 10 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.limit).toBe(1)
        expect(pagination.totalPages).toBe(10)
      })

      it('should create pagination with limit 100 (maximum)', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 100, total: 500 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.limit).toBe(100)
        expect(pagination.totalPages).toBe(5)
      })

      it('should create pagination with total 0', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 0 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.total).toBe(0)
        expect(pagination.totalPages).toBe(0)
      })

      it('should calculate totalPages correctly when total is perfectly divisible', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 100 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.totalPages).toBe(10)
      })

      it('should calculate totalPages correctly when total is not perfectly divisible', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 95 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.totalPages).toBe(10) // ceil(95/10) = 10
      })

      it('should calculate totalPages as 1 when total is less than limit', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 5 })

        // Assert
        const pagination = expectSuccess(result)
        expect(pagination.totalPages).toBe(1)
      })
    })

    describe('page validation', () => {
      it('should reject page less than 1', () => {
        // Act
        const result = Pagination.create({ page: 0, limit: 10, total: 100 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Page must be at least 1')
      })

      it('should reject negative page', () => {
        // Act
        const result = Pagination.create({ page: -1, limit: 10, total: 100 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Page must be at least 1')
      })

      it('should reject non-integer page', () => {
        // Act
        const result = Pagination.create({ page: 1.5, limit: 10, total: 100 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Page must be an integer')
      })
    })

    describe('limit validation', () => {
      it('should reject limit less than 1', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 0, total: 100 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Limit must be at least 1')
      })

      it('should reject negative limit', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: -10, total: 100 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Limit must be at least 1')
      })

      it('should reject limit greater than 100', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 101, total: 1000 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Limit cannot exceed 100')
      })

      it('should reject non-integer limit', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10.5, total: 100 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Limit must be an integer')
      })
    })

    describe('total validation', () => {
      it('should reject negative total', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: -1 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Total must be at least 0')
      })

      it('should reject non-integer total', () => {
        // Act
        const result = Pagination.create({ page: 1, limit: 10, total: 100.5 })

        // Assert
        const error = expectError(result)
        expect(error.message).toContain('Total must be an integer')
      })
    })
  })

  describe('toDTO', () => {
    it('should convert to DTO with all fields', () => {
      // Arrange
      const result = Pagination.create({ page: 2, limit: 20, total: 100 })
      const pagination = expectSuccess(result)

      // Act
      const dto = pagination.toDTO()

      // Assert
      expect(dto).toEqual({
        page: 2,
        limit: 20,
        total: 100,
        totalPages: 5,
      })
    })

    it('should convert to DTO with zero total', () => {
      // Arrange
      const result = Pagination.create({ page: 1, limit: 10, total: 0 })
      const pagination = expectSuccess(result)

      // Act
      const dto = pagination.toDTO()

      // Assert
      expect(dto).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      })
    })
  })

  describe('hasNextPage', () => {
    it('should return true when current page is less than total pages', () => {
      // Arrange
      const result = Pagination.create({ page: 1, limit: 10, total: 100 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasNextPage()).toBe(true)
    })

    it('should return false when on last page', () => {
      // Arrange
      const result = Pagination.create({ page: 10, limit: 10, total: 100 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasNextPage()).toBe(false)
    })

    it('should return false when total is 0', () => {
      // Arrange
      const result = Pagination.create({ page: 1, limit: 10, total: 0 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasNextPage()).toBe(false)
    })

    it('should return false when on single page', () => {
      // Arrange
      const result = Pagination.create({ page: 1, limit: 10, total: 5 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasNextPage()).toBe(false)
    })
  })

  describe('hasPreviousPage', () => {
    it('should return false on first page', () => {
      // Arrange
      const result = Pagination.create({ page: 1, limit: 10, total: 100 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasPreviousPage()).toBe(false)
    })

    it('should return true when on second page', () => {
      // Arrange
      const result = Pagination.create({ page: 2, limit: 10, total: 100 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasPreviousPage()).toBe(true)
    })

    it('should return true when on last page', () => {
      // Arrange
      const result = Pagination.create({ page: 10, limit: 10, total: 100 })
      const pagination = expectSuccess(result)

      // Act & Assert
      expect(pagination.hasPreviousPage()).toBe(true)
    })
  })

  describe('equals', () => {
    it('should return true for pagination with same values', () => {
      // Arrange
      const result1 = Pagination.create({ page: 1, limit: 10, total: 100 })
      const result2 = Pagination.create({ page: 1, limit: 10, total: 100 })
      const pagination1 = expectSuccess(result1)
      const pagination2 = expectSuccess(result2)

      // Act & Assert
      expect(pagination1.equals(pagination2)).toBe(true)
    })

    it('should return false for different page', () => {
      // Arrange
      const result1 = Pagination.create({ page: 1, limit: 10, total: 100 })
      const result2 = Pagination.create({ page: 2, limit: 10, total: 100 })
      const pagination1 = expectSuccess(result1)
      const pagination2 = expectSuccess(result2)

      // Act & Assert
      expect(pagination1.equals(pagination2)).toBe(false)
    })

    it('should return false for different limit', () => {
      // Arrange
      const result1 = Pagination.create({ page: 1, limit: 10, total: 100 })
      const result2 = Pagination.create({ page: 1, limit: 20, total: 100 })
      const pagination1 = expectSuccess(result1)
      const pagination2 = expectSuccess(result2)

      // Act & Assert
      expect(pagination1.equals(pagination2)).toBe(false)
    })

    it('should return false for different total', () => {
      // Arrange
      const result1 = Pagination.create({ page: 1, limit: 10, total: 100 })
      const result2 = Pagination.create({ page: 1, limit: 10, total: 200 })
      const pagination1 = expectSuccess(result1)
      const pagination2 = expectSuccess(result2)

      // Act & Assert
      expect(pagination1.equals(pagination2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const result = Pagination.create({ page: 2, limit: 20, total: 100 })
      const pagination = expectSuccess(result)

      // Act
      const str = pagination.toString()

      // Assert
      expect(str).toBe('Pagination(page=2, limit=20, total=100, totalPages=5)')
    })
  })

  describe('immutability', () => {
    it('should have readonly fields (enforced at compile-time)', () => {
      // Arrange
      const result = Pagination.create({ page: 1, limit: 10, total: 100 })
      const pagination = expectSuccess(result)

      // Assert - Verify fields are accessible
      expect(pagination.page).toBe(1)
      expect(pagination.limit).toBe(10)
      expect(pagination.total).toBe(100)
      expect(pagination.totalPages).toBe(10)

      // Note: TypeScript's 'readonly' is a compile-time check.
      // The following would fail at compile-time (preventing mutations):
      // pagination.page = 2  // TS Error: Cannot assign to 'page' because it is a read-only property
    })
  })

  describe('edge cases', () => {
    it('should handle very large total', () => {
      // Act
      const result = Pagination.create({ page: 1, limit: 100, total: 1000000 })

      // Assert
      const pagination = expectSuccess(result)
      expect(pagination.totalPages).toBe(10000)
    })

    it('should handle total equal to limit', () => {
      // Act
      const result = Pagination.create({ page: 1, limit: 10, total: 10 })

      // Assert
      const pagination = expectSuccess(result)
      expect(pagination.totalPages).toBe(1)
    })

    it('should handle total one more than limit', () => {
      // Act
      const result = Pagination.create({ page: 1, limit: 10, total: 11 })

      // Assert
      const pagination = expectSuccess(result)
      expect(pagination.totalPages).toBe(2)
    })
  })
})
