import type { User } from '../entities'
import { AuthorizationError } from '../errors'
import type { Result } from '../types/Result'
import { Err, Ok } from '../types/Result'
import { Role, type UserRole } from '../value-objects'

/**
 * Permission Service
 * Domain service for authorization and permission checking
 */

/**
 * Check if user can create a team
 */
export function canCreateTeam(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('create team'))
  }

  // All authenticated users can create teams
  return Ok(true)
}

/**
 * Check if user can update a team
 */
export function canUpdateTeam(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('update team'))
  }

  // Only ADMIN and SUPER_ADMIN can update teams
  if (!user.isAdmin()) {
    return Err(
      AuthorizationError.insufficientPermissions('update team', 'ADMIN', user.getRole().getValue()),
    )
  }

  return Ok(true)
}

/**
 * Check if user can delete a team
 */
export function canDeleteTeam(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('delete team'))
  }

  // Only ADMIN and SUPER_ADMIN can delete teams
  if (!user.isAdmin()) {
    return Err(
      AuthorizationError.insufficientPermissions('delete team', 'ADMIN', user.getRole().getValue()),
    )
  }

  return Ok(true)
}

/**
 * Check if user can view teams
 */
export function canViewTeams(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('view teams'))
  }

  // All authenticated users can view teams
  return Ok(true)
}

/**
 * Check if user can create a user
 */
export function canCreateUser(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('create user'))
  }

  // Only ADMIN and SUPER_ADMIN can create users
  if (!user.isAdmin()) {
    return Err(
      AuthorizationError.insufficientPermissions('create user', 'ADMIN', user.getRole().getValue()),
    )
  }

  return Ok(true)
}

/**
 * Check if user can list users
 */
export function canListUsers(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('list users'))
  }

  // Only ADMIN and SUPER_ADMIN can list users
  if (!user.isAdmin()) {
    return Err(
      AuthorizationError.insufficientPermissions('list users', 'ADMIN', user.getRole().getValue()),
    )
  }

  return Ok(true)
}

/**
 * Check if user can access admin dashboard
 */
export function canAccessAdminDashboard(user: User | null): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated('access admin dashboard'))
  }

  // Only ADMIN and SUPER_ADMIN can access admin dashboard
  if (!user.isAdmin()) {
    return Err(
      AuthorizationError.insufficientPermissions(
        'access admin dashboard',
        'ADMIN',
        user.getRole().getValue(),
      ),
    )
  }

  return Ok(true)
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(
  user: User | null,
  requiredRole: UserRole,
): Result<true, AuthorizationError> {
  if (!user) {
    return Err(AuthorizationError.unauthenticated())
  }

  const [error, required] = Role.create(requiredRole)
  if (error) {
    return Err(
      new AuthorizationError('Invalid role requirement', {
        requiredRole,
      }),
    )
  }

  if (!user.hasRoleLevel(required)) {
    return Err(
      AuthorizationError.insufficientPermissions(
        'perform this action',
        requiredRole,
        user.getRole().getValue(),
      ),
    )
  }

  return Ok(true)
}

/**
 * Filter actions based on user permissions
 * Returns list of allowed actions
 */
export function getAllowedActions(user: User | null): string[] {
  const actions: string[] = []

  if (!user) {
    return actions
  }

  // Actions available to all authenticated users
  actions.push('view_teams', 'create_team', 'view_profile')

  // Actions for ADMIN and SUPER_ADMIN
  if (user.isAdmin()) {
    actions.push('update_team', 'delete_team', 'create_user', 'list_users', 'admin_dashboard')
  }

  // Actions only for SUPER_ADMIN
  if (user.isSuperAdmin()) {
    actions.push('manage_roles', 'system_settings', 'delete_user')
  }

  return actions
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  user: User | null,
  action: string,
): Result<true, AuthorizationError> {
  const allowedActions = getAllowedActions(user)

  if (!allowedActions.includes(action)) {
    return Err(
      new AuthorizationError(`Not authorized to perform action: ${action}`, {
        action,
        currentRole: user?.getRole().getValue(),
      }),
    )
  }

  return Ok(true)
}
