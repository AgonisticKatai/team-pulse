import type { TeamId, TeamName } from '@team-pulse/shared'

export interface TeamCreateInput {
  id: string
  name: string
  createdAt?: Date
  updatedAt?: Date
}

export interface TeamUpdateInput {
  name?: string
}

export interface TeamProps {
  id: TeamId
  name: TeamName
  createdAt: Date
  updatedAt: Date
}

export interface TeamPrimitives {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}
