import { Team } from '@domain/models/team/Team.js'
import { City } from '@domain/value-objects/City.js'
import { FoundedYear } from '@domain/value-objects/FoundedYear.js'
import { TeamName } from '@domain/value-objects/TeamName.js'
import { faker } from '@faker-js/faker'
import { buildTeam } from '@infrastructure/testing/team-builders.js'
import { IdUtils, type TeamId, ValidationError } from '@team-pulse/shared'
import { expectErrorType, expectSuccess } from '@team-pulse/shared/testing/helpers'
import { describe, expect, it } from 'vitest'

describe('Team Domain Entity', () => {
  describe('create', () => {
    it('should create a valid team', () => {
      // Arrange
      const team = buildTeam()

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(typeof team.id).toBe('string') // Branded Type check

      expect(team.name).toBeInstanceOf(TeamName)
      expect(team.city).toBeInstanceOf(City)
      expect(team.foundedYear).toBeInstanceOf(FoundedYear)

      expect(team.createdAt).toBeInstanceOf(Date)
      expect(team.updatedAt).toBeInstanceOf(Date)
    })

    it('should create team without founded year', () => {
      // Arrange & Act
      const team = buildTeam({ foundedYear: null })

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.foundedYear).toBeNull()
    })

    // -------------------------------------------------------------------------
    // VALIDATION TESTS (The Saboteur 🕵️‍♂️)
    // Here we don't use buildTeam because we want it to fail.
    // We use Team.create manually injecting poison.
    // -------------------------------------------------------------------------

    it('should return error for empty name', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Team.create({
          city: faker.location.city(),
          id: IdUtils.generate<TeamId>(),
          name: '', // 💥 Empty name
        }),
      })
    })

    it('should return error for name exceeding max length', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Team.create({
          city: faker.location.city(),
          id: IdUtils.generate<TeamId>(),
          name: faker.string.alpha(101), // 💥 Exceeding max length
        }),
      })
    })

    it('should return error for empty city', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Team.create({
          city: '', // 💥 Empty city
          id: IdUtils.generate<TeamId>(),
          name: faker.company.name(),
        }),
      })
    })

    it('should return error for invalid founded year (too old)', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Team.create({
          city: faker.location.city(),
          foundedYear: 1700, // 💥 Invalid founded year (too old)
          id: IdUtils.generate<TeamId>(),
          name: faker.company.name(),
        }),
      })
    })

    it('should return error for invalid founded year (future)', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Team.create({
          city: faker.location.city(),
          foundedYear: new Date().getFullYear() + 100, // 💥 Future founded year
          id: IdUtils.generate<TeamId>(),
          name: faker.company.name(),
        }),
      })
    })

    it('should return error for empty id', () => {
      expectErrorType({
        errorType: ValidationError,
        result: Team.create({
          city: faker.location.city(),
          id: '', // 💥 Empty ID
          name: faker.company.name(),
        }),
      })
    })
  })

  describe('create with timestamps', () => {
    it('should create team with provided timestamps', () => {
      // Arrange
      const createdAt = faker.date.past()
      const updatedAt = faker.date.future({ refDate: createdAt })

      // Act
      const team = buildTeam({ createdAt, updatedAt })

      // Assert
      expect(team.createdAt).toBe(createdAt)
      expect(team.updatedAt).toBe(updatedAt)
    })

    it('should create team with auto-generated timestamps when not provided', () => {
      // Arrange
      const before = new Date()

      // Act
      const team = buildTeam() // No timestamps provided

      const after = new Date()

      // Assert
      expect(team.createdAt).toBeInstanceOf(Date)
      expect(team.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(team.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('fromValueObjects', () => {
    it('should create team from validated value objects without re-validation', () => {
      // Arrange
      // This test is still manual because it tests a static method that requires
      // Value Objects already instantiated.
      const id = IdUtils.generate<TeamId>()
      const name = expectSuccess(TeamName.create({ value: faker.company.name() }))
      const city = expectSuccess(City.create({ value: faker.location.city() }))
      const foundedYear = expectSuccess(FoundedYear.create({ value: 1990 }))
      const createdAt = new Date()
      const updatedAt = new Date()

      // Act
      const team = Team.fromValueObjects({ city, createdAt, foundedYear, id, name, updatedAt })

      // Assert
      expect(team).toBeInstanceOf(Team)
      expect(team.id).toBe(id)
      expect(team.name).toBe(name)
    })
  })

  describe('update', () => {
    it('should update team name', () => {
      // Arrange
      const team = buildTeam() // Valid team base
      const newName = faker.company.name()

      // Act
      const updated = expectSuccess(team.update({ name: newName }))

      // Assert
      expect(updated.name.getValue()).toBe(newName)
      expect(updated.id).toBe(team.id)
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(team.updatedAt.getTime())
    })

    it('should update team city', () => {
      const team = buildTeam()
      const newCity = faker.location.city()

      const updated = expectSuccess(team.update({ city: newCity }))

      expect(updated.city.getValue()).toBe(newCity)
    })

    it('should update founded year', () => {
      const team = buildTeam({ foundedYear: 1990 })

      const updated = expectSuccess(team.update({ foundedYear: 2000 }))

      expect(updated.foundedYear?.getValue()).toBe(2000)
    })

    it('should update founded year to null', () => {
      const team = buildTeam({ foundedYear: 1990 })

      const updated = expectSuccess(team.update({ foundedYear: null }))

      expect(updated.foundedYear).toBeNull()
    })

    it('should return error for invalid name update', () => {
      const team = buildTeam()
      // Try to update with invalid data -> Should fail
      expectErrorType({
        errorType: ValidationError,
        result: team.update({ name: '' }),
      })
    })

    it('should preserve createdAt when updating', () => {
      const oldDate = faker.date.past()
      const team = buildTeam({ createdAt: oldDate })

      const updated = expectSuccess(team.update({ name: 'New Name' }))

      expect(updated.createdAt).toBe(oldDate)
    })
  })

  describe('toObject', () => {
    it('should convert team to plain object', () => {
      const team = buildTeam()

      const obj = team.toObject()

      expect(obj).toEqual({
        city: team.city.getValue(),
        createdAt: team.createdAt,
        foundedYear: team.foundedYear?.getValue() ?? null,
        id: team.id,
        name: team.name.getValue(),
        updatedAt: team.updatedAt,
      })
    })
  })

  describe('toDTO', () => {
    it('should convert team to DTO with ISO date strings', () => {
      const team = buildTeam()

      const dto = team.toDTO()

      expect(dto).toEqual({
        city: team.city.getValue(),
        createdAt: team.createdAt.toISOString(),
        foundedYear: team.foundedYear?.getValue() ?? null,
        id: team.id,
        name: team.name.getValue(),
        updatedAt: team.updatedAt.toISOString(),
      })
    })
  })
})
