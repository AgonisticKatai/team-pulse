import type { Env } from '../config/env.js'

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
