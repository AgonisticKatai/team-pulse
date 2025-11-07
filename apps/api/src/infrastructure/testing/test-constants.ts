/**
 * Test Constants
 *
 * Centralizes magic values used across tests to improve maintainability
 * and make tests more readable
 */

export const TEST_CONSTANTS = {
  // Error Messages
  ERRORS: {
    DATABASE_CONNECTION_LOST: 'Database connection lost',
    DATABASE_QUERY_TIMEOUT: 'Database query timeout',
    FAILED_TO_DELETE_TEAM: 'Failed to delete team',
  },
  EXISTING_TEAM_ID: 'existing-123',

  // Invalid Data
  INVALID: {
    FOUNDED_YEAR_TOO_OLD: 1799, // Before 1800
  },

  // Mock Dates
  MOCK_DATE: new Date('2025-01-01T00:00:00Z'),
  MOCK_DATE_ISO: '2025-01-01T00:00:00.000Z',
  // Mock IDs
  MOCK_UUID: 'mock-uuid',

  // Team Data
  TEAMS: {
    FC_BARCELONA: {
      city: 'Barcelona',
      foundedYear: 1899,
      name: 'FC Barcelona',
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
} as const
