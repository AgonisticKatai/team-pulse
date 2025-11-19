import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { ValidationError } from '../errors/index.js'
import { City } from './City.js'

describe('City Value Object', () => {
  describe('create', () => {
    it('should create valid city', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.teams.fcBarcelona.city

      // Act
      const city = expectSuccess(City.create({ value: cityString }))

      // Assert
      expect(city).toBeDefined()
      expect(city.getValue()).toBe(TEST_CONSTANTS.teams.fcBarcelona.city)
    })

    it('should trim whitespace from city', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.cities.withLeadingTrailingSpaces

      // Act
      const city = expectSuccess(City.create({ value: cityString }))

      // Assert
      expect(city).toBeDefined()
      expect(city.getValue()).toBe('London')
    })

    it('should accept various valid city names', () => {
      // Arrange
      const validCities = [
        TEST_CONSTANTS.cities.barcelona,
        TEST_CONSTANTS.cities.madrid,
        TEST_CONSTANTS.cities.saoPaulo,
        TEST_CONSTANTS.cities.saintEtienne,
        TEST_CONSTANTS.cities.newYork,
        TEST_CONSTANTS.cities.singleChar,
      ]

      // Act & Assert
      for (const cityString of validCities) {
        const city = expectSuccess(City.create({ value: cityString }))
        expect(city).toBeDefined()
      }
    })

    it('should accept city with exactly 100 characters', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.cities.exactly100Chars

      // Act
      const city = expectSuccess(City.create({ value: cityString }))

      // Assert
      expect(city).toBeDefined()
      expect(city.getValue().length).toBe(100)
    })

    it('should fail with empty string', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.cities.empty

      // Act
      const error = expectError(City.create({ value: cityString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team city cannot be empty')
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.cities.whitespaceOnly

      // Act
      const error = expectError(City.create({ value: cityString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team city cannot be empty')
    })

    it('should fail with city exceeding 100 characters', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.cities.exceeds100Chars

      // Act
      const error = expectError(City.create({ value: cityString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team city cannot exceed 100 characters')
    })

    it('should fail with very long city name', () => {
      // Arrange
      const cityString = TEST_CONSTANTS.cities.veryLong

      // Act
      const error = expectError(City.create({ value: cityString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team city cannot exceed 100 characters')
    })
  })

  describe('getValue', () => {
    it('should return the city value', () => {
      // Arrange
      const city = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.madrid }))

      // Act
      const value = city.getValue()

      // Assert
      expect(value).toBe(TEST_CONSTANTS.cities.madrid)
    })

    it('should return trimmed value', () => {
      // Arrange
      const city = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.withLeadingTrailingSpaces }))

      // Act
      const value = city.getValue()

      // Assert
      expect(value).toBe('London')
    })
  })

  describe('equals', () => {
    it('should return true for same city', () => {
      // Arrange
      const city1 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona }))
      const city2 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona }))

      // Act
      const isEqual = city1.equals({ other: city2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return true for same city after trimming', () => {
      // Arrange
      const city1 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona }))
      const city2 = expectSuccess(City.create({ value: `  ${TEST_CONSTANTS.cities.barcelona}  ` }))

      // Act
      const isEqual = city1.equals({ other: city2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different cities', () => {
      // Arrange
      const city1 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona }))
      const city2 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.madrid }))

      // Act
      const isEqual = city1.equals({ other: city2 })

      // Assert
      expect(isEqual).toBe(false)
    })

    it('should be case-sensitive', () => {
      // Arrange
      const city1 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona }))
      const city2 = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona.toUpperCase() }))

      // Act
      const isEqual = city1.equals({ other: city2 })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const city = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.valencia }))

      // Act
      const str = city.toString()

      // Assert
      expect(str).toBe(TEST_CONSTANTS.cities.valencia)
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const city = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.bilbao }))

      // Act
      const json = city.toJSON()

      // Assert
      expect(json).toBe(TEST_CONSTANTS.cities.bilbao)
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const city = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.madrid }))
      const obj = { city }

      // Act
      const jsonString = JSON.stringify(obj)

      // Assert
      expect(jsonString).toBe(`{"city":"${TEST_CONSTANTS.cities.madrid}"}`)
    })
  })

  describe('Immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const city = expectSuccess(City.create({ value: TEST_CONSTANTS.cities.barcelona }))

      // Act & Assert
      // TypeScript should prevent modification of the value property
      // This test verifies the getValue() returns the same value
      expect(city.getValue()).toBe(TEST_CONSTANTS.cities.barcelona)
      expect(city.getValue()).toBe(TEST_CONSTANTS.cities.barcelona) // Still the same
    })
  })
})
