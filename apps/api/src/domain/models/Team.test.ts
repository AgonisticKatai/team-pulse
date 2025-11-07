import { describe, expect, it } from 'vitest'
import { expectError, expectSuccess } from '../../infrastructure/testing/result-helpers.js'
import { ValidationError } from '../errors/index.js'
import { City, EntityId, FoundedYear, TeamName } from '../value-objects/index.js'
import { Team } from './Team.js'

describe('Team Domain Entity', () => {
  describe('create', () => {
    it('should create a valid team', () => {
      // Arrange & Act
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          foundedYear: 1902,
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.id).toBeInstanceOf(EntityId)
      expect(team.id.getValue()).toBe('team-123')
      expect(team.name).toBeInstanceOf(TeamName)
      expect(team.name.getValue()).toBe('Real Madrid')
      expect(team.city).toBeInstanceOf(City)
      expect(team.city.getValue()).toBe('Madrid')
      expect(team.foundedYear).toBeInstanceOf(FoundedYear)
      expect(team.foundedYear?.getValue()).toBe(1902)
      expect(team.createdAt).toBeInstanceOf(Date)
      expect(team.updatedAt).toBeInstanceOf(Date)
    })

    it('should create team without founded year', () => {
      // Arrange & Act
      const team = expectSuccess(
        Team.create({
          city: 'Barcelona',
          id: 'team-456',
          name: 'FC Barcelona',
        }),
      )

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.foundedYear).toBeNull()
    })

    it('should create team with founded year as null', () => {
      // Arrange & Act
      const team = expectSuccess(
        Team.create({
          city: 'Manchester',
          foundedYear: null,
          id: 'team-789',
          name: 'Manchester United',
        }),
      )

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.foundedYear).toBeNull()
    })

    it('should return error for empty name', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: 'Madrid',
          id: 'team-123',
          name: '',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('name')
    })

    it('should return error for name exceeding max length', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: 'Madrid',
          id: 'team-123',
          name: 'a'.repeat(101),
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('name')
    })

    it('should return error for empty city', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: '',
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('city')
    })

    it('should return error for city exceeding max length', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: 'a'.repeat(101),
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('city')
    })

    it('should return error for invalid founded year (too old)', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: 'Madrid',
          foundedYear: 1799,
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('foundedYear')
    })

    it('should return error for invalid founded year (future)', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: 'Madrid',
          foundedYear: new Date().getFullYear() + 1,
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('foundedYear')
    })

    it('should return error for empty id', () => {
      // Arrange & Act
      const error = expectError(
        Team.create({
          city: 'Madrid',
          id: '',
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('id')
    })
  })

  describe('create with timestamps', () => {
    it('should create team with provided timestamps', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00Z')
      const updatedAt = new Date('2025-01-02T00:00:00Z')

      // Act
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          createdAt,
          foundedYear: 1902,
          id: 'team-123',
          name: 'Real Madrid',
          updatedAt,
        }),
      )

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.createdAt).toBe(createdAt)
      expect(team.updatedAt).toBe(updatedAt)
    })

    it('should create team with auto-generated timestamps when not provided', () => {
      // Arrange
      const before = new Date()

      // Act
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      const after = new Date()

      // Assert
      expect(team.createdAt).toBeInstanceOf(Date)
      expect(team.updatedAt).toBeInstanceOf(Date)
      expect(team.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(team.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('fromValueObjects', () => {
    it('should create team from validated value objects without re-validation', () => {
      // Arrange
      const id = expectSuccess(EntityId.create({ value: 'team-123' }))
      const name = expectSuccess(TeamName.create({ value: 'Real Madrid' }))
      const city = expectSuccess(City.create({ value: 'Madrid' }))
      const foundedYear = expectSuccess(FoundedYear.create({ value: 1902 }))
      const createdAt = new Date()
      const updatedAt = new Date()

      // Act
      const team = Team.fromValueObjects({
        city,
        createdAt,
        foundedYear,
        id,
        name,
        updatedAt,
      })

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.id).toBe(id)
      expect(team.name).toBe(name)
      expect(team.city).toBe(city)
      expect(team.foundedYear).toBe(foundedYear)
    })
  })

  describe('update', () => {
    it('should update team name', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          foundedYear: 1902,
          id: 'team-123',
          name: 'Old Name',
        }),
      )

      // Act
      const updated = expectSuccess(team.update({ name: 'Real Madrid' }))

      // Assert
      expect(updated.name.getValue()).toBe('Real Madrid')
      expect(updated.id.equals({ other: team.id })).toBe(true)
      expect(updated.updatedAt).not.toBe(team.updatedAt)
    })

    it('should update team city', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Old City',
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const updated = expectSuccess(team.update({ city: 'Madrid' }))

      // Assert
      expect(updated.city.getValue()).toBe('Madrid')
    })

    it('should update founded year', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          foundedYear: 1900,
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const updated = expectSuccess(team.update({ foundedYear: 1902 }))

      // Assert
      expect(updated.foundedYear?.getValue()).toBe(1902)
    })

    it('should update founded year to null', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          foundedYear: 1902,
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const updated = expectSuccess(team.update({ foundedYear: null }))

      // Assert
      expect(updated.foundedYear).toBeNull()
    })

    it('should update multiple fields', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Old City',
          id: 'team-123',
          name: 'Old Name',
        }),
      )

      // Act
      const updated = expectSuccess(
        team.update({
          city: 'Madrid',
          foundedYear: 1902,
          name: 'Real Madrid',
        }),
      )

      // Assert
      expect(updated.name.getValue()).toBe('Real Madrid')
      expect(updated.city.getValue()).toBe('Madrid')
      expect(updated.foundedYear?.getValue()).toBe(1902)
    })

    it('should return error for invalid name', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const error = expectError(team.update({ name: '' }))

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.field).toBe('name')
    })

    it('should preserve createdAt when updating', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          id: 'team-123',
          name: 'Old Name',
        }),
      )

      // Act
      const updated = expectSuccess(team.update({ name: 'Real Madrid' }))

      // Assert
      expect(updated.createdAt).toBe(team.createdAt)
    })
  })

  describe('toObject', () => {
    it('should convert team to plain object', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          foundedYear: 1902,
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const obj = team.toObject()

      // Assert
      expect(obj).toEqual({
        city: 'Madrid',
        createdAt: team.createdAt,
        foundedYear: 1902,
        id: 'team-123',
        name: 'Real Madrid',
        updatedAt: team.updatedAt,
      })
    })

    it('should handle team without founded year', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const obj = team.toObject()

      // Assert
      expect(obj.foundedYear).toBeNull()
    })
  })

  describe('toDTO', () => {
    it('should convert team to DTO with ISO date strings', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          foundedYear: 1902,
          id: 'team-123',
          name: 'Real Madrid',
          updatedAt: new Date('2025-01-02T00:00:00Z'),
        }),
      )

      // Act
      const dto = team.toDTO()

      // Assert
      expect(dto).toEqual({
        city: 'Madrid',
        createdAt: '2025-01-01T00:00:00.000Z',
        foundedYear: 1902,
        id: 'team-123',
        name: 'Real Madrid',
        updatedAt: '2025-01-02T00:00:00.000Z',
      })
    })

    it('should handle team without founded year in DTO', () => {
      // Arrange
      const team = expectSuccess(
        Team.create({
          city: 'Madrid',
          id: 'team-123',
          name: 'Real Madrid',
        }),
      )

      // Act
      const dto = team.toDTO()

      // Assert
      expect(dto.foundedYear).toBeNull()
    })
  })
})
