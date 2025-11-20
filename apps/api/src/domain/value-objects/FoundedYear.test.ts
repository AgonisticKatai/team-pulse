import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { expectError, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors/index.js'
import { FoundedYear } from './FoundedYear.js'

describe('FoundedYear Value Object', () => {
  describe('create', () => {
    it('should create valid founded year', () => {
      // Arrange
      const year = TEST_CONSTANTS.teams.fcBarcelona.foundedYear as number

      // Act
      const foundedYear = expectSuccess(FoundedYear.create({ value: year }))

      // Assert
      expect(foundedYear).toBeDefined()
      expect(foundedYear.getValue()).toBe(year)
    })

    it('should accept various valid years', () => {
      // Arrange
      const validYears = [
        TEST_CONSTANTS.foundedYears.year1899,
        TEST_CONSTANTS.foundedYears.year1900,
        TEST_CONSTANTS.foundedYears.year1902,
        TEST_CONSTANTS.foundedYears.year2000,
        TEST_CONSTANTS.foundedYears.year2020,
      ]

      // Act & Assert
      for (const year of validYears) {
        const foundedYear = expectSuccess(FoundedYear.create({ value: year }))
        expect(foundedYear).toBeDefined()
      }
    })

    it('should accept year exactly 1800 (minimum)', () => {
      // Arrange
      const year = TEST_CONSTANTS.foundedYears.exactly1800

      // Act
      const foundedYear = expectSuccess(FoundedYear.create({ value: year }))

      // Assert
      expect(foundedYear).toBeDefined()
      expect(foundedYear.getValue()).toBe(1800)
    })

    it('should accept current year', () => {
      // Arrange
      const year = TEST_CONSTANTS.foundedYears.currentYear

      // Act
      const foundedYear = expectSuccess(FoundedYear.create({ value: year }))

      // Assert
      expect(foundedYear).toBeDefined()
      expect(foundedYear.getValue()).toBe(TEST_CONSTANTS.foundedYears.currentYear)
    })

    it('should fail with year before 1800', () => {
      // Arrange
      const year = TEST_CONSTANTS.foundedYears.tooOld

      // Act
      const error = expectError(FoundedYear.create({ value: year }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team founded year must be between 1800 and')
    })

    it('should fail with negative year', () => {
      // Arrange
      const year = TEST_CONSTANTS.foundedYears.negative

      // Act
      const error = expectError(FoundedYear.create({ value: year }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team founded year must be between 1800 and')
    })

    it('should fail with zero', () => {
      // Arrange
      const year = TEST_CONSTANTS.foundedYears.zero

      // Act
      const error = expectError(FoundedYear.create({ value: year }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team founded year must be between 1800 and')
    })

    it('should fail with future year', () => {
      // Arrange
      const year = TEST_CONSTANTS.foundedYears.futureYear

      // Act
      const error = expectError(FoundedYear.create({ value: year }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team founded year must be between 1800 and')
    })
  })

  describe('getValue', () => {
    it('should return the founded year value', () => {
      // Arrange
      const foundedYear = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1899 }))

      // Act
      const value = foundedYear.getValue()

      // Assert
      expect(value).toBe(TEST_CONSTANTS.foundedYears.year1899)
    })
  })

  describe('equals', () => {
    it('should return true for same founded year', () => {
      // Arrange
      const foundedYear1 = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1902 }))
      const foundedYear2 = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1902 }))

      // Act
      const isEqual = foundedYear1.equals({ other: foundedYear2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different founded years', () => {
      // Arrange
      const foundedYear1 = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1899 }))
      const foundedYear2 = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1902 }))

      // Act
      const isEqual = foundedYear1.equals({ other: foundedYear2 })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const foundedYear = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year2000 }))

      // Act
      const str = foundedYear.toString()

      // Assert
      expect(str).toBe('2000')
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const foundedYear = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1900 }))

      // Act
      const json = foundedYear.toJSON()

      // Assert
      expect(json).toBe(TEST_CONSTANTS.foundedYears.year1900)
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const foundedYear = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year2020 }))
      const obj = { foundedYear }

      // Act
      const jsonString = JSON.stringify(obj)

      // Assert
      expect(jsonString).toBe(`{"foundedYear":${TEST_CONSTANTS.foundedYears.year2020}}`)
    })
  })

  describe('Immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const foundedYear = expectSuccess(FoundedYear.create({ value: TEST_CONSTANTS.foundedYears.year1899 }))

      // Act & Assert
      // TypeScript should prevent modification of the value property
      // This test verifies the getValue() returns the same value
      expect(foundedYear.getValue()).toBe(TEST_CONSTANTS.foundedYears.year1899)
      expect(foundedYear.getValue()).toBe(TEST_CONSTANTS.foundedYears.year1899) // Still the same
    })
  })
})
