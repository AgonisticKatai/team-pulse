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
      const input = {
        name: faker.string.alpha({
          length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH },
        }),
      } satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName).toBeInstanceOf(TeamName)

      expect(teamName.name).toBe(input.name)

      expect(teamName.getValue()).toEqual(input)
    })

    it('should trim whitespace from the name', () => {
      const rawName = '  Phoenix Suns  '
      const expectedName = 'Phoenix Suns'
      const input = { name: rawName } satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName.name).toBe(expectedName)
      expect(teamName.getValue()).toEqual({ name: expectedName })
    })

    // 📏 BOUNDARY TESTING

    it('should accept a name with exactly MIN_LENGTH characters', () => {
      const input = {
        name: faker.string.alpha(TEAM_NAME_RULES.MIN_LENGTH),
      } satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName.name.length).toBe(TEAM_NAME_RULES.MIN_LENGTH)
    })

    it('should accept a name with exactly MAX_LENGTH characters', () => {
      const input = {
        name: faker.string.alpha(TEAM_NAME_RULES.MAX_LENGTH),
      } satisfies TeamNameInput

      const teamName = expectSuccess(TeamName.create(input))

      expect(teamName.name.length).toBe(TEAM_NAME_RULES.MAX_LENGTH)
    })

    // ❌ VALIDATION ERRORS

    it('should return ValidationError if name is empty', () => {
      expectErrorType({
        errorType: ValidationError,
        result: TeamName.create({ name: '' }),
      })
    })

    it('should return ValidationError if name is shorter than MIN_LENGTH', () => {
      expectErrorType({
        errorType: ValidationError,
        result: TeamName.create({
          name: faker.string.alpha(TEAM_NAME_RULES.MIN_LENGTH - 1),
        }),
      })
    })

    it('should return ValidationError if name is longer than MAX_LENGTH', () => {
      expectErrorType({
        errorType: ValidationError,
        result: TeamName.create({
          name: faker.string.alpha(TEAM_NAME_RULES.MAX_LENGTH + 1),
        }),
      })
    })

    it('should return ValidationError if name becomes invalid after trim', () => {
      expectErrorType({
        errorType: ValidationError,
        result: TeamName.create({ name: '   ' }),
      })
    })
  })
})
