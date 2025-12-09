import { ValidationError } from '@errors/ValidationError.js'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers.js'
import { describe, expect, it } from 'vitest'
import { TeamFoundedYear } from './TeamFoundedYear.js'
import { TEAM_FOUNDED_YEAR_RULES } from './TeamFoundedYear.rules.js'
import type { TeamFoundedYearInput } from './TeamFoundedYear.schema.js'

describe('TeamFoundedYear Value Object', () => {
  // Calculate the current year once to use it in the tests
  const CURRENT_YEAR = new Date().getFullYear()

  describe('create', () => {
    // -------------------------------------------------------------------------
    // ✅ HAPPY PATH & STRUCTURE
    // -------------------------------------------------------------------------

    it('should create a valid instance with a random valid year', () => {
      const input = {
        year: faker.number.int({ max: CURRENT_YEAR, min: TEAM_FOUNDED_YEAR_RULES.MIN }),
      } satisfies TeamFoundedYearInput

      const foundedYear = expectSuccess(TeamFoundedYear.create(input))

      // Verify instance and direct access
      expect(foundedYear).toBeInstanceOf(TeamFoundedYear)
      expect(foundedYear.year).toBe(input.year)

      // Verify structural integrity of getValue
      expect(foundedYear.getValue()).toEqual(input)
    })

    // -------------------------------------------------------------------------
    // 📏 BOUNDARY TESTING (Límites exactos)
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

      expectErrorType({
        errorType: ValidationError,
        result: TeamFoundedYear.create(input),
      })
    })

    it('should return ValidationError if year is in the future', () => {
      const input = { year: CURRENT_YEAR + 1 } satisfies TeamFoundedYearInput

      expectErrorType({
        errorType: ValidationError,
        result: TeamFoundedYear.create(input),
      })
    })

    it('should return ValidationError if year is a float (must be integer)', () => {
      // Zod .int() should reject this
      const input = { year: 1990.5 } satisfies TeamFoundedYearInput

      expectErrorType({
        errorType: ValidationError,
        result: TeamFoundedYear.create(input),
      })
    })

    it('should return ValidationError if input is not a number', () => {
      const input = { year: '1990' as any } satisfies TeamFoundedYearInput

      // If the schema does not have coerce, this fails.
      // If the schema had coerce, this would pass.
      // In the actual code, I do not see coerce, so it should fail.
      expectErrorType({
        errorType: ValidationError,
        result: TeamFoundedYear.create(input),
      })
    })

    it('should return ValidationError if input is null/undefined', () => {
      expectErrorType({
        errorType: ValidationError,
        result: TeamFoundedYear.create(null as any),
      })
    })
  })
})
