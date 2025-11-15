/**
 * DTOs Module
 *
 * Centralized export of all Data Transfer Objects with Zod schemas
 */

// Auth DTOs
export {
  type CreateUserDTO,
  CreateUserDTOSchema,
  type LoginDTO,
  LoginDTOSchema,
  type LoginResponseDTO,
  type RefreshTokenDTO,
  RefreshTokenDTOSchema,
  type RefreshTokenResponseDTO,
  type UserResponseDTO,
  type UsersListResponseDTO,
} from './auth.dto.js'

// Pagination DTOs
export {
  type PaginatedResponse,
  type PaginationMetadata,
  type PaginationQuery,
  PaginationQuerySchema,
} from './pagination.dto.js'

// Team DTOs
export {
  type CreateTeamDTO,
  CreateTeamDTOSchema,
  type TeamResponseDTO,
  type TeamsListResponseDTO,
  type UpdateTeamDTO,
  UpdateTeamDTOSchema,
} from './team.dto.js'
