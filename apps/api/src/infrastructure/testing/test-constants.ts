/**
 * Test Constants
 *
 * Centralizes magic values used across tests to improve maintainability
 * and make tests more readable
 */

export const TEST_CONSTANTS = {
  // Auth/JWT Data
  AUTH: {
    EXPIRED_REFRESH_TOKEN: 'expired-refresh-token',
    MOCK_ACCESS_TOKEN: 'mock-access-token',
    MOCK_REFRESH_TOKEN: 'mock-refresh-token',
    NEW_ACCESS_TOKEN: 'new-access-token',
    NEW_REFRESH_TOKEN: 'new-refresh-token',
    VALID_REFRESH_TOKEN: 'valid-refresh-token',
  },
  // Error Messages
  ERRORS: {
    DATABASE_CONNECTION_LOST: 'Database connection lost',
    DATABASE_QUERY_TIMEOUT: 'Database query timeout',
    FAILED_TO_DELETE_TEAM: 'Failed to delete team',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_NOT_FOUND: 'Refresh token not found',
  },

  // Mock IDs
  EXISTING_TEAM_ID: 'existing-123',
  EXISTING_USER_ID: 'existing-user-123',
  FUTURE_DATE: new Date('2025-12-31T23:59:59Z'),
  FUTURE_DATE_ISO: '2025-12-31T23:59:59.000Z',

  // Invalid Data
  INVALID: {
    FOUNDED_YEAR_TOO_OLD: 1799, // Before 1800
    WEAK_PASSWORD: 'weak',
    WRONG_PASSWORD: 'WrongPassword123',
  },

  // Mock Dates
  MOCK_DATE: new Date('2025-01-01T00:00:00Z'),
  MOCK_DATE_ISO: '2025-01-01T00:00:00.000Z',

  // Mock Environment
  MOCK_ENV: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    FRONTEND_URL: 'http://localhost:5173',
    HOST: '0.0.0.0',
    JWT_REFRESH_SECRET: 'test-refresh-secret-at-least-32-chars-long',
    JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long',
    LOG_LEVEL: 'info' as const,
    NODE_ENV: 'test' as const,
    PORT: 3000,
  },
  MOCK_TOKEN_ID: 'mock-token-id',
  MOCK_UUID: 'mock-uuid',
  PAST_DATE: new Date('2020-01-01T00:00:00Z'),
  PAST_DATE_ISO: '2020-01-01T00:00:00.000Z',

  // Team Data
  TEAMS: {
    ATHLETIC_BILBAO: {
      city: 'Bilbao',
      foundedYear: null,
      id: 'team-athletic',
      name: 'Athletic Bilbao',
    },
    FC_BARCELONA: {
      city: 'Barcelona',
      foundedYear: 1899,
      name: 'FC Barcelona',
    },
    REAL_MADRID: {
      city: 'Madrid',
      foundedYear: 1902,
      id: 'team-real-madrid',
      name: 'Real Madrid',
    },
    SEVILLA_FC: {
      city: 'Sevilla',
      foundedYear: null,
      name: 'Sevilla FC',
    },
    VALENCIA_CF: {
      city: 'Valencia',
      foundedYear: undefined,
      name: 'Valencia CF',
    },
  },

  // User Data
  USERS: {
    ADMIN_USER: {
      email: 'admin@example.com',
      id: 'admin-123',
      password: 'AdminPass123',
      passwordHash: 'hashed-admin-password',
      role: 'ADMIN' as const,
    },
    JANE_ADMIN: {
      email: 'jane.admin@example.com',
      id: 'user-2',
      password: 'AdminPass456',
      passwordHash: 'hashed-admin-password-2',
      role: 'ADMIN' as const,
    },
    JOHN_DOE: {
      email: 'john.doe@example.com',
      id: 'user-123',
      password: 'ValidPass123',
      passwordHash: 'hashed-password',
      role: 'USER' as const,
    },
    SUPER_ADMIN_USER: {
      email: 'superadmin@example.com',
      id: 'super-123',
      password: 'SuperPass123',
      passwordHash: 'hashed-superadmin-password',
      role: 'SUPER_ADMIN' as const,
    },
  },
} as const
