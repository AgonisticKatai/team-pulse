import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess, TEST_CONSTANTS } from '../../infrastructure/testing/index.js'
import { ValidationError } from '../errors/index.js'
import { TeamName } from './TeamName.js'

describe('TeamName Value Object', () => {
  describe('create', () => {
    it('should create valid team name', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teams.fcBarcelona.name

      // Act
      const teamName = expectSuccess(TeamName.create({ value: nameString }))

      // Assert
      expect(teamName).toBeDefined()
      expect(teamName.getValue()).toBe(TEST_CONSTANTS.teams.fcBarcelona.name)
    })

    it('should trim whitespace from team name', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teamNames.withLeadingTrailingSpaces

      // Act
      const teamName = expectSuccess(TeamName.create({ value: nameString }))

      // Assert
      expect(teamName).toBeDefined()
      expect(teamName.getValue()).toBe('Chelsea FC')
    })

    it('should accept various valid team names', () => {
      // Arrange
      const validNames = [
        TEST_CONSTANTS.teamNames.manchesterUnited,
        TEST_CONSTANTS.teamNames.bayernMunchen,
        TEST_CONSTANTS.teamNames.parisSaintGermain,
        TEST_CONSTANTS.teamNames.singleChar,
        TEST_CONSTANTS.teamNames.withNumbers,
      ]

      // Act & Assert
      for (const nameString of validNames) {
        const teamName = expectSuccess(TeamName.create({ value: nameString }))
        expect(teamName).toBeDefined()
      }
    })

    it('should accept team name with exactly 100 characters', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teamNames.exactly100Chars

      // Act
      const teamName = expectSuccess(TeamName.create({ value: nameString }))

      // Assert
      expect(teamName).toBeDefined()
      expect(teamName.getValue().length).toBe(100)
    })

    it('should fail with empty string', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teamNames.empty

      // Act
      const error = expectError(TeamName.create({ value: nameString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team name cannot be empty')
    })

    it('should fail with whitespace only', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teamNames.whitespaceOnly

      // Act
      const error = expectError(TeamName.create({ value: nameString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team name cannot be empty')
    })

    it('should fail with team name exceeding 100 characters', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teamNames.exceeds100Chars

      // Act
      const error = expectError(TeamName.create({ value: nameString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team name cannot exceed 100 characters')
    })

    it('should fail with very long team name', () => {
      // Arrange
      const nameString = TEST_CONSTANTS.teamNames.veryLong

      // Act
      const error = expectError(TeamName.create({ value: nameString }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toContain('Team name cannot exceed 100 characters')
    })
  })

  describe('getValue', () => {
    it('should return the team name value', () => {
      // Arrange
      const teamName = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teams.realMadrid.name }))

      // Act
      const value = teamName.getValue()

      // Assert
      expect(value).toBe(TEST_CONSTANTS.teams.realMadrid.name)
    })

    it('should return trimmed value', () => {
      // Arrange
      const teamName = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.withLeadingTrailingSpaces }))

      // Act
      const value = teamName.getValue()

      // Assert
      expect(value).toBe('Chelsea FC')
    })
  })

  describe('equals', () => {
    it('should return true for same team name', () => {
      // Arrange
      const teamName1 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.arsenal }))
      const teamName2 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.arsenal }))

      // Act
      const isEqual = teamName1.equals({ other: teamName2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return true for same team name after trimming', () => {
      // Arrange
      const teamName1 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.arsenal }))
      const teamName2 = expectSuccess(TeamName.create({ value: `  ${TEST_CONSTANTS.teamNames.arsenal}  ` }))

      // Act
      const isEqual = teamName1.equals({ other: teamName2 })

      // Assert
      expect(isEqual).toBe(true)
    })

    it('should return false for different team names', () => {
      // Arrange
      const teamName1 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.arsenal }))
      const teamName2 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.tottenham }))

      // Act
      const isEqual = teamName1.equals({ other: teamName2 })

      // Assert
      expect(isEqual).toBe(false)
    })

    it('should be case-sensitive', () => {
      // Arrange
      const teamName1 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.arsenal }))
      const teamName2 = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.arsenal.toLowerCase() }))

      // Act
      const isEqual = teamName1.equals({ other: teamName2 })

      // Assert
      expect(isEqual).toBe(false)
    })
  })

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const teamName = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.juventus }))

      // Act
      const str = teamName.toString()

      // Assert
      expect(str).toBe(TEST_CONSTANTS.teamNames.juventus)
    })
  })

  describe('toJSON', () => {
    it('should return JSON-safe value', () => {
      // Arrange
      const teamName = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teams.fcBarcelona.name }))

      // Act
      const json = teamName.toJSON()

      // Assert
      expect(json).toBe(TEST_CONSTANTS.teams.fcBarcelona.name)
    })

    it('should work with JSON.stringify', () => {
      // Arrange
      const teamName = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teamNames.manchesterUnited }))
      const obj = { teamName }

      // Act
      const jsonString = JSON.stringify(obj)

      // Assert
      expect(jsonString).toBe(`{"teamName":"${TEST_CONSTANTS.teamNames.manchesterUnited}"}`)
    })
  })

  describe('Immutability', () => {
    it('should be immutable', () => {
      // Arrange
      const teamName = expectSuccess(TeamName.create({ value: TEST_CONSTANTS.teams.realMadrid.name }))

      // Act & Assert
      // TypeScript should prevent modification of the value property
      // This test verifies the getValue() returns the same value
      expect(teamName.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.name)
      expect(teamName.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.name) // Still the same
    })
  })
})
