import { faker } from '@faker-js/faker'
import { buildCreateTeamDTO, buildTeam } from '@shared/testing/builders/team-builders.js'
import { ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing'
import { describe, expect, it } from 'vitest'
import { Team } from './Team.js'

describe('Team Entity', () => {
  // ===========================================================================
  // 1. CREATE (Factory & Validation)
  // ===========================================================================
  describe('create', () => {
    it('should create a valid Team instance with full data', () => {
      const input = buildCreateTeamDTO()

      const result = Team.create({ ...input, id: faker.string.uuid() })

      const team = expectSuccess(result)
      expect(team).toBeInstanceOf(Team)
      expect(team.id).toBeDefined()
      expect(team.name.getValue()).toBe(input.name)
    })

    it('should fail if any inner Value Object is invalid (Fail Fast)', () => {
      const input = buildCreateTeamDTO({ name: 'a' })
      const result = Team.create({ ...input, id: faker.string.uuid() })

      expectErrorType({ errorType: ValidationError, result })
    })
  })

  // ===========================================================================
  // 2. UPDATE (Immutability & Merge Logic)
  // ===========================================================================
  describe('update', () => {
    it('should update name and return a NEW instance', () => {
      // Arrange
      const team = buildTeam({ updatedAt: faker.date.past() })
      const newName = 'Updated Name FC'

      // Act
      const result = team.update({ name: newName })

      // Assert
      const updatedTeam = expectSuccess(result)

      expect(updatedTeam).not.toBe(team) // Immutability
      expect(updatedTeam.id).toBe(team.id) // Identity preserved
      expect(updatedTeam.name.getValue()).toBe(newName) // Change applied
      expect(updatedTeam.updatedAt.getTime()).toBeGreaterThan(team.updatedAt.getTime()) // Audit updated
    })

    it('should IGNORE undefined fields (Keep original value)', () => {
      const originalName = 'Original Name'
      const team = buildTeam({ name: originalName })

      // Act
      const updatedTeam = expectSuccess(team.update({ name: undefined }))

      // Assert
      expect(updatedTeam.name.getValue()).toBe(originalName)
    })

    it('should fail if the update creates an invalid state', () => {
      const team = buildTeam()

      // Act: Try to update with an invalid name (empty)
      const result = team.update({ name: '' })

      // Assert
      expectErrorType({ errorType: ValidationError, result })
    })
  })

  // ===========================================================================
  // 3. SERIALIZATION
  // ===========================================================================
  describe('toPrimitives', () => {
    it('should return a plain object matching the internal state', () => {
      const team = buildTeam()
      const primitives = team.toPrimitives()

      expect(primitives.id).toBe(team.id)
      expect(primitives.name).toBe(team.name.getValue())
      expect(primitives.createdAt).toBeInstanceOf(Date)
    })
  })
})
