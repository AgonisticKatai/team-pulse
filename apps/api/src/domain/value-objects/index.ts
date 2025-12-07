// Re-export shared Value Objects

// API-specific Value Objects
export { City } from '@domain/value-objects/City.js'
export { FoundedYear } from '@domain/value-objects/FoundedYear.js'
export { Pagination } from '@domain/value-objects/Pagination.js'
export { TeamName } from '@domain/value-objects/TeamName.js'
export {
  Email,
  EntityId,
  Role,
  UserRoles,
  UserRoles as UserRole,
  type UserRoleType,
} from '@team-pulse/shared/domain/value-objects'
