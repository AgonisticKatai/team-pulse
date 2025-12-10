import { Team } from '@domain/models/team/Team.js'
import { faker } from '@faker-js/faker'
import type { CreateTeamDTO } from '@team-pulse/shared'
import { IdUtils, type TeamId } from '@team-pulse/shared'

// 1. SIMPLE DEFINITION: Only primitive types
type TeamPrimitives = {
  id: string
  name: string
  city: string
  foundedYear: number | null
  createdAt: Date
  updatedAt: Date
}

// 2. DATA GENERATOR: Returns plain object with defaults
const generateRandomTeamData = (): TeamPrimitives => ({
  city: faker.location.city(),
  createdAt: new Date(),
  foundedYear: faker.number.int({ max: new Date().getFullYear(), min: 1800 }),
  id: IdUtils.generate<TeamId>(),
  name: faker.company.name(),
  updatedAt: new Date(),
})

// 3. BUILDER FUNCTION
export function buildTeam(overrides: Partial<TeamPrimitives> = {}): Team {
  // A. Fusion of data (override wins always)
  const raw = {
    ...generateRandomTeamData(),
    ...overrides,
  }

  // B. DOMAIN CREATION
  const result = Team.create({
    city: raw.city,
    createdAt: raw.createdAt,
    foundedYear: raw.foundedYear,
    id: IdUtils.toId<TeamId>(raw.id),
    name: raw.name,
    updatedAt: raw.updatedAt,
  })

  if (!result.ok) {
    throw new Error(`Failed to build Team in test: ${result.error.message}`)
  }

  return result.value
}

/**
 * Builder for CreateTeamDTO test data
 * Provides sensible defaults and allows easy customization via overrides
 */
export function buildCreateTeamDTO(overrides: Partial<CreateTeamDTO> = {}): CreateTeamDTO {
  const defaults = generateRandomTeamData()
  return {
    city: defaults.city,
    foundedYear: defaults.foundedYear,
    name: defaults.name,
    ...overrides,
  }
}

/**
 * Builds a Team entity without a founded year
 */
export function buildTeamWithoutFoundedYear(overrides: Partial<TeamPrimitives> = {}): Team {
  return buildTeam({
    foundedYear: null,
    ...overrides,
  })
}

/**
 * Builds an "existing" team
 * Wrapper for compatibility/clarity
 */
export function buildExistingTeam(overrides: Partial<TeamPrimitives> = {}): Team {
  return buildTeam(overrides)
}
