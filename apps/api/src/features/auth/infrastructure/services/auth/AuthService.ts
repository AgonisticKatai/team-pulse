import type { TokenFactory } from '@features/auth/application/factories/token/TokenFactory.js'
import type { AccessTokenPayload } from '@features/auth/application/factories/token/TokenFactory.schema.js'
import type { AuthenticationError } from '@team-pulse/shared'
import { Err, Ok, type Result, ValidationError } from '@team-pulse/shared'

/**
 * User information extracted from authenticated request
 *
 * IMPORTANT: This is an infrastructure-layer DTO, not a domain entity.
 * It uses primitives (string) for the role, not the UserRole value object.
 *
 * UserRole value objects are only created in:
 * - Repositories (when mapping from DB to domain entities)
 * - Use Cases (when creating/updating User entities)
 *
 * This keeps the infrastructure layer (HTTP, JWT) independent of domain models.
 */
export type AuthenticatedUser = {
  userId: string
  email: string
  role: string // Primitive from JWT payload, not UserRole value object
}

/**
 * Authentication Service
 *
 * Infrastructure layer service that handles JWT authentication logic.
 *
 * Architecture:
 * - Infrastructure Layer (this service)
 * - Uses Application Layer (TokenFactory for JWT operations)
 * - Returns Domain Layer errors (ValidationError)
 *
 * Patterns:
 * - Factory Pattern: Private constructor + static create method
 * - Railway-Oriented Programming: Returns Result<T, E>
 * - Named Parameters: All methods use named parameters
 * - Dependency Injection: TokenFactory injected via constructor
 */
export class AuthService {
  private readonly tokenFactory: TokenFactory

  private constructor({ tokenFactory }: { tokenFactory: TokenFactory }) {
    this.tokenFactory = tokenFactory
  }

  /**
   * Factory method to create AuthService instance
   *
   * @param tokenFactory - Token factory for JWT operations
   * @returns AuthService instance
   */
  static create({ tokenFactory }: { tokenFactory: TokenFactory }): AuthService {
    return new AuthService({ tokenFactory })
  }

  /**
   * Verify Authorization header and extract JWT payload
   *
   * Validates:
   * 1. Authorization header is present
   * 2. Authorization header has correct format (Bearer <token>)
   * 3. JWT token is valid and not expired
   *
   * @param authHeader - Authorization header value
   * @returns Result with JWT payload or ValidationError (header format) or AuthenticationError (JWT validation)
   */
  verifyAuthHeader({
    authHeader,
  }: {
    authHeader: string | undefined
  }): Result<AccessTokenPayload, AuthenticationError | ValidationError> {
    // Validate header exists
    if (!authHeader || authHeader.trim() === '') {
      return Err(
        ValidationError.forField({
          field: 'authorization',
          message: 'Missing Authorization header',
        }),
      )
    }

    // Validate Bearer format
    const parts = authHeader.split(' ')

    // Must be exactly 2 parts: "Bearer" and token
    if (parts.length !== 2) {
      return Err(
        ValidationError.forField({
          field: 'authorization',
          message: 'Invalid Authorization header format. Expected: Bearer <token>',
        }),
      )
    }

    const [scheme, token] = parts

    // Validate scheme is "Bearer"
    if (scheme !== 'Bearer') {
      return Err(
        ValidationError.forField({
          field: 'authorization',
          message: 'Invalid Authorization header format. Expected: Bearer <token>',
        }),
      )
    }

    // Validate token is not empty
    if (!token || token.trim() === '') {
      return Err(
        ValidationError.forField({
          field: 'authorization',
          message: 'Invalid Authorization header format. Expected: Bearer <token>',
        }),
      )
    }

    // Verify JWT token
    const verifyResult = this.tokenFactory.verifyAccessToken({ token })

    if (!verifyResult.ok) {
      // Return the validation error from TokenFactory
      return Err(verifyResult.error)
    }

    return Ok(verifyResult.value)
  }

  /**
   * Check if user has one of the allowed roles
   *
   * @param user - Authenticated user (can be undefined if not authenticated)
   * @param allowedRoles - Array of allowed role strings (e.g., ['admin', 'super_admin'])
   * @returns true if user has required role, false otherwise
   */
  checkUserRole({ user, allowedRoles }: { user: AuthenticatedUser | undefined; allowedRoles: string[] }): boolean {
    if (!user) {
      return false
    }

    return allowedRoles.includes(user.role)
  }
}
