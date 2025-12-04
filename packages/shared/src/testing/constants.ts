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

  // City Test Data
  cities: {
    barcelona: 'Barcelona',
    bilbao: 'Bilbao',
    empty: '',
    exactly100Chars: 'a'.repeat(100),
    exceeds100Chars: 'a'.repeat(101),
    madrid: 'Madrid',
    newYork: 'New York',
    saintEtienne: 'Saint-Étienne',
    saoPaulo: 'São Paulo',
    singleChar: 'A',
    valencia: 'Valencia',
    veryLong: 'a'.repeat(150),
    whitespaceOnly: '   ',
    withLeadingTrailingSpaces: '  London  ',
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
    authenticationFailed: 'Authentication failed',
    businessRuleViolation: 'Business rule violated',
    databaseConnectionLost: 'Database connection lost',
    databaseQueryTimeout: 'Database query timeout',
    externalServiceFailed: 'External service failed',
    failedToDeleteTeam: 'Failed to delete team',
    fieldRequired: 'Field is required',
    insufficientPermissions: 'Insufficient permissions to perform this action',
    internalServerError: 'Internal server error',
    invalidCredentials: 'Invalid credentials',
    invalidFormat: 'Invalid format',
    resourceAlreadyExists: 'Resource already exists',
    resourceNotFound: 'Resource not found',
    // Test error messages
    testError: 'Test error',
    testErrorMessage: 'Test error message',
    tokenExpired: 'Token has expired',
    tokenNotFound: 'Refresh token not found',
    validationFailed: 'Validation failed',
  },

  // Error Test Data
  errorTestData: {
    context: {
      module: 'test module',
      operation: 'test operation',
    },
    fields: {
      email: 'email',
      field: 'field',
      password: 'password',
      username: 'username',
    },
    handler: {
      httpStatusCodes: {
        badGateway: 502,
        badRequest: 400,
        conflict: 409,
        forbidden: 403,
        internalServerError: 500,
        notFound: 404,
        ok: 200,
        unauthorized: 401,
        unprocessableEntity: 422,
      },
      logContext: {
        action: 'login',
        duration: 245,
        endpoint: '/api/users',
        operation: 'deleteUser',
        requestId: 'abc-123',
        retries: 3,
        userId: 'user-123',
      },
      logMessages: {
        debugLogged: 'Test debug logged',
        errorLogged: 'Test error logged',
        infoLogged: 'Test info logged',
        warningLogged: 'Test warning logged',
      },
      originalError: 'Original error message',
      unexpectedError: 'An unexpected error occurred',
    },
    identifiers: {
      identifier: 'test-identifier',
      teamId: 'team-456',
      tokenId: 'token-789',
      userId: 'user-123',
    },
    permissions: {
      admin: 'admin',
      delete: 'delete',
      read: 'read',
      write: 'write',
    },
    reasons: {
      duplicate: 'duplicate',
      invalidCredentials: 'invalid_credentials',
      invalidToken: 'invalid_token',
      missingToken: 'missing_token',
    },
    resources: {
      resource: 'Resource',
      team: 'Team',
      token: 'Token',
      user: 'User',
    },
    rules: {
      businessRule: 'business_rule',
      maxLength: 'max_length',
      minLength: 'min_length',
      required: 'required',
    },
    services: {
      emailService: 'EmailService',
      externalApi: 'ExternalAPI',
      paymentService: 'PaymentService',
    },
  },

  // Mock IDs
  existingTeamId: 'existing-123',
  existingUserId: 'existing-user-123',

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
  futureDate: new Date('2025-12-31T23:59:59Z'),
  futureDateIso: '2025-12-31T23:59:59.000Z',

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

  // Invalid Data
  invalid: {
    foundedYearTooOld: 1799, // Before 1800
    weakPassword: 'weak',
    wrongPassword: 'WrongPassword123',
  },

  // Metrics/Prometheus Test Data
  metrics: {
    prometheus: {
      business: {
        counts: {
          huge: 200,
          large: 100,
          massive: 250,
          medium: 50,
          small: 25,
          veryLarge: 150,
          zero: 0,
        },
      },
      contentType: 'text/plain; version=0.0.4; charset=utf-8' as const,
      db: {
        durations: {
          fast: 0.01,
          medium: 0.02,
          slow: 0.03,
        },
        errors: {
          connectionTimeout: 'ConnectionTimeout' as const,
          queryTimeout: 'QueryTimeout' as const,
          uniqueConstraint: 'UniqueConstraintViolation' as const,
        },
        operations: {
          delete: 'delete' as const,
          insert: 'insert' as const,
          select: 'select' as const,
          update: 'update' as const,
        },
        tables: {
          refreshTokens: 'refresh_tokens' as const,
          sessions: 'sessions' as const,
          teams: 'teams' as const,
          users: 'users' as const,
        },
      },
      http: {
        durations: {
          fast: 0.01,
          medium: 0.05,
          slow: 0.1,
          verySlow: 0.15,
        },
        errors: {
          client: 'client_error' as const,
          server: 'server_error' as const,
        },
        methods: {
          get: 'GET' as const,
          post: 'POST' as const,
          put: 'PUT' as const,
        },
        routes: {
          login: '/api/auth/login' as const,
          teams: '/api/teams' as const,
          teamsById: '/api/teams/123' as const,
          test: '/api/test' as const,
          users: '/api/users' as const,
          usersById: '/api/users/456' as const,
        },
        statusCodes: {
          badRequest: 400,
          created: 201,
          notFound: 404,
          ok: 200,
          serverError: 500,
        },
      },
      labels: {
        errorType: 'ValidationError' as const,
        method: 'GET' as const,
        route: '/api/test' as const,
        statusCode: 200,
      },
      testMetrics: {
        counter: {
          help: 'Test counter metric',
          name: 'test_counter',
        },
        counterForReset: {
          help: 'Test counter for reset verification',
          name: 'test_counter_reset',
        },
        gauge: {
          help: 'Test gauge metric',
          name: 'test_gauge',
        },
        histogram: {
          buckets: [0.1, 0.5, 1, 5, 10] as const,
          help: 'Test histogram metric',
          name: 'test_histogram',
        },
      },
      values: {
        count: 42,
        decrement: 1,
        duration: 0.123,
        increment: 1,
      },
    },
  },

  // Mock Dates
  mockDate: new Date('2025-01-01T00:00:00Z'),
  mockDateIso: '2025-01-01T00:00:00.000Z',
  mockTokenId: 'mock-token-id',
  mockUuid: 'mock-uuid',

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
  pastDate: new Date('2020-01-01T00:00:00Z'),
  pastDateIso: '2020-01-01T00:00:00.000Z',

  // Refresh Token Test Data
  refreshTokens: {
    initial: 'initial-token',
    test: 'test-refresh-token-123',
    unique: 'unique-token-123',
    updated: 'updated-token',
    user1Token: 'user1-token',
    user2Token: 'user2-token',
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

  // UUID Test Data
  uuids: {
    // Invalid UUIDs
    empty: '',
    incomplete: '123e4567-e89b-12d3-a456',
    invalid: 'invalid-uuid',
    invalidWithSpaces: '123e4567 e89b 12d3 a456 426614174000',
    malformed: 'not-a-uuid-at-all',
    team1: 'a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6',
    team2: 'f9e8d7c6-b5a4-4938-8271-605948372615',
    tooLong: '123e4567-e89b-12d3-a456-426614174000-extra',
    uppercase: '123E4567-E89B-12D3-A456-426614174000',
    user1: '123e4567-e89b-12d3-a456-426614174000',
    user2: '987e6543-e21b-43d2-b654-624416471000',
    // Valid UUIDs for different contexts
    valid: '123e4567-e89b-12d3-a456-426614174000',
    withoutDashes: '123e4567e89b12d3a456426614174000',
  },
} as const
