/**
 * Test Constants
 *
 * Centralizes magic values used across tests to improve maintainability
 * and make tests more readable
 */

export const TEST_CONSTANTS = {
  // Auth/JWT Data
  auth: {
    expiredRefreshToken: 'expired-refresh-token',
    mockAccessToken: 'mock-access-token',
    mockRefreshToken: 'mock-refresh-token',
    newAccessToken: 'new-access-token',
    newRefreshToken: 'new-refresh-token',
    validRefreshToken: 'valid-refresh-token',
  },
  // Error Messages
  errors: {
    databaseConnectionLost: 'Database connection lost',
    databaseQueryTimeout: 'Database query timeout',
    failedToDeleteTeam: 'Failed to delete team',
    invalidCredentials: 'Invalid credentials',
    tokenExpired: 'Token has expired',
    tokenNotFound: 'Refresh token not found',
  },

  // Mock IDs
  existingTeamId: 'existing-123',
  existingUserId: 'existing-user-123',
  futureDate: new Date('2025-12-31T23:59:59Z'),
  futureDateIso: '2025-12-31T23:59:59.000Z',

  // Invalid Data
  invalid: {
    foundedYearTooOld: 1799, // Before 1800
    weakPassword: 'weak',
    wrongPassword: 'WrongPassword123',
  },

  // Mock Dates
  mockDate: new Date('2025-01-01T00:00:00Z'),
  mockDateIso: '2025-01-01T00:00:00.000Z',
  mockTokenId: 'mock-token-id',
  mockUuid: 'mock-uuid',
  pastDate: new Date('2020-01-01T00:00:00Z'),
  pastDateIso: '2020-01-01T00:00:00.000Z',

  // Team Data
  teams: {
    athleticBilbao: {
      city: 'Bilbao',
      foundedYear: null,
      id: 'team-athletic',
      name: 'Athletic Bilbao',
    },
    fcBarcelona: {
      city: 'Barcelona',
      foundedYear: 1899,
      name: 'FC Barcelona',
    },
    realMadrid: {
      city: 'Madrid',
      foundedYear: 1902,
      id: 'team-real-madrid',
      name: 'Real Madrid',
    },
    sevillaFc: {
      city: 'Sevilla',
      foundedYear: null,
      name: 'Sevilla FC',
    },
    valenciaCf: {
      city: 'Valencia',
      foundedYear: undefined,
      name: 'Valencia CF',
    },
  },

  // User Data
  users: {
    adminUser: {
      email: 'admin@example.com',
      id: 'admin-123',
      password: 'AdminPass123',
      passwordHash: 'hashed-admin-password',
      role: 'ADMIN' as const,
    },
    janeAdmin: {
      email: 'jane.admin@example.com',
      id: 'user-2',
      password: 'AdminPass456',
      passwordHash: 'hashed-admin-password-2',
      role: 'ADMIN' as const,
    },
    johnDoe: {
      email: 'john.doe@example.com',
      id: 'user-123',
      password: 'ValidPass123',
      passwordHash: 'hashed-password',
      role: 'USER' as const,
    },
    superAdminUser: {
      email: 'superadmin@example.com',
      id: 'super-123',
      password: 'SuperPass123',
      passwordHash: 'hashed-superadmin-password',
      role: 'SUPER_ADMIN' as const,
    },
  },
} as const
