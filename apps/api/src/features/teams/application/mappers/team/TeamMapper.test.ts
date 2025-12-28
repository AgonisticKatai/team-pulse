import { buildTeam } from '@shared/testing/builders/team-builders.js'
import type { PaginationMetaDTO } from '@team-pulse/shared'
import { assertDefined, expectFirst } from '@team-pulse/shared/testing'
import { describe, expect, it } from 'vitest'
import { TeamMapper } from './TeamMapper.js'

describe('TeamMapper', () => {
  // ---------------------------------------------------------------------------
  // ✅ TO DTO (Single Item)
  // ---------------------------------------------------------------------------
  describe('toDTO', () => {
    it('should map a domain Team entity to a TeamResponseDTO with correct primitives', () => {
      // Arrange
      const team = buildTeam()

      // Act
      const dto = TeamMapper.toDTO(team)

      // Assert
      expect(dto).toEqual({
        createdAt: team.createdAt.toISOString(),
        id: team.id,
        name: team.name.getValue(),
        updatedAt: team.updatedAt.toISOString(),
      })
    })

    // ---------------------------------------------------------------------------
    // 📋 TO DTO LIST (Array Transformation)
    // ---------------------------------------------------------------------------
    describe('toDTOList', () => {
      it('should map an array of Team entities to DTOs', () => {
        // Arrange
        const team1 = buildTeam()
        const team2 = buildTeam()
        const teams = [team1, team2]

        // Act
        const dtos = TeamMapper.toDTOList(teams)

        // Assert
        expect(dtos).toHaveLength(2)

        const [dto1, dto2] = dtos

        assertDefined(dto1)
        assertDefined(dto2)

        expect(dto1.id).toBe(team1.id)
        expect(dto2.id).toBe(team2.id)
      })
    })

    // ---------------------------------------------------------------------------
    // 📄 TO PAGINATED LIST (Complex Response)
    // ---------------------------------------------------------------------------
    describe('toPaginatedList', () => {
      it('should structure the response with teams and pagination metadata', () => {
        // Arrange
        const team = buildTeam()

        const teams = [team]

        const pagination = {
          hasNext: true,
          hasPrev: false,
          limit: 10,
          page: 1,
          total: 50,
          totalPages: 5,
        } satisfies PaginationMetaDTO

        // Act
        const result = TeamMapper.toPaginatedList(teams, pagination)

        // Assert
        expect(result.meta).toEqual(pagination)

        const firstTeamDTO = expectFirst(result.data)

        expect(firstTeamDTO.id).toBe(team.id)
      })
    })
  })
})
