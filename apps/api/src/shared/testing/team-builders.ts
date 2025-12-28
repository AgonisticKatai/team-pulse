import { faker } from '@faker-js/faker'
import { Team } from '@features/teams/domain/models/team/Team.js'
import type { TeamPrimitives } from '@features/teams/domain/models/team/Team.types.js'
import type { CreateTeamDTO } from '@team-pulse/shared'
import { TEAM_NAME_RULES, TeamId } from '@team-pulse/shared'

const generateRandomTeamData = (): TeamPrimitives => ({
  createdAt: new Date(),
  id: TeamId.random(),
  name: faker.string.alpha({ length: { max: TEAM_NAME_RULES.MAX_LENGTH, min: TEAM_NAME_RULES.MIN_LENGTH } }),
  updatedAt: new Date(),
})

export function buildTeam(overrides: Partial<TeamPrimitives> = {}): Team {
  const raw = { ...generateRandomTeamData(), ...overrides }

  const result = Team.create({
    createdAt: raw.createdAt,
    id: raw.id,
    name: raw.name,
    updatedAt: raw.updatedAt,
  })

  if (!result.ok) {
    throw new Error(`Failed to build Team in test: ${result.error.message}`)
  }

  return result.value
}

export function buildCreateTeamDTO(overrides: Partial<CreateTeamDTO> = {}): CreateTeamDTO {
  const defaults = generateRandomTeamData()
  return { name: defaults.name, ...overrides }
}
