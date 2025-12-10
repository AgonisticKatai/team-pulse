import { ValidationError } from '@errors/ValidationError.js'
import { faker } from '@faker-js/faker'
import { expectErrorType, expectSuccess } from '@testing/helpers.js'
import { describe, expect, it } from 'vitest'
import { TeamName } from './TeamName.js'
import { TEAM_NAME_RULES } from './TeamName.rules.js'
import type { TeamNameInput } from './TeamName.schema.js'

describe('TeamName Value Object', () => {
  describe('create', () => {
    // ✅ HAPPY PATH
    it('should create a valid instance with a random valid name', () => {
      const input = faker.string.alpha({ length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH } })

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName).toBeInstanceOf(TeamName)
      expect(teamName.value).toBe(input)
      expect(teamName.getValue()).toEqual(input)
    })

    it('should trim whitespace from the name', () => {
      const rawName = '  Phoenix Suns  '
      const expectedName = 'Phoenix Suns'
      const input = rawName satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName.value).toBe(expectedName)
      expect(teamName.getValue()).toEqual(expectedName)
    })

    // 📏 BOUNDARY TESTING

    it('should accept a name with exactly MIN_LENGTH characters', () => {
      const input = faker.string.alpha(TEAM_NAME_RULES.MIN_LENGTH) satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName.value.length).toBe(TEAM_NAME_RULES.MIN_LENGTH)
    })

    it('should accept a name with exactly MAX_LENGTH characters', () => {
      const input = faker.string.alpha(TEAM_NAME_RULES.MAX_LENGTH) satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName.value.length).toBe(TEAM_NAME_RULES.MAX_LENGTH)
    })

    // ❌ VALIDATION ERRORS

    it('should return ValidationError if name is empty', () => {
      const input = '' satisfies TeamNameInput
      expectErrorType({ errorType: ValidationError, result: TeamName.create(input) })
    })

    it('should return ValidationError if name is shorter than MIN_LENGTH', () => {
      const input = faker.string.alpha(TEAM_NAME_RULES.MIN_LENGTH - 1) satisfies TeamNameInput
      expectErrorType({ errorType: ValidationError, result: TeamName.create(input) })
    })

    it('should return ValidationError if name is longer than MAX_LENGTH', () => {
      const input = faker.string.alpha(TEAM_NAME_RULES.MAX_LENGTH + 1) satisfies TeamNameInput
      expectErrorType({ errorType: ValidationError, result: TeamName.create(input) })
    })

    it('should return ValidationError if name becomes invalid after trim', () => {
      const input = '   ' satisfies TeamNameInput
      expectErrorType({ errorType: ValidationError, result: TeamName.create(input) })
    })
  })
})
