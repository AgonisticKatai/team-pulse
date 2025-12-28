import type { RefreshTokenId, UserId } from '@team-pulse/shared'

export type RefreshTokenCreateInput = {
  id: string
  token: string
  userId: string
  expiresAt: Date
  createdAt?: Date
}

export type RefreshTokenProps = {
  id: RefreshTokenId
  token: string
  userId: UserId
  expiresAt: Date
  createdAt: Date
}

export type RefreshTokenPrimitives = {
  id: string
  token: string
  userId: string
  expiresAt: Date
  createdAt: Date
}
