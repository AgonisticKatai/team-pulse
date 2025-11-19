import { sql } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { Team } from '../../../domain/models/Team.js'
import { expectSuccess, TEST_CONSTANTS } from '../../testing/index.js'
import { setupTestEnvironment } from '../../testing/test-helpers.js'
import type { Database } from '../connection.js'
import { DrizzleTeamRepository } from './DrizzleTeamRepository.js'

describe('DrizzleTeamRepository - Integration Tests', () => {
  let repository: DrizzleTeamRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = DrizzleTeamRepository.create({ db })
  })

  beforeEach(async () => {
    // Clean up teams table before each test
    await db.execute(sql`TRUNCATE TABLE teams RESTART IDENTITY CASCADE`)
  })

  describe('save', () => {
    it('should insert a new team successfully', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      // Act
      const result = await repository.save({ team: teamResult.value })

      // Assert
      const savedTeam = expectSuccess(result)
      expect(savedTeam.id.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.id)
      expect(savedTeam.name.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.name)
      expect(savedTeam.city.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.city)
      expect(savedTeam.foundedYear?.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.foundedYear)
      expect(savedTeam.createdAt).toBeInstanceOf(Date)
      expect(savedTeam.updatedAt).toBeInstanceOf(Date)
    })

    it('should update an existing team (upsert)', async () => {
      // Arrange - Create initial team
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Create updated team with same ID
      const updatedTeamResult = Team.create({
        city: 'Barcelona',
        foundedYear: 1899,
        id: TEST_CONSTANTS.teams.realMadrid.id, // Same ID
        name: 'Updated Name',
      })

      if (!updatedTeamResult.ok) return

      // Act - Save again (upsert)
      const result = await repository.save({ team: updatedTeamResult.value })

      // Assert
      const savedTeam = expectSuccess(result)
      expect(savedTeam.name.getValue()).toBe('Updated Name')
      expect(savedTeam.city.getValue()).toBe('Barcelona')
      expect(savedTeam.foundedYear?.getValue()).toBe(1899)

      // Verify only one team exists
      const allTeams = expectSuccess(await repository.findAll())
      expect(allTeams).toHaveLength(1)
    })

    it('should save a team without founded year', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: null,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      // Act
      const result = await repository.save({ team: teamResult.value })

      // Assert
      const savedTeam = expectSuccess(result)
      expect(savedTeam.foundedYear).toBeNull()
    })
  })

  describe('findById', () => {
    it('should find a team by id when it exists', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Act
      const result = await repository.findById({ id: TEST_CONSTANTS.teams.realMadrid.id })

      // Assert
      const foundTeam = expectSuccess(result)
      expect(foundTeam).not.toBeNull()
      expect(foundTeam?.id.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.id)
      expect(foundTeam?.name.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.name)
    })

    it('should return null when team does not exist', async () => {
      // Act
      const result = await repository.findById({ id: 'non-existent-id' })

      // Assert
      const foundTeam = expectSuccess(result)
      expect(foundTeam).toBeNull()
    })
  })

  describe('findByName', () => {
    it('should find a team by name when it exists', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Act
      const result = await repository.findByName({ name: TEST_CONSTANTS.teams.realMadrid.name })

      // Assert
      const foundTeam = expectSuccess(result)
      expect(foundTeam).not.toBeNull()
      expect(foundTeam?.id.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.id)
      expect(foundTeam?.name.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.name)
    })

    it('should return null when team does not exist', async () => {
      // Act
      const result = await repository.findByName({ name: 'Non-existent Team' })

      // Assert
      const foundTeam = expectSuccess(result)
      expect(foundTeam).toBeNull()
    })

    it('should be case-sensitive when finding by name', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Act - Search with different case
      const result = await repository.findByName({ name: TEST_CONSTANTS.teams.realMadrid.name.toLowerCase() })

      // Assert - Should not find team (case-sensitive)
      const foundTeam = expectSuccess(result)
      expect(foundTeam).toBeNull()
    })
  })

  describe('existsByName', () => {
    it('should return true when team exists', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Act
      const result = await repository.existsByName({ name: TEST_CONSTANTS.teams.realMadrid.name })

      // Assert
      expect(expectSuccess(result)).toBe(true)
    })

    it('should return false when team does not exist', async () => {
      // Act
      const result = await repository.existsByName({ name: 'Non-existent Team' })

      // Assert
      expect(expectSuccess(result)).toBe(false)
    })

    it('should be case-sensitive when checking existence', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Act - Search with different case
      const result = await repository.existsByName({ name: TEST_CONSTANTS.teams.realMadrid.name.toLowerCase() })

      // Assert - Should not find team (case-sensitive)
      expect(expectSuccess(result)).toBe(false)
    })
  })

  describe('findAll', () => {
    it('should return an empty array when no teams exist', async () => {
      // Act
      const result = await repository.findAll()

      // Assert
      const teams = expectSuccess(result)
      expect(teams).toEqual([])
    })

    it('should return all teams', async () => {
      // Arrange - Create 3 teams
      const team1Result = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      const team2Result = Team.create({
        city: TEST_CONSTANTS.teams.fcBarcelona.city,
        foundedYear: TEST_CONSTANTS.teams.fcBarcelona.foundedYear,
        id: TEST_CONSTANTS.teams.fcBarcelona.id,
        name: TEST_CONSTANTS.teams.fcBarcelona.name,
      })

      const team3Result = Team.create({
        city: 'Liverpool',
        foundedYear: 1892,
        id: 'team-3',
        name: 'Liverpool FC',
      })

      if (!(team1Result.ok && team2Result.ok && team3Result.ok)) return

      await repository.save({ team: team1Result.value })
      await repository.save({ team: team2Result.value })
      await repository.save({ team: team3Result.value })

      // Act
      const result = await repository.findAll()

      // Assert
      const teams = expectSuccess(result)
      expect(teams).toHaveLength(3)
    })
  })

  describe('findAllPaginated', () => {
    beforeEach(async () => {
      // Create 15 teams for pagination tests
      for (let i = 1; i <= 15; i++) {
        const teamResult = Team.create({
          city: `City ${i}`,
          foundedYear: 1900 + i,
          id: `team-${i}`,
          name: `Team ${i}`,
        })

        if (!teamResult.ok) return

        await repository.save({ team: teamResult.value })
      }
    })

    it('should return first page of teams with correct total', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 10, page: 1 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(10)
      expect(total).toBe(15)
    })

    it('should return second page of teams', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 10, page: 2 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(5) // Only 5 teams on second page
      expect(total).toBe(15)
    })

    it('should return empty array when page is beyond available data', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 10, page: 3 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(0)
      expect(total).toBe(15)
    })

    it('should handle different page sizes', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 5, page: 1 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(5)
      expect(total).toBe(15)
    })

    it('should return correct total count even for empty results', async () => {
      // Arrange - Clear all teams
      await db.execute(sql`TRUNCATE TABLE teams RESTART IDENTITY CASCADE`)

      // Act
      const result = await repository.findAllPaginated({ limit: 10, page: 1 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(0)
      expect(total).toBe(0)
    })
  })

  describe('delete', () => {
    it('should delete a team by id', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      await repository.save({ team: teamResult.value })

      // Act
      const result = await repository.delete({ id: TEST_CONSTANTS.teams.realMadrid.id })

      // Assert
      expectSuccess(result)

      // Verify team was deleted
      const findResult = await repository.findById({ id: TEST_CONSTANTS.teams.realMadrid.id })
      const foundTeam = expectSuccess(findResult)
      expect(foundTeam).toBeNull()
    })

    it('should not throw error when deleting non-existent team', async () => {
      // Act
      const result = await repository.delete({ id: 'non-existent-id' })

      // Assert - Should succeed (idempotent delete)
      expectSuccess(result)
    })
  })

  describe('edge cases', () => {
    it('should handle teams with and without foundedYear', async () => {
      // Arrange - Team with foundedYear
      const team1Result = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      // Team without foundedYear
      const team2Result = Team.create({
        city: 'London',
        foundedYear: null,
        id: 'team-no-year',
        name: 'Team Without Year',
      })

      if (!(team1Result.ok && team2Result.ok)) return

      // Act
      await repository.save({ team: team1Result.value })
      await repository.save({ team: team2Result.value })

      // Assert
      const allTeams = expectSuccess(await repository.findAll())
      expect(allTeams).toHaveLength(2)

      const teamWithYear = allTeams.find((t) => t.id.getValue() === TEST_CONSTANTS.teams.realMadrid.id)
      const teamWithoutYear = allTeams.find((t) => t.id.getValue() === 'team-no-year')

      expect(teamWithYear?.foundedYear?.getValue()).toBe(TEST_CONSTANTS.teams.realMadrid.foundedYear)
      expect(teamWithoutYear?.foundedYear).toBeNull()
    })

    it('should handle timestamps correctly', async () => {
      // Arrange
      const teamResult = Team.create({
        city: TEST_CONSTANTS.teams.realMadrid.city,
        foundedYear: TEST_CONSTANTS.teams.realMadrid.foundedYear,
        id: TEST_CONSTANTS.teams.realMadrid.id,
        name: TEST_CONSTANTS.teams.realMadrid.name,
      })

      if (!teamResult.ok) return

      // Act
      await repository.save({ team: teamResult.value })

      // Assert
      const foundTeam = expectSuccess(await repository.findById({ id: TEST_CONSTANTS.teams.realMadrid.id }))
      expect(foundTeam).not.toBeNull()
      expect(foundTeam?.createdAt).toBeInstanceOf(Date)
      expect(foundTeam?.updatedAt).toBeInstanceOf(Date)
      expect(foundTeam?.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
      expect(foundTeam?.updatedAt.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should handle very old and very new founded years', async () => {
      // Arrange - Very old team
      const oldTeamResult = Team.create({
        city: 'Sheffield',
        foundedYear: 1857, // Sheffield FC - oldest football club
        id: 'old-team',
        name: 'Old Team',
      })

      // Very recent team
      const newTeamResult = Team.create({
        city: 'New City',
        foundedYear: 2023,
        id: 'new-team',
        name: 'New Team',
      })

      if (!(oldTeamResult.ok && newTeamResult.ok)) return

      // Act
      await repository.save({ team: oldTeamResult.value })
      await repository.save({ team: newTeamResult.value })

      // Assert
      const oldTeam = expectSuccess(await repository.findById({ id: 'old-team' }))
      const newTeam = expectSuccess(await repository.findById({ id: 'new-team' }))

      expect(oldTeam?.foundedYear?.getValue()).toBe(1857)
      expect(newTeam?.foundedYear?.getValue()).toBe(2023)
    })
  })
})
