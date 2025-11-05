import type { Token } from '../value-objects'
import type { User } from './User'

/**
 * Base Session properties with Token value objects
 * This is the single source of truth for Session shape
 */
export interface SessionProps {
  user: User
  accessToken: Token
  refreshToken: Token
  createdAt: Date
}

/**
 * Session constructor properties
 * Same as SessionProps - constructor receives validated Token value objects
 */
export type SessionConstructorProps = SessionProps

/**
 * Session creation data - uses raw string tokens for validation
 * Replaces Token value objects with strings that will be validated
 */
export type CreateSessionData = Omit<SessionProps, 'accessToken' | 'refreshToken'> & {
  accessToken: string
  refreshToken: string
}

/**
 * Session validation data
 * Same as CreateSessionData - validates before creating Tokens
 */
export type ValidateSessionData = CreateSessionData

/**
 * Session properties for fromValueObjects
 * Omits createdAt (will be set to new Date() internally)
 */
export type SessionValueObjectsProps = Omit<SessionProps, 'createdAt'>

/**
 * Update access token data
 */
export interface UpdateAccessTokenData {
  newAccessToken: string
}

/**
 * Update both tokens data
 */
export interface UpdateTokensData extends UpdateAccessTokenData {
  newRefreshToken: string
}

/**
 * Session serialized data - matches create() signature for symmetry
 * Same as CreateSessionData to preserve serialization/deserialization symmetry
 */
export type SessionData = CreateSessionData
