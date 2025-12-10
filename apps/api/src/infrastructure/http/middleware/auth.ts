import type { TokenFactory } from '@application/factories/TokenFactory.js'
import { type AuthenticatedUser, AuthService } from '@infrastructure/auth/AuthService.js'
import type { UserRole } from '@team-pulse/shared'
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
 *   // ...
 * })
 * ```
 */
export function requireAuth({ tokenFactory }: { tokenFactory: TokenFactory }) {
  const authService = AuthService.create({ tokenFactory })

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Verify authorization header
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

    // Attach user to request for use in route handlers
    const payload = result.value
    request.user = {
      email: payload.email,
      role: payload.role,
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
 *   preHandler: [requireAuth({ tokenFactory }), requireRole(['ADMIN', 'SUPER_ADMIN'])]
 * }, async (request, reply) => {
 *   // Only ADMIN or SUPER_ADMIN can access this
 * })
 * ```
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Ensure user is authenticated (should be done by requireAuth)
    if (!request.user) {
      await reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        success: false,
      })
      return
    }

    // Check if user has required role
    const hasRole = allowedRoles.includes(request.user.role)
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
