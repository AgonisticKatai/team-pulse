import { faker } from '@faker-js/faker'
import { KyselyTeamRepository } from '@features/teams/infrastructure/repositories/team/KyselyTeamRepository.js'
import type { Database } from '@shared/database/connection/connection.js'
import { buildTeam } from '@shared/testing/builders/team-builders.js'
import { setupTestEnvironment } from '@shared/testing/helpers/test-helpers.js'
import { TEAM_NAME_RULES, TeamId } from '@team-pulse/shared'
import { expectSuccess } from '@team-pulse/shared/testing'
import { sql } from 'kysely'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('KyselyTeamRepository', () => {
  let repository: KyselyTeamRepository
  let db: Database

  const { getDatabase } = setupTestEnvironment()

  beforeAll(() => {
    db = getDatabase()
    repository = KyselyTeamRepository.create({ db })
  })

  beforeEach(async () => {
    // Clean database for test isolation
    await sql`TRUNCATE TABLE teams RESTART IDENTITY CASCADE`.execute(db)
  })

  describe('Factory Pattern', () => {
    it('should create repository instance with factory method', () => {
      // Act
      const repo = KyselyTeamRepository.create({ db })

      // Assert
      expect(repo).toBeInstanceOf(KyselyTeamRepository)
    })
  })

  describe('save', () => {
    it('should save a new team', async () => {
      // Arrange
      const team = buildTeam({
        name: faker.string.alpha({ length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH } }),
      })

      // Act
      const result = await repository.save({ team })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.id).toBe(team.id)
      expect(saved.name.value).toBe(team.name.value)
    })

    it('should update existing team on conflict (upsert)', async () => {
      // Arrange - Save initial team
      const teamId = TeamId.random()
      const initialTeam = buildTeam({
        id: teamId,
        name: faker.string.alpha({ length: TEAM_NAME_RULES.MIN_LENGTH }),
      })

      await repository.save({ team: initialTeam })

      // Act - Update team
      const updatedTeam = buildTeam({
        createdAt: initialTeam.createdAt,
        id: teamId, // Same ID
        name: faker.string.alpha({ length: TEAM_NAME_RULES.MAX_LENGTH }),
      })

      const result = await repository.save({ team: updatedTeam })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.name.value).toBe(updatedTeam.name.value)

      // Verify only one team exists
      const all = expectSuccess(await repository.findAll())
      expect(all).toHaveLength(1)
    })

    it('should preserve team data integrity on upsert', async () => {
      // Arrange - Create team
      const teamId = TeamId.random()
      const team = buildTeam({ id: teamId })

      await repository.save({ team })

      // Act - Update with new name
      const updatedTeam = buildTeam({
        createdAt: team.createdAt,
        id: teamId,
        name: faker.string.alpha({ length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH } }),
      })

      const result = await repository.save({ team: updatedTeam })

      // Assert
      const saved = expectSuccess(result)
      expect(saved.name.value).toBe(updatedTeam.name.value)
      expect(saved.id).toBe(teamId)
    })
  })

  describe('findById', () => {
    it('should find team by id', async () => {
      // Arrange
      const teamId = TeamId.random()
      const team = buildTeam({ id: teamId })

      await repository.save({ team })

      // Act
      const result = await repository.findById({ id: teamId })

      // Assert
      const found = expectSuccess(result)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(teamId)
      expect(found?.name.value).toBe(team.name.value)
    })

    it('should return null when team not found', async () => {
      // Act
      const result = await repository.findById({ id: TeamId.random() })

      // Assert
      const found = expectSuccess(result)
      expect(found).toBeNull()
    })
  })

  describe('findByName', () => {
    it('should find team by name', async () => {
      // Arrange
      const teamName = faker.string.alpha({
        length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH },
      })
      const teamId = TeamId.random()
      const team = buildTeam({
        id: teamId,
        name: teamName,
      })

      await repository.save({ team })

      // Act
      const result = await repository.findByName({ name: teamName })

      // Assert
      const found = expectSuccess(result)
      expect(found).not.toBeNull()
      expect(found?.id).toBe(teamId)
      expect(found?.name.value).toBe(teamName)
    })

    it('should return null when name not found', async () => {
      // Act
      const result = await repository.findByName({
        name: faker.string.alpha({ length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH } }),
      })

      // Assert
      const found = expectSuccess(result)
      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should find all teams', async () => {
      // Arrange
      const team1 = buildTeam()
      const team2 = buildTeam()

      await repository.save({ team: team1 })
      await repository.save({ team: team2 })

      // Act
      const result = await repository.findAll()

      // Assert
      const teams = expectSuccess(result)
      expect(teams).toHaveLength(2)
      expect(teams.map((t) => t.id)).toContain(team1.id)
      expect(teams.map((t) => t.id)).toContain(team2.id)
    })

    it('should return empty array when no teams exist', async () => {
      // Act
      const result = await repository.findAll()

      // Assert
      const teams = expectSuccess(result)
      expect(teams).toHaveLength(0)
    })
  })

  describe('findAllPaginated', () => {
    beforeEach(async () => {
      // Create 5 teams for pagination tests
      for (let i = 1; i <= 5; i++) {
        const team = buildTeam()
        await repository.save({ team })
      }
    })

    it('should return first page of teams', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 1 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(2)
      expect(total).toBe(5)
    })

    it('should return second page of teams', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 2 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(2)
      expect(total).toBe(5)
    })

    it('should return last page with remaining teams', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 3 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(1) // Only 1 team on last page
      expect(total).toBe(5)
    })

    it('should return empty array for page beyond total', async () => {
      // Act
      const result = await repository.findAllPaginated({ limit: 2, page: 10 })

      // Assert
      const { teams, total } = expectSuccess(result)
      expect(teams).toHaveLength(0)
      expect(total).toBe(5)
    })
  })

  describe('delete', () => {
    it('should delete team', async () => {
      // Arrange
      const teamId = TeamId.random()
      const team = buildTeam({ id: teamId })

      await repository.save({ team })

      // Act
      const result = await repository.delete({ id: teamId })

      // Assert
      expectSuccess(result)

      // Verify team no longer exists
      const found = expectSuccess(await repository.findById({ id: teamId }))
      expect(found).toBeNull()
    })

    it('should not error when deleting non-existent team', async () => {
      // Act
      const result = await repository.delete({ id: TeamId.random() })

      // Assert
      expectSuccess(result)
    })
  })

  describe('existsByName', () => {
    it('should return true when team exists', async () => {
      // Arrange
      const teamName = faker.string.alpha({
        length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH },
      })
      const team = buildTeam({ name: teamName })

      await repository.save({ team })

      // Act
      const result = await repository.existsByName({ name: teamName })

      // Assert
      const exists = expectSuccess(result)
      expect(exists).toBe(true)
    })

    it('should return false when team does not exist', async () => {
      // Act
      const result = await repository.existsByName({
        name: faker.string.alpha({ length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH } }),
      })

      // Assert
      const exists = expectSuccess(result)
      expect(exists).toBe(false)
    })
  })
})
