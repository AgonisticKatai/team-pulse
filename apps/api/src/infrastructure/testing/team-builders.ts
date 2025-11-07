import type { CreateTeamDTO } from '@team-pulse/shared'
import { Team } from '../../domain/models/Team.js'
import { TEST_CONSTANTS } from './test-constants.js'

/**
 * Builder for CreateTeamDTO test data
 *
 * Provides sensible defaults and allows easy customization via overrides
 *
 * @example
 * // Use defaults
 * const dto = buildCreateTeamDTO()
 *
 * // Override specific fields
 * const dto = buildCreateTeamDTO({ name: 'Custom Team' })
 */
export function buildCreateTeamDTO(overrides: Partial<CreateTeamDTO> = {}): CreateTeamDTO {
  return {
    city: TEST_CONSTANTS.TEAMS.FC_BARCELONA.city,
    foundedYear: TEST_CONSTANTS.TEAMS.FC_BARCELONA.foundedYear,
    name: TEST_CONSTANTS.TEAMS.FC_BARCELONA.name,
    ...overrides,
  }
}

/**
 * Builder for Team entity test data
 *
 * Creates a valid Team entity with sensible defaults
 * Throws if Team.create returns an error (which should never happen with valid defaults)
 *
 * @example
 * // Use defaults
 * const team = buildTeam()
 *
 * // Override specific fields
 * const team = buildTeam({ name: 'Custom Team' })
 */
export function buildTeam(
  overrides: {
    id?: string
    name?: string
    city?: string
    foundedYear?: number | null
    createdAt?: Date
    updatedAt?: Date
  } = {},
): Team {
  const result = Team.create({
    city: TEST_CONSTANTS.TEAMS.FC_BARCELONA.city,
    createdAt: TEST_CONSTANTS.MOCK_DATE,
    foundedYear: TEST_CONSTANTS.TEAMS.FC_BARCELONA.foundedYear,
    id: TEST_CONSTANTS.MOCK_UUID,
    name: TEST_CONSTANTS.TEAMS.FC_BARCELONA.name,
    updatedAt: TEST_CONSTANTS.MOCK_DATE,
    ...overrides,
  })

  if (!result.ok) {
    throw new Error(`Failed to build Team in test: ${result.error.message}`)
  }

  return result.value
}

/**
 * Builds a Team entity without a founded year
 */
export function buildTeamWithoutFoundedYear(
  overrides: { id?: string; name?: string; city?: string; createdAt?: Date; updatedAt?: Date } = {},
): Team {
  return buildTeam({
    foundedYear: undefined,
    ...overrides,
  })
}

/**
 * Builds an "existing" team (with a different ID to simulate conflicts)
 */
export function buildExistingTeam(
  overrides: {
    id?: string
    name?: string
    city?: string
    foundedYear?: number
    createdAt?: Date
    updatedAt?: Date
  } = {},
): Team {
  return buildTeam({
    id: TEST_CONSTANTS.EXISTING_TEAM_ID,
    ...overrides,
  })
}
