import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { describe, expect, it } from 'vitest'
import { DomainError } from './DomainError.js'
import { DuplicatedError } from './DuplicatedError.js'

describe('DuplicatedError', () => {
  describe('create factory method', () => {
    it('should create duplicated error with entityName and identifier', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(`${entityName} with identifier "${identifier}" already exists`)
      expect(error.entityName).toBe(entityName)
      expect(error.identifier).toBe(identifier)
    })

    it('should create duplicated error with string identifier', () => {
      // Arrange
      const entityName = 'User'
      const identifier = TEST_CONSTANTS.users.johnDoe.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(`${entityName} with identifier "${identifier}" already exists`)
      expect(error.entityName).toBe(entityName)
      expect(error.identifier).toBe(identifier)
    })

    it('should create duplicated error with number identifier', () => {
      // Arrange
      const entityName = 'Match'
      const identifier = 12345

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(`${entityName} with identifier "${identifier}" already exists`)
      expect(error.entityName).toBe(entityName)
      expect(error.identifier).toBe(identifier)
    })

    it('should create duplicated error without entityName', () => {
      // Arrange
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(`undefined with identifier "${identifier}" already exists`)
      expect(error.entityName).toBeUndefined()
      expect(error.identifier).toBe(identifier)
    })

    it('should create duplicated error without identifier', () => {
      // Arrange
      const entityName = 'Team'

      // Act
      const error = DuplicatedError.create({ entityName })

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe(`${entityName} with identifier "undefined" already exists`)
      expect(error.entityName).toBe(entityName)
      expect(error.identifier).toBeUndefined()
    })

    it('should create duplicated error with empty parameters', () => {
      // Arrange & Act
      const error = DuplicatedError.create({})

      // Assert
      expect(error).toBeDefined()
      expect(error.message).toBe('undefined with identifier "undefined" already exists')
      expect(error.entityName).toBeUndefined()
      expect(error.identifier).toBeUndefined()
    })
  })

  describe('properties', () => {
    it('should have code property set to DUPLICATED', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error.code).toBe('DUPLICATED')
    })

    it('should have isOperational property set to true', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error.isOperational).toBe(true)
    })

    it('should have name property set to DuplicatedError', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error.name).toBe('DuplicatedError')
    })

    it('should have stack trace', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('DuplicatedError')
    })

    it('should have entityName property', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error.entityName).toBe(entityName)
    })

    it('should have identifier property', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error.identifier).toBe(identifier)
    })
  })

  describe('create factory method', () => {
    it('should create duplicated error with entityName and identifier', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error).toBeInstanceOf(DuplicatedError)
      expect(error.message).toBe(`${entityName} with identifier "${identifier}" already exists`)
      expect(error.entityName).toBe(entityName)
      expect(error.identifier).toBe(identifier)
    })

    it('should create duplicated error for Team entity', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe('Team')
      expect(error.identifier).toBe(TEST_CONSTANTS.teams.fcBarcelona.id)
    })

    it('should create duplicated error for User entity', () => {
      // Arrange
      const entityName = 'User'
      const identifier = TEST_CONSTANTS.users.johnDoe.email

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe('User')
      expect(error.identifier).toBe(TEST_CONSTANTS.users.johnDoe.email)
    })

    it('should create duplicated error with numeric identifier', () => {
      // Arrange
      const entityName = 'Season'
      const identifier = 2024

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe('Season')
      expect(error.identifier).toBe(2024)
      expect(typeof error.identifier).toBe('number')
    })

    it('should create duplicated error without entityName', () => {
      // Arrange
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBeUndefined()
      expect(error.identifier).toBe(identifier)
    })

    it('should create duplicated error without identifier', () => {
      // Arrange
      const entityName = 'Team'

      // Act
      const error = DuplicatedError.create({ entityName })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe(entityName)
      expect(error.identifier).toBeUndefined()
    })
  })

  describe('inheritance', () => {
    it('should be instance of DomainError', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeInstanceOf(DomainError)
    })

    it('should be instance of Error', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeInstanceOf(Error)
    })

    it('should be instance of DuplicatedError', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeInstanceOf(DuplicatedError)
    })
  })

  describe('Error handling', () => {
    it('should be throwable', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id

      // Act & Assert
      expect(() => {
        throw DuplicatedError.create({ entityName, identifier })
      }).toThrow('already exists')
    })

    it('should be catchable as DuplicatedError', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id
      let caughtError: DuplicatedError | null = null

      // Act
      try {
        throw DuplicatedError.create({ entityName, identifier })
      } catch (error) {
        caughtError = error as DuplicatedError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(DuplicatedError)
      expect(caughtError?.entityName).toBe(entityName)
      expect(caughtError?.identifier).toBe(identifier)
    })

    it('should be catchable as DomainError', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id
      let caughtError: DomainError | null = null

      // Act
      try {
        throw DuplicatedError.create({ entityName, identifier })
      } catch (error) {
        caughtError = error as DomainError
      }

      // Assert
      expect(caughtError).toBeInstanceOf(DomainError)
      expect(caughtError?.code).toBe('DUPLICATED')
      expect(caughtError?.isOperational).toBe(true)
    })

    it('should be catchable as Error', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.teams.fcBarcelona.id
      let caughtError: Error | null = null

      // Act
      try {
        throw DuplicatedError.create({ entityName, identifier })
      } catch (error) {
        caughtError = error as Error
      }

      // Assert
      expect(caughtError).toBeInstanceOf(Error)
      expect(caughtError?.message).toContain('already exists')
    })
  })

  describe('Immutability', () => {
    it('should have readonly code property', () => {
      // Arrange
      const error = DuplicatedError.create({ entityName: 'Team', identifier: 'team-123' })

      // Act & Assert
      expect(error.code).toBe('DUPLICATED')
      expect(error.code).toBe('DUPLICATED')
    })

    it('should have readonly isOperational property', () => {
      // Arrange
      const error = DuplicatedError.create({ entityName: 'Team', identifier: 'team-123' })

      // Act & Assert
      expect(error.isOperational).toBe(true)
      expect(error.isOperational).toBe(true)
    })

    it('should have readonly entityName property', () => {
      // Arrange
      const error = DuplicatedError.create({ entityName: 'Team', identifier: 'team-123' })

      // Act & Assert
      expect(error.entityName).toBe('Team')
      expect(error.entityName).toBe('Team')
    })

    it('should have readonly identifier property', () => {
      // Arrange
      const error = DuplicatedError.create({ entityName: 'Team', identifier: 'team-123' })

      // Act & Assert
      expect(error.identifier).toBe('team-123')
      expect(error.identifier).toBe('team-123')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string entityName', () => {
      // Arrange
      const entityName = TEST_CONSTANTS.emails.empty
      const identifier = 'test-id'

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe('')
      expect(error.message).toBe(' with identifier "test-id" already exists')
    })

    it('should handle empty string identifier', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = TEST_CONSTANTS.emails.empty

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.identifier).toBe('')
      expect(error.message).toBe('Team with identifier "" already exists')
    })

    it('should handle zero as identifier', () => {
      // Arrange
      const entityName = 'Match'
      const identifier = 0

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.identifier).toBe(0)
      expect(error.message).toBe('Match with identifier "0" already exists')
    })

    it('should handle negative number as identifier', () => {
      // Arrange
      const entityName = 'Score'
      const identifier = -1

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.identifier).toBe(-1)
      expect(error.message).toBe('Score with identifier "-1" already exists')
    })

    it('should handle very long entityName', () => {
      // Arrange
      const entityName = 'A'.repeat(1000)
      const identifier = 'test-id'

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe(entityName)
      expect(error.entityName?.length).toBe(1000)
    })

    it('should handle very long identifier', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = 'a'.repeat(1000)

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.identifier).toBe(identifier)
      expect((error.identifier as string).length).toBe(1000)
    })

    it('should handle special characters in entityName', () => {
      // Arrange
      const entityName = 'Team<script>alert("xss")</script>'
      const identifier = 'test-id'

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.entityName).toBe(entityName)
    })

    it('should handle special characters in identifier', () => {
      // Arrange
      const entityName = 'Team'
      const identifier = 'test-id-<>&"'

      // Act
      const error = DuplicatedError.create({ entityName, identifier })

      // Assert
      expect(error).toBeDefined()
      expect(error.identifier).toBe(identifier)
    })
  })
})
