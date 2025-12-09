import { ValidationError } from '@errors/ValidationError'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers'
import { describe, expect, it } from 'vitest'
import { TeamCity } from './TeamCity.js'
import { TEAM_CITY_RULES } from './TeamCity.rules.js'
import type { TeamCityInput } from './TeamCity.schema.js'

describe('TeamCity Value Object', () => {
  // ---------------------------------------------------------------------------
  // ✅ HAPPY PATH & STRUCTURAL INTEGRITY
  // ---------------------------------------------------------------------------
  describe('create (Success & Structure)', () => {
    it('should create a valid instance and getValue() should return the exact object structure', () => {
      // Arrange
      const input = {
        name: faker.string.alpha({
          length: { max: TEAM_CITY_RULES.MAX_LENGTH, min: TEAM_CITY_RULES.MIN_LENGTH },
        }),
      } satisfies TeamCityInput

      // Act
      const city = expectSuccess(TeamCity.create(input))

      expect(city.name).toBe(input.name)
      expect(city.getValue()).toEqual(input)
    })

    it('should trim whitespace and getValue() should return the clean value', () => {
      // Arrange
      const baseCity = faker.string.alpha({
        length: { max: TEAM_CITY_RULES.MAX_LENGTH, min: TEAM_CITY_RULES.MIN_LENGTH },
      })

      const rawName = `  ${baseCity}  `
      const expectedName = baseCity

      const input = { name: rawName } satisfies TeamCityInput

      // Act
      const city = expectSuccess(TeamCity.create(input))

      // Assert
      expect(city.name).toBe(expectedName)
      expect(city.getValue()).toEqual({ name: expectedName })
    })

    it('should ignore extra properties in input but getValue() should return clean object', () => {
      // Arrange: dirty input with extra properties
      const baseCity = faker.string.alpha({
        length: { max: TEAM_CITY_RULES.MAX_LENGTH, min: TEAM_CITY_RULES.MIN_LENGTH },
      })

      const input = {
        fakeProperty: 12345, // not a property of TeamCityInput
        name: baseCity,
      } as unknown as TeamCityInput

      // Act
      const city = expectSuccess(TeamCity.create(input))

      // Assert
      expect(city.getValue()).toEqual({ name: baseCity })
      // @ts-expect-error Validamos que TS sabe que fakeProperty no existe
      expect(city.fakeProperty).toBeUndefined()
    })
  })

  // ---------------------------------------------------------------------------
  // 📏 BOUNDARY TESTING (Límites exactos)
  // ---------------------------------------------------------------------------
  describe('Boundaries (Min/Max Rules)', () => {
    it('should accept a city with exactly MIN_LENGTH characters', () => {
      const input = {
        name: faker.string.alpha(TEAM_CITY_RULES.MIN_LENGTH),
      } satisfies TeamCityInput

      const city = expectSuccess(TeamCity.create(input))

      expect(city.name.length).toBe(TEAM_CITY_RULES.MIN_LENGTH)
    })

    it('should accept a city with exactly MAX_LENGTH characters', () => {
      const input = {
        name: faker.string.alpha(TEAM_CITY_RULES.MAX_LENGTH),
      } satisfies TeamCityInput

      const city = expectSuccess(TeamCity.create(input))

      expect(city.name.length).toBe(TEAM_CITY_RULES.MAX_LENGTH)
    })
  })

  // ---------------------------------------------------------------------------
  // ❌ VALIDATION ERRORS (The Saboteur)
  // ---------------------------------------------------------------------------
  describe('Validation Errors', () => {
    it('should return ValidationError if name is empty', () => {
      const input = { name: '' } satisfies TeamCityInput

      expectErrorType({
        errorType: ValidationError,
        result: TeamCity.create(input),
      })
    })

    it('should return ValidationError if name is shorter than MIN_LENGTH', () => {
      const input = {
        name: faker.string.alpha(TEAM_CITY_RULES.MIN_LENGTH - 1),
      } satisfies TeamCityInput

      expectErrorType({
        errorType: ValidationError,
        result: TeamCity.create(input),
      })
    })

    it('should return ValidationError if name is longer than MAX_LENGTH', () => {
      const input = {
        name: faker.string.alpha(TEAM_CITY_RULES.MAX_LENGTH + 1),
      } satisfies TeamCityInput

      expectErrorType({
        errorType: ValidationError,
        result: TeamCity.create(input),
      })
    })

    it('should return ValidationError if name becomes empty after trim', () => {
      const input = {
        name: '   ',
      } satisfies TeamCityInput

      expectErrorType({
        errorType: ValidationError,
        result: TeamCity.create(input),
      })
    })

    it('should return ValidationError if input is not an object', () => {
      expectErrorType({
        errorType: ValidationError,
        result: TeamCity.create(null as any),
      })
    })
  })
})
