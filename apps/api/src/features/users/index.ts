/**
 * Users Feature
 *
 * User management feature providing:
 * - User CRUD operations
 * - User listing and pagination
 * - User role management
 *
 * Public API (exported):
 * - Domain: Models, interfaces
 * - Application: Use cases, mappers
 *
 * Encapsulated (NOT exported):
 * - Infrastructure: HTTP routes, repositories
 */

export * from './application/index.js'
export * from './domain/index.js'
// Infrastructure is encapsulated
