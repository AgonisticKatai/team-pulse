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

  // Environment Variables Test Data
  env: {
    databaseUrls: {
      development: 'postgresql://teampulse:teampulse@localhost:5432/teampulse',
      invalid: 'not-a-database-url',
      production: 'postgresql://prod:pass@db.example.com:5432/prod',
      valid: 'postgresql://user:pass@localhost:5432/db',
    },
    frontendUrls: {
      empty: '',
      https: 'https://example.com',
      invalid: 'not-a-url',
      localhost: 'http://localhost:5173',
      production: 'https://teampulse.com',
    },
    hosts: {
      allInterfaces: '0.0.0.0',
      localhost: '127.0.0.1',
    },
    jwtRefreshSecrets: {
      exactly32: 'b'.repeat(32),
      long: 'b'.repeat(64),
      tooShort: 'tooshort',
      valid: 'b'.repeat(32),
    },
    jwtSecrets: {
      exactly32: 'a'.repeat(32),
      long: 'a'.repeat(64),
      tooShort: 'tooshort',
      valid: 'a'.repeat(32),
    },
    logLevels: {
      debug: 'debug' as const,
      error: 'error' as const,
      fatal: 'fatal' as const,
      info: 'info' as const,
      invalid: 'invalid-level',
      trace: 'trace' as const,
      warn: 'warn' as const,
    },
    nodeEnvs: {
      development: 'development' as const,
      invalid: 'invalid-env',
      production: 'production' as const,
      test: 'test' as const,
    },
    ports: {
      default: '3000',
      http: '80',
      https: '443',
      random: '8080',
      zero: '0',
    },
  },

  // Error Messages
  errors: {
    databaseConnectionLost: 'Database connection lost',
    databaseQueryTimeout: 'Database query timeout',
    failedToDeleteTeam: 'Failed to delete team',
    invalidCredentials: 'Invalid credentials',
    tokenExpired: 'Token has expired',
    tokenNotFound: 'Refresh token not found',
    // Test error messages
    testError: 'Test error',
    testErrorMessage: 'Test error message',
    validationFailed: 'Validation failed',
    fieldRequired: 'Field is required',
    invalidFormat: 'Invalid format',
    authenticationFailed: 'Authentication failed',
    insufficientPermissions: 'Insufficient permissions to perform this action',
    resourceNotFound: 'Resource not found',
    resourceAlreadyExists: 'Resource already exists',
    businessRuleViolation: 'Business rule violated',
    externalServiceFailed: 'External service failed',
    internalServerError: 'Internal server error',
  },

  // Error Test Data
  errorTestData: {
    fields: {
      email: 'email',
      password: 'password',
      username: 'username',
      field: 'field',
    },
    resources: {
      user: 'User',
      team: 'Team',
      token: 'Token',
      resource: 'Resource',
    },
    identifiers: {
      userId: 'user-123',
      teamId: 'team-456',
      tokenId: 'token-789',
      identifier: 'test-identifier',
    },
    reasons: {
      invalidCredentials: 'invalid_credentials',
      invalidToken: 'invalid_token',
      missingToken: 'missing_token',
      duplicate: 'duplicate',
    },
    permissions: {
      read: 'read',
      write: 'write',
      delete: 'delete',
      admin: 'admin',
    },
    rules: {
      maxLength: 'max_length',
      minLength: 'min_length',
      required: 'required',
      businessRule: 'business_rule',
    },
    services: {
      paymentService: 'PaymentService',
      emailService: 'EmailService',
      externalApi: 'ExternalAPI',
    },
    context: {
      operation: 'test operation',
      module: 'test module',
    },
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

  // Email Test Data
  emails: {
    empty: '',
    existing: 'existing@example.com', // For duplicate email tests
    lowercase: 'test@example.com',
    noAt: 'notanemail.com',
    noDomain: 'user@',
    noExtension: 'user@domain',
    noLocal: '@example.com',
    nonexistent: 'nonexistent@example.com', // For user not found tests
    tooLong: `${'a'.repeat(250)}@example.com`,
    uppercase: 'TEST@EXAMPLE.COM',
    valid: 'test@example.com',
    validExactly255: `${'a'.repeat(243)}@example.com`, // 243 + '@' + 'example.com' = 255
    whitespaceOnly: '   ',
    withDot: 'user.name@example.com',
    withNumbers: 'user123@test123.com',
    withPlus: 'user+tag@example.co.uk',
    withSpaces: '  test@example.com  ',
    withSubdomain: 'user@mail.example.com',
    withUnderscore: 'user_name@example-domain.com',
  },

  // EntityId Test Data
  ids: {
    alphanumeric: 'a1b2c3',
    empty: '',
    team123: 'team-123',
    user123: 'user-123',
    user456: 'user-456',
    whitespaceOnly: '   ',
    withAt: 'user@123', // invalid
    withDots: 'user.123', // invalid
    withSpaces: 'user 123', // invalid
    withUnderscore: 'user_123',
    withUpperCase: 'User-123',
  },

  // Password Test Data
  passwords: {
    different: 'DifferentPassword456!',
    empty: '',
    initial: 'InitialPassword123!',
    long: 'a'.repeat(1000),
    lowercase: 'testpassword123!',
    short: 'ab',
    special: 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?',
    test: 'TestPassword123!',
    unicode: 'パスワード123',
    updated: 'UpdatedPassword456!',
    withNullBytes: 'test\x00password',
    wrong: 'WrongPassword456!',
  },

  // Refresh Token Test Data
  refreshTokens: {
    initial: 'initial-token',
    test: 'test-refresh-token-123',
    unique: 'unique-token-123',
    updated: 'updated-token',
    user1Token: 'user1-token',
    user2Token: 'user2-token',
  },

  // Test Emails (for integration tests)
  testEmails: {
    first: 'first@example.com',
    initial: 'initial@test.com',
    second: 'second@example.com',
    third: 'third@example.com',
    updated: 'updated@test.com',
    user1: 'user1@test.com',
    user2: 'user2@test.com',
  },

  // Test User IDs
  testUserIds: {
    testUser1: 'test-user-1',
    testUser2: 'test-user-2',
  },

  // TeamName Test Data
  teamNames: {
    arsenal: 'Arsenal',
    bayernMunchen: 'Bayern München',
    empty: '',
    exactly100Chars: 'a'.repeat(100),
    exceeds100Chars: 'a'.repeat(101),
    juventus: 'Juventus',
    manchesterUnited: 'Manchester United',
    parisSaintGermain: 'Paris Saint-Germain',
    singleChar: 'A',
    tottenham: 'Tottenham',
    veryLong: 'a'.repeat(200),
    whitespaceOnly: '   ',
    withLeadingTrailingSpaces: '  Chelsea FC  ',
    withNumbers: 'Team 123',
  },

  // City Test Data
  cities: {
    barcelona: 'Barcelona',
    bilbao: 'Bilbao',
    empty: '',
    exactly100Chars: 'a'.repeat(100),
    exceeds100Chars: 'a'.repeat(101),
    madrid: 'Madrid',
    newYork: 'New York',
    saoPaulo: 'São Paulo',
    saintEtienne: 'Saint-Étienne',
    singleChar: 'A',
    valencia: 'Valencia',
    veryLong: 'a'.repeat(150),
    whitespaceOnly: '   ',
    withLeadingTrailingSpaces: '  London  ',
  },

  // FoundedYear Test Data
  foundedYears: {
    currentYear: new Date().getFullYear(),
    exactly1800: 1800,
    futureYear: new Date().getFullYear() + 1,
    negative: -100,
    tooOld: 1799,
    year1899: 1899,
    year1900: 1900,
    year1902: 1902,
    year2000: 2000,
    year2020: 2020,
    zero: 0,
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
      id: 'team-fc-barcelona',
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

  // Metrics/Prometheus Test Data
  metrics: {
    prometheus: {
      contentType: 'text/plain; version=0.0.4; charset=utf-8' as const,
      testMetrics: {
        counter: {
          name: 'test_counter',
          help: 'Test counter metric',
        },
        counterForReset: {
          name: 'test_counter_reset',
          help: 'Test counter for reset verification',
        },
        gauge: {
          name: 'test_gauge',
          help: 'Test gauge metric',
        },
        histogram: {
          name: 'test_histogram',
          help: 'Test histogram metric',
          buckets: [0.1, 0.5, 1, 5, 10] as const,
        },
      },
      labels: {
        method: 'GET' as const,
        route: '/api/test' as const,
        statusCode: 200,
        errorType: 'ValidationError' as const,
      },
      values: {
        duration: 0.123,
        count: 42,
        increment: 1,
        decrement: 1,
      },
      http: {
        methods: {
          get: 'GET' as const,
          post: 'POST' as const,
          put: 'PUT' as const,
        },
        routes: {
          users: '/api/users' as const,
          teams: '/api/teams' as const,
          test: '/api/test' as const,
          login: '/api/auth/login' as const,
          teamsById: '/api/teams/123' as const,
          usersById: '/api/users/456' as const,
        },
        statusCodes: {
          ok: 200,
          created: 201,
          badRequest: 400,
          notFound: 404,
          serverError: 500,
        },
        durations: {
          fast: 0.01,
          medium: 0.05,
          slow: 0.1,
          verySlow: 0.15,
        },
        errors: {
          validation: 'ValidationError' as const,
          authentication: 'AuthenticationError' as const,
          notFound: 'NotFoundError' as const,
        },
      },
      db: {
        operations: {
          select: 'SELECT' as const,
          insert: 'INSERT' as const,
          update: 'UPDATE' as const,
          delete: 'DELETE' as const,
        },
        tables: {
          users: 'users' as const,
          teams: 'teams' as const,
          refreshTokens: 'refresh_tokens' as const,
          sessions: 'sessions' as const,
        },
        durations: {
          fast: 0.01,
          medium: 0.02,
          slow: 0.03,
        },
        errors: {
          uniqueConstraint: 'UniqueConstraintViolation' as const,
          connectionTimeout: 'ConnectionTimeout' as const,
          queryTimeout: 'QueryTimeout' as const,
        },
      },
      business: {
        counts: {
          zero: 0,
          small: 25,
          medium: 50,
          large: 100,
          veryLarge: 150,
          huge: 200,
          massive: 250,
        },
      },
    },
  },
} as const
