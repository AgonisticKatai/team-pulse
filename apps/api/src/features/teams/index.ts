/**
 * Teams Feature
 *
 * Team management feature providing:
 * - Team CRUD operations
 * - Team listing and pagination
 * - Team member management
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
