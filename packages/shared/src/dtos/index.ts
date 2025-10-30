/**
 * DTOs Module
 *
 * Centralized export of all Data Transfer Objects with Zod schemas
 */

// Auth DTOs
export {
  LoginDTOSchema,
  CreateUserDTOSchema,
  RefreshTokenDTOSchema,
  type LoginDTO,
  type CreateUserDTO,
  type RefreshTokenDTO,
  type UserResponseDTO,
  type LoginResponseDTO,
  type RefreshTokenResponseDTO,
  type UsersListResponseDTO,
} from './auth.dto'

// Team DTOs
export {
  CreateTeamDTOSchema,
  UpdateTeamDTOSchema,
  type CreateTeamDTO,
  type UpdateTeamDTO,
  type TeamResponseDTO,
  type TeamsListResponseDTO,
} from './team.dto'
