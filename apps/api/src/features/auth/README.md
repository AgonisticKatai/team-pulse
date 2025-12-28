# Auth Feature

## Overview

Authentication and authorization feature for the TeamPulse API. Handles user login, token management, and session control using JWT-based authentication with refresh tokens.

## Architecture

This feature follows **Screaming Architecture** and **Hexagonal Architecture** patterns:

```
auth/
├── application/          # Application layer (use cases, factories)
│   ├── factories/       # Domain object factories
│   │   └── token/       # JWT token creation and verification
│   └── use-cases/       # Business logic orchestration
│       ├── login/       # User authentication
│       ├── logout/      # Session termination
│       └── refresh-token/ # Token refresh logic
├── domain/              # Domain layer (entities, interfaces)
│   ├── entities/        # Domain models
│   │   └── refresh-token/
│   └── repositories/    # Repository interfaces (ports)
│       └── refresh-token/
├── infrastructure/      # Infrastructure layer (adapters)
│   ├── http/           # HTTP adapters
│   │   └── routes/     # FastifyRoutes
│   └── repositories/   # Repository implementations
│       └── refresh-token/
└── config/             # Dependency injection
    └── auth.container.ts
```

## Domain Model

### RefreshToken Entity
- **Purpose**: Represents a refresh token for extending user sessions
- **Attributes**:
  - `id`: Unique identifier (RefreshTokenId)
  - `userId`: Associated user (UserId)
  - `token`: Hashed refresh token
  - `expiresAt`: Expiration timestamp
  - `createdAt`: Creation timestamp
- **Business Rules**:
  - Tokens must have expiration date
  - Tokens are hashed before storage
  - Expired tokens cannot be used

## Use Cases

### LoginUseCase
**Purpose**: Authenticate user and create session

**Input**: `LoginRequest`
- `email`: User email
- `password`: User password

**Output**: `LoginResponse`
- `accessToken`: JWT access token (15min TTL)
- `refreshToken`: Refresh token (7 days TTL)

**Flow**:
1. Find user by email
2. Verify password using IPasswordHasher
3. Generate access token and refresh token
4. Store refresh token in database
5. Record metrics

**Error Cases**:
- `INVALID_CREDENTIALS`: Email or password incorrect
- `INTERNAL_ERROR`: Database or system failure

### RefreshTokenUseCase
**Purpose**: Generate new access token using refresh token

**Input**: `RefreshTokenRequest`
- `refreshToken`: Current refresh token

**Output**: `RefreshTokenResponse`
- `accessToken`: New JWT access token

**Flow**:
1. Verify refresh token signature
2. Extract userId from token
3. Validate token exists in database
4. Verify user still exists
5. Generate new access token

**Error Cases**:
- `INVALID_TOKEN`: Token invalid or expired
- `USER_NOT_FOUND`: User no longer exists
- `INTERNAL_ERROR`: Database failure

### LogoutUseCase
**Purpose**: Invalidate user session

**Input**: `LogoutRequest`
- `refreshToken`: Token to invalidate

**Output**: `LogoutResponse`
- Success/failure status

**Flow**:
1. Delete refresh token from database
2. Return success

**Error Cases**:
- `INTERNAL_ERROR`: Database failure

## Factories

### TokenFactory
**Purpose**: Create and verify JWT tokens

**Capabilities**:
- `createAccessToken()`: Generate access token (15min)
- `createRefreshToken()`: Generate refresh token (7 days)
- `verifyAccessToken()`: Validate access token
- `verifyRefreshToken()`: Validate refresh token

**Configuration**:
- Uses environment variable `JWT_SECRET`
- Access token TTL: 15 minutes
- Refresh token TTL: 7 days

## Repository

### IRefreshTokenRepository (Port)
**Interface defining data access operations**:
- `save({ refreshToken })`: Store refresh token
- `findByToken({ token })`: Retrieve by token
- `findByUserId({ userId })`: Get all user tokens
- `delete({ token })`: Remove token
- `deleteAllByUserId({ userId })`: Remove all user tokens

### KyselyRefreshTokenRepository (Adapter)
**PostgreSQL implementation using Kysely**:
- Uses `refresh_tokens` table
- Implements all IRefreshTokenRepository methods
- Uses factory pattern with `create()` method

## HTTP Routes

### POST `/api/auth/login`
**Purpose**: Authenticate user

**Request**:
```json
{
  "email": "user@example.com",
  "password": "secretpassword"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Errors**:
- 401: Invalid credentials
- 500: Internal error

### POST `/api/auth/refresh`
**Purpose**: Get new access token

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc..."
  }
}
```

**Errors**:
- 401: Invalid or expired token
- 404: User not found
- 500: Internal error

### POST `/api/auth/logout`
**Purpose**: End user session

**Request**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": null
}
```

## Dependencies

### Internal Dependencies
- **Users Feature**: IUserRepository (cross-feature dependency)
- **Shared Infrastructure**:
  - `IPasswordHasher`: Password verification
  - `IMetricsService`: Observability
  - `Database`: Data persistence

### External Dependencies
- `jsonwebtoken`: JWT token handling
- `@fastify/jwt`: Fastify JWT plugin
- `kysely`: Type-safe SQL query builder

## Dependency Injection

The `AuthContainer` manages all auth-specific dependencies:

```typescript
export class AuthContainer {
  constructor(
    private readonly database: Database,
    private readonly env: Env,
    private readonly metricsService: IMetricsService,
    private readonly passwordHasher: IPasswordHasher,
    private readonly userRepository: IUserRepository, // Cross-feature
  ) {}

  get tokenFactory(): TokenFactory
  get refreshTokenRepository(): IRefreshTokenRepository
  get loginUseCase(): LoginUseCase
  get refreshTokenUseCase(): RefreshTokenUseCase
  get logoutUseCase(): LogoutUseCase
}
```

**Key Design Decisions**:
- Lazy initialization via getters
- Singleton instances
- Cross-feature dependencies injected via constructor
- No direct feature-to-feature coupling

## Metrics

The auth feature emits the following metrics:

- `auth_login_total`: Login attempts (labels: `status=success|failure`)
- Request/response metrics via shared middleware

## Testing Strategy

### Unit Tests
- Use case tests with mocked repositories
- Factory tests for token generation
- Entity tests for RefreshToken business rules

### Integration Tests
- HTTP route tests with real database
- Repository tests with test database
- End-to-end authentication flows

### Test Helpers
- `buildRefreshToken()`: Test data builder
- Test containers with isolated databases

## Security Considerations

1. **Password Storage**: Never stored in this feature, only verified via IPasswordHasher
2. **Token Storage**: Refresh tokens hashed before database storage
3. **Token Expiration**: Access tokens expire in 15min, refresh tokens in 7 days
4. **Token Invalidation**: Logout removes refresh tokens from database
5. **Rate Limiting**: Applied at application level (100 req/15min)

## Future Enhancements

- [ ] Multi-device session management
- [ ] Refresh token rotation
- [ ] Account lockout after failed attempts
- [ ] OAuth2 integration
- [ ] Two-factor authentication (2FA)
- [ ] Session activity tracking
