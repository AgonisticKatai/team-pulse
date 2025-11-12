import type { TeamResponseDTO } from '@team-pulse/shared'
import { describe, expect, it } from 'vitest'
import { ValidationError } from '../errors'
import { City, EntityId, FoundedYear, TeamName } from '../value-objects'
import { type CreateTeamData, Team } from './Team'

describe('Team', () => {
  // Test data helpers
  const createValidTeamData = () => ({
    city: 'Barcelona',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    foundedYear: 1899,
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'FC Barcelona',
    updatedAt: new Date('2024-01-01T12:00:00Z'),
  })

  describe('create()', () => {
    it('should create team with valid data', () => {
      // Arrange
      const data = createValidTeamData()

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeNull()
      expect(team).toBeDefined()
      expect(team?.getId().getValue()).toBe(data.id)
      expect(team?.getName().getValue()).toBe('FC Barcelona')
      expect(team?.getCity().getValue()).toBe('Barcelona')
      expect(team?.getFoundedYear()?.getValue()).toBe(1899)
      expect(team?.getCreatedAt()).toBe(data.createdAt)
      expect(team?.getUpdatedAt()).toBe(data.updatedAt)
    })

    it('should create team without founded year', () => {
      // Arrange
      const { foundedYear: _foundedYear, ...dataWithoutYear } = createValidTeamData()

      // Act
      const [error, team] = Team.create(dataWithoutYear)

      // Assert
      expect(error).toBeNull()
      expect(team).toBeDefined()
      expect(team?.getFoundedYear()).toBeNull()
    })

    it('should create team with null founded year', () => {
      // Arrange
      const data = {
        ...createValidTeamData(),
        foundedYear: null,
      }

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeNull()
      expect(team).toBeDefined()
      expect(team?.getFoundedYear()).toBeNull()
    })

    it('should fail with invalid id', () => {
      // Arrange
      const data = {
        ...createValidTeamData(),
        id: '', // Empty string is invalid
      }

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(team).toBeNull()
    })

    it('should fail with empty name', () => {
      // Arrange
      const data = {
        ...createValidTeamData(),
        name: '',
      }

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(team).toBeNull()
    })

    it('should fail with invalid city', () => {
      // Arrange
      const data = {
        ...createValidTeamData(),
        city: '',
      }

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(team).toBeNull()
    })

    it('should fail with invalid founded year', () => {
      // Arrange
      const data = {
        ...createValidTeamData(),
        foundedYear: 1500, // Too old
      }

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(team).toBeNull()
    })

    it('should create team with default dates when not provided', () => {
      // Arrange
      const data = {
        city: 'Barcelona',
        foundedYear: 1899,
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'FC Barcelona',
      }
      const before = Date.now()

      // Act
      const [, team] = Team.create(data)

      const after = Date.now()

      // Assert
      const createdAt = team?.getCreatedAt().getTime()
      const updatedAt = team?.getUpdatedAt().getTime()
      expect(createdAt).toBeGreaterThanOrEqual(before)
      expect(createdAt).toBeLessThanOrEqual(after)
      expect(updatedAt).toBeGreaterThanOrEqual(before)
      expect(updatedAt).toBeLessThanOrEqual(after)
    })

    it('should handle date strings', () => {
      // Arrange
      const data: CreateTeamData = {
        ...createValidTeamData(),
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      }

      // Act
      const [error, team] = Team.create(data)

      // Assert
      expect(error).toBeNull()
      expect(team?.getCreatedAt()).toBeInstanceOf(Date)
      expect(team?.getUpdatedAt()).toBeInstanceOf(Date)
    })

    it('should trim whitespace from name', () => {
      // Arrange
      const data = {
        ...createValidTeamData(),
        name: '  FC Barcelona  ',
      }

      // Act
      const [, team] = Team.create(data)

      // Assert
      expect(team?.getName().getValue()).toBe('FC Barcelona')
    })
  })

  describe('fromValueObjects()', () => {
    it('should create team from value objects', () => {
      // Arrange
      const [, id] = EntityId.create('123e4567-e89b-12d3-a456-426614174000')
      const [, name] = TeamName.create('FC Barcelona')
      const [, city] = City.create('Barcelona')
      const [, foundedYear] = FoundedYear.create(1899)

      const props = {
        city: city!,
        createdAt: new Date('2024-01-01'),
        foundedYear,
        id: id!,
        name: name!,
        updatedAt: new Date('2024-01-01'),
      }

      // Act
      const team = Team.fromValueObjects(props)

      // Assert
      expect(team).toBeDefined()
      expect(team.getId()).toBe(id)
      expect(team.getName()).toBe(name)
      expect(team.getCity()).toBe(city)
      expect(team.getFoundedYear()).toBe(foundedYear)
    })
  })

  describe('fromDTO()', () => {
    it('should create team from valid DTO', () => {
      // Arrange
      const dto: TeamResponseDTO = {
        city: 'Barcelona',
        createdAt: '2024-01-01T00:00:00Z',
        foundedYear: 1899,
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'FC Barcelona',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      // Act
      const [error, team] = Team.fromDTO(dto)

      // Assert
      expect(error).toBeNull()
      expect(team).toBeDefined()
      expect(team?.getName().getValue()).toBe('FC Barcelona')
      expect(team?.getCity().getValue()).toBe('Barcelona')
      expect(team?.getFoundedYear()?.getValue()).toBe(1899)
    })

    it('should create team from DTO without founded year', () => {
      // Arrange
      const dto: TeamResponseDTO = {
        city: 'Barcelona',
        createdAt: '2024-01-01T00:00:00Z',
        foundedYear: null,
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'FC Barcelona',
        updatedAt: '2024-01-01T00:00:00Z',
      }

      // Act
      const [error, team] = Team.fromDTO(dto)

      // Assert
      expect(error).toBeNull()
      expect(team?.getFoundedYear()).toBeNull()
    })

    it('should fail with invalid DTO', () => {
      // Arrange
      const dto: TeamResponseDTO = {
        city: 'Barcelona',
        createdAt: '2024-01-01T00:00:00Z',
        foundedYear: 1899,
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: '', // Empty name is invalid
        updatedAt: '2024-01-01T00:00:00Z',
      }

      // Act
      const [error, team] = Team.fromDTO(dto)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(team).toBeNull()
    })
  })

  describe('fromDTOList()', () => {
    it('should create array of teams from DTOs', () => {
      // Arrange
      const dtos: TeamResponseDTO[] = [
        {
          city: 'Barcelona',
          createdAt: '2024-01-01T00:00:00Z',
          foundedYear: 1899,
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'FC Barcelona',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          city: 'Madrid',
          createdAt: '2024-01-01T00:00:00Z',
          foundedYear: 1902,
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Real Madrid',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      // Act
      const [error, teams] = Team.fromDTOList(dtos)

      // Assert
      expect(error).toBeNull()
      expect(teams).toHaveLength(2)
      expect(teams?.[0]?.getName().getValue()).toBe('FC Barcelona')
      expect(teams?.[1]?.getName().getValue()).toBe('Real Madrid')
    })

    it('should fail on first invalid DTO', () => {
      // Arrange
      const dtos: TeamResponseDTO[] = [
        {
          city: 'Barcelona',
          createdAt: '2024-01-01T00:00:00Z',
          foundedYear: 1899,
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'FC Barcelona',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          city: 'Madrid',
          createdAt: '2024-01-01T00:00:00Z',
          foundedYear: 1902,
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: '', // Empty name is invalid
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ]

      // Act
      const [error, teams] = Team.fromDTOList(dtos)

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(teams).toBeNull()
    })

    it('should return empty array for empty list', () => {
      // Arrange
      const dtos: TeamResponseDTO[] = []

      // Act
      const [error, teams] = Team.fromDTOList(dtos)

      // Assert
      expect(error).toBeNull()
      expect(teams).toEqual([])
    })
  })

  describe('emptyList()', () => {
    it('should return empty array', () => {
      // Act
      const result = Team.emptyList()

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })

  describe('update()', () => {
    it('should update name only', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())
      const newName = 'New Team Name'

      // Act
      const [error, updated] = team!.update({ name: newName })

      // Assert
      expect(error).toBeNull()
      expect(updated?.getName().getValue()).toBe(newName)
      expect(updated?.getCity()).toBe(team?.getCity())
      expect(updated?.getFoundedYear()).toBe(team?.getFoundedYear())
    })

    it('should update city only', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())
      const newCity = 'Madrid'

      // Act
      const [error, updated] = team!.update({ city: newCity })

      // Assert
      expect(error).toBeNull()
      expect(updated?.getCity().getValue()).toBe(newCity)
      expect(updated?.getName()).toBe(team?.getName())
      expect(updated?.getFoundedYear()).toBe(team?.getFoundedYear())
    })

    it('should update founded year only', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())
      const newYear = 1900

      // Act
      const [error, updated] = team!.update({ foundedYear: newYear })

      // Assert
      expect(error).toBeNull()
      expect(updated?.getFoundedYear()?.getValue()).toBe(newYear)
      expect(updated?.getName()).toBe(team?.getName())
      expect(updated?.getCity()).toBe(team?.getCity())
    })

    it('should update all fields', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const [error, updated] = team!.update({
        city: 'Madrid',
        foundedYear: 1902,
        name: 'Real Madrid',
      })

      // Assert
      expect(error).toBeNull()
      expect(updated?.getName().getValue()).toBe('Real Madrid')
      expect(updated?.getCity().getValue()).toBe('Madrid')
      expect(updated?.getFoundedYear()?.getValue()).toBe(1902)
    })

    it('should set founded year to null', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const [error, updated] = team!.update({ foundedYear: null })

      // Assert
      expect(error).toBeNull()
      expect(updated?.getFoundedYear()).toBeNull()
    })

    it('should preserve immutability (return new instance)', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())
      const originalName = team?.getName().getValue()

      // Act
      const [, updated] = team!.update({ name: 'New Name' })

      // Assert
      expect(updated).not.toBe(team)
      expect(team?.getName().getValue()).toBe(originalName)
      expect(updated?.getName().getValue()).toBe('New Name')
    })

    it('should preserve id and createdAt', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())
      const originalId = team?.getId()
      const originalCreatedAt = team?.getCreatedAt()

      // Act
      const [, updated] = team!.update({ name: 'New Name' })

      // Assert
      expect(updated?.getId()).toBe(originalId)
      expect(updated?.getCreatedAt()).toBe(originalCreatedAt)
    })

    it('should update updatedAt to current date', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())
      const before = Date.now()

      // Act
      const [, updated] = team!.update({ name: 'New Name' })

      const after = Date.now()

      // Assert
      const updatedAt = updated?.getUpdatedAt().getTime()
      expect(updatedAt).toBeGreaterThanOrEqual(before)
      expect(updatedAt).toBeLessThanOrEqual(after)
    })

    it('should fail with invalid name', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const [error, updated] = team!.update({ name: '' })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(updated).toBeNull()
    })

    it('should fail with invalid city', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const [error, updated] = team!.update({ city: '' })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(updated).toBeNull()
    })

    it('should fail with invalid founded year', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const [error, updated] = team!.update({ foundedYear: 1500 })

      // Assert
      expect(error).toBeInstanceOf(ValidationError)
      expect(updated).toBeNull()
    })
  })

  describe('business logic methods', () => {
    describe('getAge()', () => {
      it('should return team age when founded year is set', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: 2000,
        })
        const currentYear = new Date().getFullYear()
        const expectedAge = currentYear - 2000

        // Act
        const age = team?.getAge()

        // Assert
        expect(age).toBe(expectedAge)
      })

      it('should return null when founded year is not set', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: null,
        })

        // Act
        const age = team?.getAge()

        // Assert
        expect(age).toBeNull()
      })
    })

    describe('wasFoundedBefore()', () => {
      it('should return true when founded before given year', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: 1899,
        })

        // Act & Assert
        expect(team?.wasFoundedBefore(1900)).toBe(true)
        expect(team?.wasFoundedBefore(2000)).toBe(true)
      })

      it('should return false when founded after given year', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: 1899,
        })

        // Act & Assert
        expect(team?.wasFoundedBefore(1899)).toBe(false)
        expect(team?.wasFoundedBefore(1800)).toBe(false)
      })

      it('should return false when founded year is not set', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: null,
        })

        // Act & Assert
        expect(team?.wasFoundedBefore(2000)).toBe(false)
      })
    })

    describe('wasFoundedAfter()', () => {
      it('should return true when founded after given year', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: 1899,
        })

        // Act & Assert
        expect(team?.wasFoundedAfter(1800)).toBe(true)
        expect(team?.wasFoundedAfter(1898)).toBe(true)
      })

      it('should return false when founded before given year', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: 1899,
        })

        // Act & Assert
        expect(team?.wasFoundedAfter(1899)).toBe(false)
        expect(team?.wasFoundedAfter(1900)).toBe(false)
      })

      it('should return false when founded year is not set', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: null,
        })

        // Act & Assert
        expect(team?.wasFoundedAfter(1800)).toBe(false)
      })
    })

    describe('hasFoundedYear()', () => {
      it('should return true when founded year is set', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: 1899,
        })

        // Act & Assert
        expect(team?.hasFoundedYear()).toBe(true)
      })

      it('should return false when founded year is not set', () => {
        // Arrange
        const [, team] = Team.create({
          ...createValidTeamData(),
          foundedYear: null,
        })

        // Act & Assert
        expect(team?.hasFoundedYear()).toBe(false)
      })
    })

    describe('equals()', () => {
      it('should return true for teams with same id', () => {
        // Arrange
        const id = '123e4567-e89b-12d3-a456-426614174000'
        const [, team1] = Team.create({ ...createValidTeamData(), id })
        const [, team2] = Team.create({
          ...createValidTeamData(),
          id,
          name: 'Different Name',
        })

        // Act & Assert
        expect(team1?.equals(team2!)).toBe(true)
      })

      it('should return false for teams with different id', () => {
        // Arrange
        const [, team1] = Team.create({
          ...createValidTeamData(),
          id: '123e4567-e89b-12d3-a456-426614174000',
        })
        const [, team2] = Team.create({
          ...createValidTeamData(),
          id: '223e4567-e89b-12d3-a456-426614174000',
        })

        // Act & Assert
        expect(team1?.equals(team2!)).toBe(false)
      })
    })
  })

  describe('toObject()', () => {
    it('should return plain object with all properties', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const obj = team?.toObject()

      // Assert
      expect(obj).toEqual({
        city: 'Barcelona',
        createdAt: expect.any(String),
        foundedYear: 1899,
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'FC Barcelona',
        updatedAt: expect.any(String),
      })
    })

    it('should serialize dates to ISO strings', () => {
      // Arrange
      const data = createValidTeamData()
      const [, team] = Team.create(data)

      // Act
      const obj = team?.toObject()

      // Assert
      expect(obj!.createdAt).toBe(data.createdAt.toISOString())
      expect(obj!.updatedAt).toBe(data.updatedAt.toISOString())
    })

    it('should handle null founded year', () => {
      // Arrange
      const [, team] = Team.create({
        ...createValidTeamData(),
        foundedYear: null,
      })

      // Act
      const obj = team?.toObject()

      // Assert
      expect(obj!.foundedYear).toBeNull()
    })
  })

  describe('toDTO()', () => {
    it('should return DTO with serialized properties', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const dto = team?.toDTO()

      // Assert
      expect(dto).toEqual({
        city: 'Barcelona',
        createdAt: expect.any(String),
        foundedYear: 1899,
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'FC Barcelona',
        updatedAt: expect.any(String),
      })
    })

    it('should match toObject() output', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const obj = team?.toObject()
      const dto = team?.toDTO()

      // Assert
      expect(dto).toEqual(obj)
    })
  })

  describe('toJSON()', () => {
    it('should return same as toObject()', () => {
      // Arrange
      const [, team] = Team.create(createValidTeamData())

      // Act
      const json = team?.toJSON()
      const obj = team?.toObject()

      // Assert
      expect(json).toEqual(obj)
    })
  })
})
