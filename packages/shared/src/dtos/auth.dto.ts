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
 * These DTOs use Zod for runtime validation.
 */

/**
 * Schema for login request
 */
export const LoginDTOSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginDTO = z.infer<typeof LoginDTOSchema>

/**
 * Schema for creating a new user
 */
export const CreateUserDTOSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
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
 */
export interface RefreshTokenResponseDTO {
  accessToken: string
}

/**
 * List of users response
 * Uses the generic PaginatedResponse type with 'users' as the key
 */
export type UsersListResponseDTO = PaginatedResponse<UserResponseDTO, 'users'>
