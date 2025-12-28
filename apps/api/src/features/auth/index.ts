/**
 * Auth Feature
 *
 * Authentication feature providing:
 * - Login/Logout
 * - Token refresh
 * - Password hashing
 *
 * Public API (exported):
 * - Domain: Models, interfaces
 * - Application: Use cases, factories
 *
 * Encapsulated (NOT exported):
 * - Infrastructure: HTTP routes, repositories, services
 */

export * from './application/index.js'
export * from './domain/index.js'
// Infrastructure is encapsulated
