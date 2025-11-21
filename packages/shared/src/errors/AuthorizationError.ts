import { ApplicationError } from './core'

/**
 * Authorization Error
 *
 * Used when authenticated user lacks required permissions.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - User role insufficient for action
 * - Resource ownership required
 * - Feature flag disabled
 *
 * HTTP Status: 403 Forbidden
 */

export class AuthorizationError extends ApplicationError {
  static readonly CODE = 'AUTHORIZATION_ERROR' as const
  static readonly CATEGORY = 'authorization' as const

  readonly code = AuthorizationError.CODE
  readonly category = AuthorizationError.CATEGORY

  private constructor({
    message,
    requiredRole,
    userRole,
  }: {
    message: string
    requiredRole?: string | string[]
    userRole?: string
  }) {
    super({
      message,
      severity: 'medium',
      metadata: { requiredRole, userRole },
      isOperational: true,
    })
  }

  /**
   * Generic authorization failure
   */
  static create({ message }: { message: string }): AuthorizationError {
    return new AuthorizationError({ message })
  }

  /**
   * User role insufficient for operation
   */
  static insufficientPermissions({ required, actual }: { required: string[]; actual: string }): AuthorizationError {
    return new AuthorizationError({
      message: `Access denied. Required role: ${required.join(' or ')}`,
      requiredRole: required,
      userRole: actual,
    })
  }

  /**
   * Resource ownership required
   */
  static notResourceOwner({ resourceType }: { resourceType: string }): AuthorizationError {
    return new AuthorizationError({
      message: `You do not have permission to access this ${resourceType}`,
    })
  }
}
