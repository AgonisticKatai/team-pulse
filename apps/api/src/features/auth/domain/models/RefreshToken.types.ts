import type { RefreshTokenId, UserId } from '@team-pulse/shared'

export interface RefreshTokenCreateInput {
  id: string
  token: string
  userId: string
  expiresAt: Date
  createdAt?: Date
}

export interface RefreshTokenProps {
  id: RefreshTokenId
  token: string
  userId: UserId
  expiresAt: Date
  createdAt: Date
}

export interface RefreshTokenPrimitives {
  id: string
  token: string
  userId: string
  expiresAt: Date
  createdAt: Date
}
