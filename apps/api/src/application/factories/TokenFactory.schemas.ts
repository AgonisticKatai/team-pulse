import { RefreshTokenIdSchema, UserIdSchema, UserRoleSchema } from '@team-pulse/shared'
import { z } from 'zod'

/**
 * Zod schema for Access Token Payload
 *
 * Validates JWT payload at the infrastructure boundary.
 *
 * Architecture Decision:
 * - JWT payloads contain data already validated and normalized during token creation
 * - We only need to verify structure and format, NOT re-normalize
 * - This runs on EVERY authenticated request (hot path) - performance matters
 *
 * Validation Strategy:
 * - userId: Transform string → UserId branded type (validates UUID format)
 * - email: Validate email format only (already normalized during token creation)
 * - role: Validate enum membership (ensures valid role value)
 *
 * Contrast with Input Validation:
 * - User input → Full validation + normalization (UserEmailSchema with trim/lowercase)
 * - JWT payload → Structure validation only (trust system-generated data)
 *
 * Performance:
 * - Lightweight validation appropriate for verified, signed tokens
 * - Avoids redundant string operations (trim, toLowerCase) on every request
 */
export const AccessTokenPayloadSchema = z.object({
  aud: z.string().optional(),
  email: z.email(), // Validate email format (Zod v4 standalone API)
  exp: z.number().optional(),

  // JWT standard claims (optional)
  iat: z.number().optional(),
  iss: z.string().optional(),
  role: UserRoleSchema, // Validate enum membership
  // Domain fields with validation and transformation
  userId: UserIdSchema, // string → UserId branded type
})

/**
 * Type inferred from AccessTokenPayloadSchema
 * Single source of truth - type always matches schema validation
 */
export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>

/**
 * Zod schema for Refresh Token Payload
 *
 * Validates JWT refresh token payload at the infrastructure boundary.
 *
 * Transformations:
 * - tokenId: string → RefreshTokenId (validates UUID format)
 * - userId: string → UserId (validates UUID format)
 */
export const RefreshTokenPayloadSchema = z.object({
  aud: z.string().optional(),
  exp: z.number().optional(),

  // JWT standard claims (optional)
  iat: z.number().optional(),
  iss: z.string().optional(),
  // Domain fields with validation and transformation
  tokenId: RefreshTokenIdSchema, // string → RefreshTokenId branded type
  userId: UserIdSchema, // string → UserId branded type
})

/**
 * Type inferred from RefreshTokenPayloadSchema
 * Single source of truth - type always matches schema validation
 */
export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>
