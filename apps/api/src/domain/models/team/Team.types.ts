import type { TeamCity, TeamFoundedYear, TeamId, TeamName } from '@team-pulse/shared'

export interface TeamCreateInput {
  id: string
  name: string
  city: string
  foundedYear?: number | null
  createdAt?: Date
  updatedAt?: Date
}

export interface TeamUpdateInput {
  name?: string
  city?: string
  foundedYear?: number | null
}

export interface TeamProps {
  id: TeamId
  name: TeamName
  city: TeamCity
  foundedYear: TeamFoundedYear
  createdAt: Date
  updatedAt: Date
}

export interface TeamPrimitives {
  id: string
  name: string
  city: string
  foundedYear: number | null
  createdAt: Date
  updatedAt: Date
}
