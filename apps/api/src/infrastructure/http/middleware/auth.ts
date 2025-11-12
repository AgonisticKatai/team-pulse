import type { UserRole } from '@team-pulse/shared'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { type AccessTokenPayload, verifyAccessToken } from '../../auth/jwt-utils.js'
import type { Env } from '../../config/env.js'

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
 * - Delegate to infrastructure services (JWT verification)
 */

/**
 * User information attached to request after authentication
 */
export interface AuthenticatedUser {
  userId: string
  email: string
  role: UserRole
}

/**
 * Extend Fastify request to include user information
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser
  }
}

/**
 * Extract and verify JWT token from Authorization header
 *
 * @param request - Fastify request
 * @param env - Environment configuration
 * @returns Decoded token payload
 * @throws Error if token is missing or invalid
 */
function extractAndVerifyToken(request: FastifyRequest, env: Env): AccessTokenPayload {
  // Get Authorization header
  const authHeader = request.headers.authorization

  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  // Check Bearer format
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    throw new Error('Invalid Authorization header format. Expected: Bearer <token>')
  }

  const token = parts[1]

  // Verify token
  return verifyAccessToken(token, env)
}

/**
 * Middleware to require authentication
 *
 * Usage in routes:
 * ```typescript
 * fastify.get('/protected', { preHandler: requireAuth(env) }, async (request, reply) => {
 *   const user = request.user // Available after authentication
 *   // ...
 * })
 * ```
 */
export function requireAuth(env: Env) {
  return (request: FastifyRequest, reply: FastifyReply): void => {
    try {
      const payload = extractAndVerifyToken(request, env)

      // Attach user to request for use in route handlers
      request.user = {
        email: payload.email,
        role: payload.role,
        userId: payload.userId,
      }
    } catch (error) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: error instanceof Error ? error.message : 'Authentication required',
        },
        success: false,
      })
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
 *   preHandler: [requireAuth(env), requireRole(['ADMIN', 'SUPER_ADMIN'])]
 * }, async (request, reply) => {
 *   // Only ADMIN or SUPER_ADMIN can access this
 * })
 * ```
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (request: FastifyRequest, reply: FastifyReply): void => {
    // Ensure user is authenticated (should be done by requireAuth)
    if (!request.user) {
      reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        success: false,
      })
      return
    }

    // Check if user has required role
    if (!allowedRoles.includes(request.user.role)) {
      reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        },
        success: false,
      })
    }
  }
}
