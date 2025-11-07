import type { CreateTeamDTO } from '@team-pulse/shared'
import { expectMockCallArg } from '@team-pulse/shared/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RepositoryError, ValidationError } from '../../domain/errors/index.js'
import { Team } from '../../domain/models/Team.js'
import type { ITeamRepository } from '../../domain/repositories/ITeamRepository.js'
import { Err, isError, isOk, Ok } from '../../domain/types/index.js'
import { CreateTeamUseCase } from './CreateTeamUseCase.js'

// Mock external dependencies
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid'),
}))

describe('CreateTeamUseCase', () => {
  let createTeamUseCase: CreateTeamUseCase
  let teamRepository: ITeamRepository

  // Mock team data
  const [, mockTeam] = Team.create({
    city: 'Barcelona',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    foundedYear: 1899,
    id: 'mock-uuid',
    name: 'FC Barcelona',
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  })

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Mock repository
    teamRepository = {
      delete: vi.fn(),
      existsByName: vi.fn(),
      findAll: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
      save: vi.fn(),
    }

    // Create use case instance
    createTeamUseCase = CreateTeamUseCase.create({ teamRepository })
  })

  describe('execute', () => {
    describe('successful team creation', () => {
      it('should return Ok with team data when creation succeeds', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam!))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isOk(result)).toBe(true)
        expect(isError(result)).toBe(false)

        if (isOk(result)) {
          const team = result[1]
          expect(team.id).toBe('mock-uuid')
          expect(team.name).toBe('FC Barcelona')
          expect(team.city).toBe('Barcelona')
          expect(team.foundedYear).toBe(1899)
        }
      })

      it('should check if team name already exists', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam!))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(teamRepository.findByName).toHaveBeenCalledWith('FC Barcelona')
        expect(teamRepository.findByName).toHaveBeenCalledTimes(1)
      })

      it('should save team with generated UUID', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam!))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(teamRepository.save).toHaveBeenCalledTimes(1)
        const savedTeam = expectMockCallArg<Team>(vi.mocked(teamRepository.save))
        expect(savedTeam).toBeInstanceOf(Team)
        expect(savedTeam.id.getValue()).toBe('mock-uuid')
        expect(savedTeam.name.getValue()).toBe('FC Barcelona')
        expect(savedTeam.city.getValue()).toBe('Barcelona')
        expect(savedTeam.foundedYear?.getValue()).toBe(1899)
      })

      it('should return team DTO with ISO date strings', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam!))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isOk(result)).toBe(true)

        if (isOk(result)) {
          const team = result[1]
          expect(typeof team.createdAt).toBe('string')
          expect(typeof team.updatedAt).toBe('string')
          expect(team.createdAt).toBe('2025-01-01T00:00:00.000Z')
          expect(team.updatedAt).toBe('2025-01-01T00:00:00.000Z')
        }
      })

      it('should handle team without foundedYear', async () => {
        // Arrange
        const [, teamWithoutYear] = Team.create({
          city: 'Valencia',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          foundedYear: undefined,
          id: 'mock-uuid',
          name: 'Valencia CF',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        })

        const dto: CreateTeamDTO = {
          city: 'Valencia',
          name: 'Valencia CF',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(teamWithoutYear!))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isOk(result)).toBe(true)

        if (isOk(result)) {
          const team = result[1]
          expect(team.foundedYear).toBeNull()
        }
      })
    })

    describe('error cases', () => {
      it('should return Err when team name already exists', async () => {
        // Arrange
        const [, existingTeam] = Team.create({
          city: 'Barcelona',
          createdAt: new Date(),
          foundedYear: 1899,
          id: 'existing-123',
          name: 'FC Barcelona',
          updatedAt: new Date(),
        })

        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam!))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isError(result)).toBe(true)
        expect(isOk(result)).toBe(false)

        if (isError(result)) {
          const error = result[0]
          expect(error).toBeInstanceOf(ValidationError)
          expect(error.message).toBe('A team with name "FC Barcelona" already exists')
          if (error instanceof ValidationError) {
            expect(error.field).toBe('name')
          }
        }
      })

      it('should not save team when name already exists', async () => {
        // Arrange
        const [, existingTeam] = Team.create({
          city: 'Barcelona',
          createdAt: new Date(),
          foundedYear: 1899,
          id: 'existing-123',
          name: 'FC Barcelona',
          updatedAt: new Date(),
        })

        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(existingTeam!))

        // Act
        await createTeamUseCase.execute(dto)

        // Assert - Should fail before saving
        expect(teamRepository.save).not.toHaveBeenCalled()
      })

      it('should return Err when team data is invalid', async () => {
        // Arrange - Invalid foundedYear (too old)
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1799, // Before 1800
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isError(result)).toBe(true)

        if (isError(result)) {
          const error = result[0]
          expect(error).toBeInstanceOf(ValidationError)
        }
      })

      it('should return Err when repository save fails', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        const repositoryError = RepositoryError.forOperation({
          message: 'Database connection lost',
          operation: 'save',
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isError(result)).toBe(true)

        if (isError(result)) {
          const error = result[0]
          expect(error).toBeInstanceOf(RepositoryError)
          expect(error.message).toBe('Database connection lost')
        }
      })

      it('should return Err when repository findByName fails', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        const repositoryError = RepositoryError.forOperation({
          message: 'Database query timeout',
          operation: 'findByName',
        })

        vi.mocked(teamRepository.findByName).mockResolvedValue(Err(repositoryError))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isError(result)).toBe(true)

        if (isError(result)) {
          const error = result[0]
          expect(error).toBeInstanceOf(RepositoryError)
          expect(error.message).toBe('Database query timeout')
        }
      })
    })

    describe('edge cases', () => {
      it('should generate UUID for new team', async () => {
        // Arrange
        const dto: CreateTeamDTO = {
          city: 'Barcelona',
          foundedYear: 1899,
          name: 'FC Barcelona',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(mockTeam!))

        const { randomUUID } = await import('node:crypto')

        // Act
        await createTeamUseCase.execute(dto)

        // Assert
        expect(randomUUID).toHaveBeenCalled()
        const savedTeam = expectMockCallArg<Team>(vi.mocked(teamRepository.save))
        expect(savedTeam.id.getValue()).toBe('mock-uuid')
      })

      it('should handle null foundedYear from DTO', async () => {
        // Arrange
        const [, teamWithoutYear] = Team.create({
          city: 'Sevilla',
          createdAt: new Date('2025-01-01T00:00:00Z'),
          id: 'mock-uuid',
          name: 'Sevilla FC',
          updatedAt: new Date('2025-01-01T00:00:00Z'),
        })

        const dto: CreateTeamDTO = {
          city: 'Sevilla',
          foundedYear: null,
          name: 'Sevilla FC',
        }

        vi.mocked(teamRepository.findByName).mockResolvedValue(Ok(null))
        vi.mocked(teamRepository.save).mockResolvedValue(Ok(teamWithoutYear!))

        // Act
        const result = await createTeamUseCase.execute(dto)

        // Assert
        expect(isOk(result)).toBe(true)
        const savedTeam = expectMockCallArg<Team>(vi.mocked(teamRepository.save))
        expect(savedTeam.foundedYear).toBeNull()
      })
    })
  })
})
