# Users Feature

## Overview

User management feature for the TeamPulse API. Handles user registration, user retrieval, and user administration using a secure password-based authentication system.

## Architecture

This feature follows **Screaming Architecture** and **Hexagonal Architecture** patterns:

```
users/
├── application/          # Application layer (use cases)
│   └── use-cases/       # Business logic orchestration
│       ├── create-user/ # User registration
│       └── list-users/  # User listing with pagination
├── domain/              # Domain layer (entities, interfaces)
│   ├── entities/        # Domain models
│   │   └── user/        # User aggregate root
│   ├── repositories/    # Repository interfaces (ports)
│   │   └── user/
│   └── value-objects/   # Domain value objects
│       ├── email/       # Email validation
│       └── role/        # User role enumeration
├── infrastructure/      # Infrastructure layer (adapters)
│   ├── http/           # HTTP adapters
│   │   └── routes/     # Fastify routes
│   └── repositories/   # Repository implementations
│       └── user/       # Kysely PostgreSQL adapter
└── config/             # Dependency injection
    └── users.container.ts
```

## Domain Model

### User Entity (Aggregate Root)
- **Purpose**: Represents a user in the system
- **Attributes**:
  - `id`: Unique identifier (UserId)
  - `email`: User email (Email value object)
  - `passwordHash`: Hashed password
  - `role`: User role (Role value object)
  - `createdAt`: Registration timestamp
  - `updatedAt`: Last modification timestamp
- **Business Rules**:
  - Email must be unique and valid
  - Password must be hashed before storage
  - Role must be valid (GUEST or ADMIN)
  - Email is case-insensitive

### Value Objects

#### Email
- **Purpose**: Validate and normalize email addresses
- **Validation**:
  - Required field
  - Valid email format
  - Normalized to lowercase
- **Immutable**: Cannot be modified after creation

#### Role
- **Purpose**: Represent user permissions
- **Values**:
  - `GUEST`: Regular user with limited permissions
  - `ADMIN`: Administrator with full permissions
- **Business Rules**:
  - Role must be one of the predefined values
  - Cannot be empty

## Use Cases

### CreateUserUseCase
**Purpose**: Register a new user in the system

**Input**: `CreateUserRequest`
- `email`: User email
- `password`: Plain text password
- `role`: User role (GUEST or ADMIN)

**Output**: `CreateUserResponse`
- `user`: Created user entity (without password)

**Flow**:
1. Validate email is not already registered
2. Hash password using IPasswordHasher
3. Create User entity with validation
4. Save user to repository
5. Record metrics
6. Return user (without password hash)

**Error Cases**:
- `USER_ALREADY_EXISTS`: Email already registered
- `VALIDATION_ERROR`: Invalid email or role
- `INTERNAL_ERROR`: Database or system failure

**Validation Rules**:
- Email must be unique
- Email must be valid format
- Password must be provided
- Role must be GUEST or ADMIN

### ListUsersUseCase
**Purpose**: Retrieve paginated list of users

**Input**: `ListUsersRequest`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Output**: `ListUsersResponse`
- `users`: Array of user entities (without passwords)
- `total`: Total count of users
- `page`: Current page
- `limit`: Items per page

**Flow**:
1. Fetch paginated users from repository
2. Return users with pagination metadata

**Error Cases**:
- `INTERNAL_ERROR`: Database failure

## Repository

### IUserRepository (Port)
**Interface defining data access operations**:
- `save({ user })`: Create or update user
- `findById({ id })`: Find by user ID
- `findByEmail({ email })`: Find by email (case-insensitive)
- `findAll()`: Get all users
- `findAllPaginated({ page, limit })`: Get paginated users
- `delete({ id })`: Remove user
- `existsByEmail({ email })`: Check email exists (case-insensitive)
- `count()`: Total user count

### KyselyUserRepository (Adapter)
**PostgreSQL implementation using Kysely**:
- Uses `users` table
- Implements all IUserRepository methods
- Uses factory pattern with `create()` method
- Case-insensitive email queries using `LOWER()`
- Upsert support with `onConflict()`

**Database Schema**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(LOWER(email));
```

## HTTP Routes

### POST `/api/users`
**Purpose**: Create new user (Admin only)

**Authentication**: Required (JWT)
**Authorization**: ADMIN role

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "role": "GUEST"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "newuser@example.com",
      "role": "GUEST",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized (no token)
- 403: Forbidden (not admin)
- 409: User already exists
- 500: Internal error

### GET `/api/users`
**Purpose**: List users with pagination (Admin only)

**Authentication**: Required (JWT)
**Authorization**: ADMIN role

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "role": "GUEST",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 500: Internal error

## Dependencies

### Internal Dependencies
- **Shared Infrastructure**:
  - `IPasswordHasher`: Password hashing (ScryptPasswordHasher)
  - `IMetricsService`: Observability
  - `Database`: Data persistence

### External Dependencies
- `kysely`: Type-safe SQL query builder
- `@team-pulse/shared`: Shared domain constants and types

## Dependency Injection

The `UsersContainer` manages all user-specific dependencies:

```typescript
export class UsersContainer {
  constructor(
    private readonly database: Database,
    private readonly passwordHasher: IPasswordHasher,
    private readonly metricsService: IMetricsService,
  ) {}

  get userRepository(): IUserRepository
  get createUserUseCase(): CreateUserUseCase
  get listUsersUseCase(): ListUsersUseCase
}
```

**Key Design Decisions**:
- Lazy initialization via getters
- Singleton instances
- Shared dependencies injected via constructor
- No coupling to other features

## Metrics

The users feature emits the following metrics:

- `users_created_total`: User creation attempts (labels: `status=success|failure`)
- Request/response metrics via shared middleware

## Testing Strategy

### Unit Tests
- Use case tests with mocked repositories
- Entity tests for User business rules
- Value object tests for Email and Role validation

### Integration Tests
- HTTP route tests with real database
- Repository tests with test database
- End-to-end user flows

### Test Helpers
- `buildUser()`: Test data builder with faker
- `generateRandomUserData()`: Random user data generator
- Test containers with isolated databases

**Example**:
```typescript
const user = buildUser({
  email: faker.internet.email(),
  role: USER_ROLES.GUEST,
})
```

## Security Considerations

1. **Password Storage**: Always hashed using ScryptPasswordHasher (never plain text)
2. **Password Exposure**: Password hash never returned in HTTP responses
3. **Email Validation**: Normalized to lowercase, validated format
4. **Authorization**: Only ADMIN users can create users or list users
5. **Input Validation**: All inputs validated at domain layer
6. **Case-Insensitive Email**: Prevents duplicate accounts with different casing

## Validation Rules

### Email
- Required field
- Valid email format (RFC 5322)
- Unique in system
- Normalized to lowercase

### Password
- Required field
- Must be provided (hashing happens in use case)
- Never stored in plain text

### Role
- Required field
- Must be one of: GUEST, ADMIN
- Cannot be empty string

## Future Enhancements

- [ ] Email verification workflow
- [ ] Password reset functionality
- [ ] User profile updates
- [ ] User deactivation (soft delete)
- [ ] User search and filtering
- [ ] Bulk user operations
- [ ] User avatar support
- [ ] Account lockout mechanism
- [ ] Password strength requirements
- [ ] User activity logging
