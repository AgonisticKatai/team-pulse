import type { TokenFactory } from '@application/factories/TokenFactory.js'
import { type AuthenticatedUser, AuthService } from '@infrastructure/auth/AuthService.js'
import type { FastifyReply, FastifyRequest } from 'fastify'

/**
 * Authentication middleware for Fastify
 *
 * Provides request hooks for:
 * 1. requireAuth - Ensures user is authenticated
 * 2. requireRole - Ensures user has specific role(s)
 *
 * These are ADAPTERS in Hexagonal Architecture:
 * - Framework-specific (Fastify)
 * - Handle HTTP concerns (headers, status codes)
 * - Delegate to AuthService (infrastructure service)
 * - Use primitives (strings) for roles, not domain Value Objects
 *
 * IMPORTANT: This layer does NOT create domain objects (like UserRole).
 * It works with primitives from the JWT payload.
 *
 * Patterns:
 * - Uses AuthService for authentication logic
 * - Railway-Oriented Programming via Result<T, E>
 * - Named Parameters for all functions
 */

/**
 * Extend Fastify request to include user information
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

/**
 * Middleware to require authentication
 *
 * Usage in routes:
 * ```typescript
 * fastify.get('/protected', { preHandler: requireAuth({ tokenFactory }) }, async (request, reply) => {
 *   const user = request.user // Available after authentication
 *   // user.role is a string from JWT payload
 * })
 * ```
 */
export function requireAuth({ tokenFactory }: { tokenFactory: TokenFactory }) {
  const authService = AuthService.create({ tokenFactory })

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Verify authorization header and extract JWT payload
    const result = authService.verifyAuthHeader({ authHeader: request.headers.authorization })

    if (!result.ok) {
      // Return 401 with validation error message
      await reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: result.error.message,
        },
        success: false,
      })
      return
    }

    // Attach user to request - using primitives from JWT payload
    const payload = result.value

    request.user = {
      email: payload.email,
      role: payload.role, // String from JWT, not UserRole value object
      userId: payload.userId,
    }
  }
}

/**
 * Middleware to require specific role(s)
 *
 * IMPORTANT: Must be used AFTER requireAuth
 *
 * Usage in routes:
 * ```typescript
 * fastify.post('/admin', {
 *   preHandler: [requireAuth({ tokenFactory }), requireRole(['admin', 'super_admin'])]
 * }, async (request, reply) => {
 *   // Only admin or super_admin can access this
 * })
 * ```
 */
export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // AuthService handles the validation logic
    const authService = AuthService.create({ tokenFactory: {} as TokenFactory }) // We only need checkUserRole, not token verification

    const hasRole = authService.checkUserRole({ allowedRoles, user: request.user })

    if (!hasRole) {
      await reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        },
        success: false,
      })
    }
  }
}

// Re-export AuthenticatedUser for convenience
export type { AuthenticatedUser }
