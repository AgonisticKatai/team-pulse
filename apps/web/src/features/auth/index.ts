/**
 * Auth Feature - Public API
 *
 * This is the ONLY entry point to use the auth feature from outside.
 * Only exports elements designed to be used outside the feature.
 *
 * RULES:
 * - React Hooks → Export (for use in components from other features or pages)
 * - UI Components → Export (for composition in pages)
 * - Use Cases → DO NOT export (internal use only via DI)
 * - Repositories → DO NOT export (internal use only via DI)
 * - Domain interfaces → DO NOT export (implementation details)
 */

// Hooks (for use in components)
export { useLogin } from './application/index.js'

// Components (for composition)
export { LoginForm } from './presentation/index.js'

/**
 * IMPORTANT:
 * - Use cases are injected via DI container, not imported directly
 * - Repositories are created in the DI container, not exposed
 * - Domain interfaces are internal details
 */
