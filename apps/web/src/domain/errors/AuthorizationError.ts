import { DomainError } from './DomainError'

/**
 * Authorization error for RBAC and permission failures
 */
export class AuthorizationError extends DomainError {
  public readonly requiredRole?: string
  public readonly currentRole?: string
  public readonly action?: string

  constructor(
    message: string,
    options?: {
      action?: string
      currentRole?: string
      requiredRole?: string
    },
  ) {
    super(message, { isOperational: true })
    this.requiredRole = options?.requiredRole
    this.currentRole = options?.currentRole
    this.action = options?.action
  }

  /**
   * Factory method for insufficient permissions
   */
  static insufficientPermissions(action: string, requiredRole: string, currentRole: string): AuthorizationError {
    return new AuthorizationError(`Insufficient permissions to ${action}. Required: ${requiredRole}, Current: ${currentRole}`, {
      action,
      currentRole,
      requiredRole,
    })
  }

  /**
   * Factory method for unauthenticated access
   */
  static unauthenticated(action?: string): AuthorizationError {
    const message = action ? `Authentication required to ${action}` : 'Authentication required'
    return new AuthorizationError(message, { action })
  }

  override toObject() {
    return {
      ...super.toObject(),
      action: this.action,
      currentRole: this.currentRole,
      requiredRole: this.requiredRole,
    }
  }
}
