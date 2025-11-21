import type { IEnvironment } from '@domain/config/IEnvironment.js'
import type { Env } from '@infrastructure/config/env.js'

/**
 * Mock environment configuration for tests
 * Uses SCREAMING_SNAKE_CASE to match system environment variables
 */
export const TEST_ENV: Env = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  FRONTEND_URL: 'http://localhost:5173',
  HOST: '0.0.0.0',
  JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars-long',
  JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long',
  LOG_LEVEL: 'info',
  NODE_ENV: 'test',
  PORT: 3000,
}

/**
 * Mock environment for Application layer tests (TokenFactory, etc.)
 *
 * This mock explicitly exposes only JWT secrets, making it clear that
 * Application layer components don't need infrastructure details like
 * DATABASE_URL, PORT, etc.
 *
 * Benefits:
 * - Self-documenting: Shows exactly what Application layer needs
 * - Verifies architecture: Application only depends on Domain (IEnvironment)
 * - Reusable: Any Application component needing JWT config can use this
 */
export const TEST_TOKEN_ENV: IEnvironment = {
  JWT_SECRET: TEST_ENV.JWT_SECRET,
  JWT_REFRESH_SECRET: TEST_ENV.JWT_REFRESH_SECRET,
}
