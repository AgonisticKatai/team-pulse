import { type Env, validateEnv, validateProductionEnv } from '@shared/config/environment/env.js'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('validateEnv', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv
  })

  describe('successful validation', () => {
    it('should validate environment with all required variables', () => {
      // Arrange
      process.env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.valid,
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.localhost,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.development,
        PORT: TEST_CONSTANTS.env.ports.default,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result).toBeDefined()
      expect(result.DATABASE_URL).toBe(TEST_CONSTANTS.env.databaseUrls.valid)
      expect(result.JWT_SECRET).toBe(TEST_CONSTANTS.env.jwtSecrets.valid)
      expect(result.JWT_REFRESH_SECRET).toBe(TEST_CONSTANTS.env.jwtRefreshSecrets.valid)
      expect(result.NODE_ENV).toBe(TEST_CONSTANTS.env.nodeEnvs.development)
      expect(result.PORT).toBe(3000) // Should be transformed to number
      expect(result.HOST).toBe(TEST_CONSTANTS.env.hosts.allInterfaces)
      expect(result.LOG_LEVEL).toBe(TEST_CONSTANTS.env.logLevels.info)
      expect(result.FRONTEND_URL).toBe(TEST_CONSTANTS.env.frontendUrls.localhost)
    })

    it('should validate environment with default values', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.DATABASE_URL).toBe(TEST_CONSTANTS.env.databaseUrls.development)
      expect(result.NODE_ENV).toBe(TEST_CONSTANTS.env.nodeEnvs.development)
      expect(result.PORT).toBe(3000)
      expect(result.HOST).toBe(TEST_CONSTANTS.env.hosts.allInterfaces)
      expect(result.LOG_LEVEL).toBe(TEST_CONSTANTS.env.logLevels.info)
    })

    it('should validate environment with empty FRONTEND_URL', () => {
      // Arrange
      process.env = {
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.empty,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.FRONTEND_URL).toBe(TEST_CONSTANTS.env.frontendUrls.empty)
    })

    it('should validate environment with valid FRONTEND_URL', () => {
      // Arrange
      process.env = {
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.https,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.FRONTEND_URL).toBe(TEST_CONSTANTS.env.frontendUrls.https)
    })

    it('should validate environment in test mode', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.test,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.NODE_ENV).toBe(TEST_CONSTANTS.env.nodeEnvs.test)
    })

    it('should validate environment in production mode', () => {
      // Arrange
      process.env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.production,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.production,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.NODE_ENV).toBe(TEST_CONSTANTS.env.nodeEnvs.production)
    })

    it('should transform PORT from string to number', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        PORT: TEST_CONSTANTS.env.ports.random,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.PORT).toBe(8080)
      expect(typeof result.PORT).toBe('number')
    })

    it('should validate all LOG_LEVEL options', () => {
      const logLevels = [
        TEST_CONSTANTS.env.logLevels.fatal,
        TEST_CONSTANTS.env.logLevels.error,
        TEST_CONSTANTS.env.logLevels.warn,
        TEST_CONSTANTS.env.logLevels.info,
        TEST_CONSTANTS.env.logLevels.debug,
        TEST_CONSTANTS.env.logLevels.trace,
      ]

      for (const level of logLevels) {
        // Arrange
        process.env = {
          JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
          JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
          LOG_LEVEL: level,
        }

        // Act
        const result = validateEnv()

        // Assert
        expect(result.LOG_LEVEL).toBe(level)
      }
    })
  })

  describe('validation failures - missing required variables', () => {
    it('should throw error when JWT_SECRET is missing', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })

    it('should throw error when JWT_REFRESH_SECRET is missing', () => {
      // Arrange
      process.env = {
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })

    it('should throw error when both JWT secrets are missing', () => {
      // Arrange
      process.env = {}

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })
  })

  describe('validation failures - invalid values', () => {
    it('should throw error when JWT_SECRET is too short (< 32 characters)', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.tooShort,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })

    it('should throw error when JWT_REFRESH_SECRET is too short (< 32 characters)', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.tooShort,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })

    it('should throw error when NODE_ENV is invalid', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.invalid,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })

    it('should throw error when LOG_LEVEL is invalid', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.invalid,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })

    it('should throw error when FRONTEND_URL is not a valid URL', () => {
      // Arrange
      process.env = {
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.invalid,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
      }

      // Act & Assert
      expect(() => validateEnv()).toThrow('Invalid environment configuration')
    })
  })

  describe('edge cases', () => {
    it('should accept JWT_SECRET with exactly 32 characters', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.exactly32,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.JWT_SECRET).toBe(TEST_CONSTANTS.env.jwtSecrets.exactly32)
      expect(result.JWT_SECRET).toHaveLength(32)
    })

    it('should accept JWT_SECRET with more than 32 characters', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.long,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.JWT_SECRET).toBe(TEST_CONSTANTS.env.jwtSecrets.long)
      expect(result.JWT_SECRET.length).toBeGreaterThan(32)
    })

    it('should handle PORT as string "0"', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        PORT: TEST_CONSTANTS.env.ports.zero,
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.PORT).toBe(0)
    })

    it('should handle undefined FRONTEND_URL (optional)', () => {
      // Arrange
      process.env = {
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        // FRONTEND_URL is not set
      }

      // Act
      const result = validateEnv()

      // Assert
      expect(result.FRONTEND_URL).toBeUndefined()
    })
  })
})

