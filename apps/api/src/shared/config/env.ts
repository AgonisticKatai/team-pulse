import { z } from 'zod'

/**
 * Environment variables validation schema
 *
 * This ensures all required environment variables are present and valid
 * at application startup. If validation fails, the app will not start.
 *
 * This is a CRITICAL best practice:
 * - Fail-fast if configuration is missing
 * - Type-safe access to env vars throughout the app
 * - Single source of truth for configuration
 */
const envSchema = z.object({
  // Database - PostgreSQL connection string
  DATABASE_URL: z.string().default('postgresql://teampulse:teampulse@localhost:5432/teampulse'),

  // CORS
  FRONTEND_URL: z.string().url().optional().or(z.literal('')),
  HOST: z.string().default('0.0.0.0'),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Authentication - JWT secrets
  JWT_SECRET: z.string().min(32),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  // Server configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
})

/**
 * Validate and parse environment variables
 *
 * Call this at application startup (before building the app)
 * to ensure all configuration is valid.
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    throw new Error('Invalid environment configuration')
  }

  return result.data
}

/**
 * Validated environment configuration
 *
 * Use this throughout the app instead of process.env
 * for type-safe access to environment variables.
 */
export type Env = z.infer<typeof envSchema>

/**
 * Production-specific validation
 *
 * In production, certain variables MUST be defined
 */
export function validateProductionEnv(env: Env) {
  if (env.NODE_ENV === 'production') {
    if (!env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL must be defined in production')
    }

    // Add more production-specific validations here
    // Example: ensure DATABASE_URL uses production database
  }
}
