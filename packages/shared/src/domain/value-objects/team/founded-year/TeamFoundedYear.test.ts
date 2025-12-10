import { ValidationError } from '@errors/ValidationError.js'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers.js'
import { describe, expect, it } from 'vitest'
import { TeamFoundedYear } from './TeamFoundedYear.js'
import { TEAM_FOUNDED_YEAR_RULES } from './TeamFoundedYear.rules.js'
import type { TeamFoundedYearInput, TeamFoundedYearOptionalInput } from './TeamFoundedYear.schema.js'

describe('TeamFoundedYear Value Object', () => {
  const CURRENT_YEAR = new Date().getFullYear()

  // ===========================================================================
  // 1. CREATE (Strict Mode - Always expects a value)
  // ===========================================================================
  describe('create', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH & STRUCTURAL INTEGRITY
    // -------------------------------------------------------------------------
    it('should create a valid instance with a random valid year', () => {
      const input = {
        year: faker.number.int({ max: CURRENT_YEAR, min: TEAM_FOUNDED_YEAR_RULES.MIN }),
      } satisfies TeamFoundedYearInput

      const foundedYear = expectSuccess(TeamFoundedYear.create(input))

      expect(foundedYear).toBeInstanceOf(TeamFoundedYear)
      expect(foundedYear.year).toBe(input.year)
      expect(foundedYear.getValue()).toEqual(input)
      expect(foundedYear.isEmpty()).toBe(false)
    })

    // -------------------------------------------------------------------------
    // 📏 BOUNDARY TESTING
    // -------------------------------------------------------------------------
    it('should accept the minimum allowed year', () => {
      const input = { year: TEAM_FOUNDED_YEAR_RULES.MIN } satisfies TeamFoundedYearInput
      const foundedYear = expectSuccess(TeamFoundedYear.create(input))
      expect(foundedYear.year).toBe(TEAM_FOUNDED_YEAR_RULES.MIN)
    })

    it('should accept the current year (max boundary)', () => {
      const input = { year: CURRENT_YEAR } satisfies TeamFoundedYearInput
      const foundedYear = expectSuccess(TeamFoundedYear.create(input))
      expect(foundedYear.year).toBe(CURRENT_YEAR)
    })

    // -------------------------------------------------------------------------
    // ❌ VALIDATION ERRORS
    // -------------------------------------------------------------------------
    it('should return ValidationError if year is older than MIN', () => {
      const input = { year: TEAM_FOUNDED_YEAR_RULES.MIN - 1 } satisfies TeamFoundedYearInput
      expectErrorType({ errorType: ValidationError, result: TeamFoundedYear.create(input) })
    })

    it('should return ValidationError if year is in the future', () => {
      const input = { year: CURRENT_YEAR + 1 } satisfies TeamFoundedYearInput
      expectErrorType({ errorType: ValidationError, result: TeamFoundedYear.create(input) })
    })

    it('should return ValidationError if input is null/undefined (Strict violation)', () => {
      // @ts-expect-error Testing runtime check against strict schema
      expectErrorType({ errorType: ValidationError, result: TeamFoundedYear.create({ year: null }) })
    })
  })

  // ===========================================================================
  // 2. CREATE OPTIONAL (Wrapper Mode - Handles Nulls & Undefined)
  // ===========================================================================
  describe('createOptional', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH & STRUCTURAL INTEGRITY
    // -------------------------------------------------------------------------
    it('should create a valid instance when input has a value', () => {
      const input = { year: 2000 } satisfies TeamFoundedYearOptionalInput

      const foundedYear = expectSuccess(TeamFoundedYear.createOptional(input))

      expect(foundedYear.year).toBe(2000)
      expect(foundedYear.isEmpty()).toBe(false)
    })

    it('should create a valid NULL instance when input is explicitly null', () => {
      const input = { year: null } satisfies TeamFoundedYearOptionalInput

      const foundedYear = expectSuccess(TeamFoundedYear.createOptional(input))

      // The wrapper exists, but holds null
      expect(foundedYear).toBeInstanceOf(TeamFoundedYear)
      expect(foundedYear.year).toBeNull()
      expect(foundedYear.isEmpty()).toBe(true)
      expect(foundedYear.getValue()).toEqual({ year: null })
    })

    it('should create a valid NULL instance when input is undefined (Normalization)', () => {
      const input = { year: undefined } satisfies TeamFoundedYearOptionalInput

      const foundedYear = expectSuccess(TeamFoundedYear.createOptional(input))

      // Magic: undefined -> null normalization
      expect(foundedYear.year).toBeNull()
      expect(foundedYear.isEmpty()).toBe(true)
    })

    // -------------------------------------------------------------------------
    // ❌ VALIDATION ERRORS (Even optional fields must be valid if present)
    // -------------------------------------------------------------------------
    it('should return ValidationError if provided value is invalid (e.g. too old)', () => {
      const input = { year: 1500 } satisfies TeamFoundedYearOptionalInput

      // Just because it's optional doesn't mean it accepts garbage
      expectErrorType({ errorType: ValidationError, result: TeamFoundedYear.createOptional(input) })
    })

    it('should return ValidationError if provided value is future', () => {
      const input = { year: CURRENT_YEAR + 50 } satisfies TeamFoundedYearOptionalInput

      expectErrorType({ errorType: ValidationError, result: TeamFoundedYear.createOptional(input) })
    })
  })
})