describe('validateProductionEnv', () => {
  describe('production environment', () => {
    it('should throw error when FRONTEND_URL is missing in production', () => {
      // Arrange
      const env: Env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.production,
        FRONTEND_URL: undefined,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.production,
        PORT: 3000,
      }

      // Act & Assert
      expect(() => validateProductionEnv(env)).toThrow('FRONTEND_URL must be defined in production')
    })

    it('should throw error when FRONTEND_URL is empty string in production', () => {
      // Arrange
      const env: Env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.production,
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.empty,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.production,
        PORT: 3000,
      }

      // Act & Assert
      expect(() => validateProductionEnv(env)).toThrow('FRONTEND_URL must be defined in production')
    })

    it('should not throw error when FRONTEND_URL is defined in production', () => {
      // Arrange
      const env: Env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.production,
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.production,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.production,
        PORT: 3000,
      }

      // Act & Assert
      expect(() => validateProductionEnv(env)).not.toThrow()
    })
  })

  describe('non-production environments', () => {
    it('should not throw error when FRONTEND_URL is missing in development', () => {
      // Arrange
      const env: Env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.development,
        FRONTEND_URL: undefined,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.development,
        PORT: 3000,
      }

      // Act & Assert
      expect(() => validateProductionEnv(env)).not.toThrow()
    })

    it('should not throw error when FRONTEND_URL is missing in test', () => {
      // Arrange
      const env: Env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.development,
        FRONTEND_URL: undefined,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.test,
        PORT: 3000,
      }

      // Act & Assert
      expect(() => validateProductionEnv(env)).not.toThrow()
    })

    it('should not throw error when FRONTEND_URL is empty in development', () => {
      // Arrange
      const env: Env = {
        DATABASE_URL: TEST_CONSTANTS.env.databaseUrls.development,
        FRONTEND_URL: TEST_CONSTANTS.env.frontendUrls.empty,
        HOST: TEST_CONSTANTS.env.hosts.allInterfaces,
        JWT_REFRESH_SECRET: TEST_CONSTANTS.env.jwtRefreshSecrets.valid,
        JWT_SECRET: TEST_CONSTANTS.env.jwtSecrets.valid,
        LOG_LEVEL: TEST_CONSTANTS.env.logLevels.info,
        NODE_ENV: TEST_CONSTANTS.env.nodeEnvs.development,
        PORT: 3000,
      }

      // Act & Assert
      expect(() => validateProductionEnv(env)).not.toThrow()
    })
  })
})
