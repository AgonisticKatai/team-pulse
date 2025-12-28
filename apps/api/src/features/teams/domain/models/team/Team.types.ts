import type { TeamId, TeamName } from '@team-pulse/shared'

export type TeamCreateInput = {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export type TeamUpdateInput = {
  name?: string
}

export type TeamProps = {
  id: TeamId
  name: TeamName
  createdAt: Date
  updatedAt: Date
}

export type TeamPrimitives = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}
