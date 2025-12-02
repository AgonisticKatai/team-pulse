import { EmailSchema, LoginFormSchema, PasswordStrictSchema } from '@team-pulse/shared/validation'
import { z } from 'zod'
import type { UserRole } from '../types/index.js'
import type { PaginatedResponse } from './pagination.dto.js'

/**
 * Authentication Data Transfer Objects (DTOs)
 *
 * DTOs serve as the CONTRACT between layers:
 * - API Layer → Application Layer: Request DTOs
 * - Application Layer → API Layer: Response DTOs
 *
 * Why separate from Domain Models?
 * 1. API contracts can change without affecting domain
 * 2. Domain models may contain logic not suitable for serialization
 * 3. One domain model might map to multiple DTOs (different views)
 * 4. Input validation happens here, domain validation is separate
 *
 * These DTOs use Zod schemas from @team-pulse/shared/validation
 * for consistency between frontend and backend validation.
 */

/**
 * Schema for login request
 * Uses shared LoginFormSchema to ensure FE/BE consistency
 */
export const LoginDTOSchema = LoginFormSchema

export type LoginDTO = z.infer<typeof LoginDTOSchema>

/**
 * Schema for creating a new user
 * Uses shared EmailSchema and PasswordStrictSchema
 */
export const CreateUserDTOSchema = z.object({
  email: EmailSchema,
  password: PasswordStrictSchema,
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER']),
})

export type CreateUserDTO = z.infer<typeof CreateUserDTOSchema>

/**
 * Schema for refresh token request
 */
export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>

/**
 * User response DTO
 *
 * IMPORTANT: Does NOT include password hash
 */
export interface UserResponseDTO {
  id: string
  email: string
  role: UserRole
  createdAt: string // ISO string for JSON serialization
  updatedAt: string // ISO string for JSON serialization
}

/**
 * Login response DTO
 */
export interface LoginResponseDTO {
  accessToken: string
  refreshToken: string
  user: UserResponseDTO
}

/**
 * Refresh token response DTO
 *
 * IMPORTANT: Includes new refreshToken for token rotation
 * Token rotation improves security by issuing a new refresh token
 * and invalidating the old one with each refresh request
 */
export interface RefreshTokenResponseDTO {
  accessToken: string
  refreshToken: string
}

/**
 * List of users response
 * Uses the generic PaginatedResponse type with 'users' as the key
 */
export type UsersListResponseDTO = PaginatedResponse<UserResponseDTO, 'users'>
