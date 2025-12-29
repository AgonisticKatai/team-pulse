# Teams Feature

## Overview

Team management feature for the TeamPulse API. Handles CRUD operations for football teams, allowing administrators to create, read, update, and delete team records.

## Architecture

This feature follows **Screaming Architecture** and **Hexagonal Architecture** patterns:

```
teams/
├── application/          # Application layer (use cases)
│   └── use-cases/       # Business logic orchestration
│       ├── create-team/ # Team creation
│       ├── delete-team/ # Team deletion
│       ├── get-team/    # Single team retrieval
│       ├── list-teams/  # Team listing with pagination
│       └── update-team/ # Team modification
├── domain/              # Domain layer (entities, interfaces)
│   ├── entities/        # Domain models
│   │   └── team/        # Team aggregate root
│   ├── repositories/    # Repository interfaces (ports)
│   │   └── team/
│   └── value-objects/   # Domain value objects
│       └── team-id/     # Team identifier
├── infrastructure/      # Infrastructure layer (adapters)
│   ├── http/           # HTTP adapters
│   │   └── routes/     # Fastify routes
│   └── repositories/   # Repository implementations
│       └── team/       # Kysely PostgreSQL adapter
└── config/             # Dependency injection
    └── teams.container.ts
```

## Domain Model

### Team Entity (Aggregate Root)
- **Purpose**: Represents a football team in the system
- **Attributes**:
  - `id`: Unique identifier (TeamId)
  - `name`: Team name (string)
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last modification timestamp
- **Business Rules**:
  - Name must be between 1 and 100 characters
  - Name is required and cannot be empty
  - Name is trimmed (no leading/trailing whitespace)

### Value Objects

#### TeamId
- **Purpose**: Strongly-typed team identifier
- **Implementation**: UUID v4
- **Immutable**: Cannot be changed after creation
- **Factory**: `TeamId.create()` generates new IDs
- **Reconstruction**: `TeamId.fromString(id)` from existing ID

## Use Cases

### CreateTeamUseCase
**Purpose**: Create a new team in the system

**Input**: `CreateTeamRequest`
- `name`: Team name (1-100 characters)

**Output**: `CreateTeamResponse`
- `team`: Created team entity

**Flow**:
1. Validate team name (length, format)
2. Create Team entity with validation
3. Save team to repository
4. Record metrics
5. Return created team

**Error Cases**:
- `VALIDATION_ERROR`: Invalid team name (empty, too long)
- `INTERNAL_ERROR`: Database or system failure

**Validation Rules**:
- Name: Required, 1-100 characters, trimmed

### GetTeamUseCase
**Purpose**: Retrieve a single team by ID

**Input**: `GetTeamRequest`
- `id`: Team ID (UUID)

**Output**: `GetTeamResponse`
- `team`: Team entity

**Flow**:
1. Find team by ID in repository
2. Return team if found

**Error Cases**:
- `TEAM_NOT_FOUND`: Team does not exist
- `INTERNAL_ERROR`: Database failure

### ListTeamsUseCase
**Purpose**: Retrieve paginated list of all teams

**Input**: `ListTeamsRequest`
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Output**: `ListTeamsResponse`
- `teams`: Array of team entities
- `total`: Total count of teams
- `page`: Current page
- `limit`: Items per page

**Flow**:
1. Fetch paginated teams from repository
2. Return teams with pagination metadata

**Error Cases**:
- `INTERNAL_ERROR`: Database failure

### UpdateTeamUseCase
**Purpose**: Update an existing team's information

**Input**: `UpdateTeamRequest`
- `id`: Team ID (UUID)
- `name`: New team name (1-100 characters)

**Output**: `UpdateTeamResponse`
- `team`: Updated team entity

**Flow**:
1. Find existing team by ID
2. Validate new team name
3. Update team entity
4. Save updated team to repository
5. Record metrics
6. Return updated team

**Error Cases**:
- `TEAM_NOT_FOUND`: Team does not exist
- `VALIDATION_ERROR`: Invalid team name
- `INTERNAL_ERROR`: Database or system failure

### DeleteTeamUseCase
**Purpose**: Remove a team from the system

**Input**: `DeleteTeamRequest`
- `id`: Team ID (UUID)

**Output**: `DeleteTeamResponse`
- Success/failure status

**Flow**:
1. Find team by ID (verify exists)
2. Delete team from repository
3. Record metrics
4. Return success

**Error Cases**:
- `TEAM_NOT_FOUND`: Team does not exist
- `INTERNAL_ERROR`: Database failure

## Repository

### ITeamRepository (Port)
**Interface defining data access operations**:
- `save({ team })`: Create or update team
- `findById({ id })`: Find by team ID
- `findAll()`: Get all teams
- `findAllPaginated({ page, limit })`: Get paginated teams
- `delete({ id })`: Remove team
- `count()`: Total team count

### KyselyTeamRepository (Adapter)
**PostgreSQL implementation using Kysely**:
- Uses `teams` table
- Implements all ITeamRepository methods
- Uses factory pattern with `create()` method
- Upsert support with `onConflict()`

**Database Schema**:
```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX teams_name_idx ON teams(name);
CREATE INDEX teams_created_at_idx ON teams(created_at);
```

## HTTP Routes

### POST `/api/teams`
**Purpose**: Create new team (Admin only)

**Authentication**: Required (JWT)
**Authorization**: ADMIN role

**Request**:
```json
{
  "name": "Real Madrid CF"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Real Madrid CF",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Errors**:
- 400: Validation error (invalid name)
- 401: Unauthorized (no token)
- 403: Forbidden (not admin)
- 500: Internal error

### GET `/api/teams/:id`
**Purpose**: Get single team (Authenticated users)

**Authentication**: Required (JWT)
**Authorization**: GUEST or ADMIN

**Response** (200):
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Real Madrid CF",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Errors**:
- 401: Unauthorized
- 404: Team not found
- 500: Internal error

### GET `/api/teams`
**Purpose**: List teams with pagination (Authenticated users)

**Authentication**: Required (JWT)
**Authorization**: GUEST or ADMIN

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Real Madrid CF",
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
- 500: Internal error

### PUT `/api/teams/:id`
**Purpose**: Update existing team (Admin only)

**Authentication**: Required (JWT)
**Authorization**: ADMIN role

**Request**:
```json
{
  "name": "Real Madrid Club de Fútbol"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "team": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Real Madrid Club de Fútbol",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T12:45:00Z"
    }
  }
}
```

**Errors**:
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Team not found
- 500: Internal error

### DELETE `/api/teams/:id`
**Purpose**: Delete team (Admin only)

**Authentication**: Required (JWT)
**Authorization**: ADMIN role

**Response** (200):
```json
{
  "success": true,
  "data": null
}
```

**Errors**:
- 401: Unauthorized
- 403: Forbidden
- 404: Team not found
- 500: Internal error

## Dependencies

### Internal Dependencies
- **Shared Infrastructure**:
  - `IMetricsService`: Observability
  - `Database`: Data persistence

### External Dependencies
- `kysely`: Type-safe SQL query builder
- `@team-pulse/shared`: Shared domain constants and types

## Dependency Injection

The `TeamsContainer` manages all team-specific dependencies:

```typescript
export class TeamsContainer {
  constructor(
    private readonly database: Database,
    private readonly metricsService: IMetricsService,
  ) {}

  get teamRepository(): ITeamRepository
  get createTeamUseCase(): CreateTeamUseCase
  get getTeamUseCase(): GetTeamUseCase
  get listTeamsUseCase(): ListTeamsUseCase
  get updateTeamUseCase(): UpdateTeamUseCase
  get deleteTeamUseCase(): DeleteTeamUseCase
}
```

**Key Design Decisions**:
- Lazy initialization via getters
- Singleton instances
- Shared dependencies injected via constructor
- No coupling to other features

## Metrics

The teams feature emits the following metrics:

- `teams_created_total`: Team creation attempts (labels: `status=success|failure`)
- `teams_updated_total`: Team update attempts (labels: `status=success|failure`)
- `teams_deleted_total`: Team deletion attempts (labels: `status=success|failure`)
- Request/response metrics via shared middleware

## Testing Strategy

### Unit Tests
- Use case tests with mocked repositories
- Entity tests for Team business rules
- Value object tests for TeamId

### Integration Tests
- HTTP route tests with real database
- Repository tests with test database
- End-to-end team CRUD flows

### Test Helpers
- `buildTeam()`: Test data builder with faker
- `generateRandomTeamData()`: Random team data generator
- Test containers with isolated databases

**Example**:
```typescript
const team = buildTeam({
  name: faker.string.alpha({
    length: {
      min: TEAM_NAME_RULES.MIN_LENGTH,
      max: TEAM_NAME_RULES.MAX_LENGTH
    }
  }),
})
```

## Validation Rules

### Team Name
- **Required**: Cannot be empty or whitespace only
- **Min Length**: 1 character
- **Max Length**: 100 characters
- **Trimmed**: Leading/trailing whitespace removed
- **Format**: Any valid string after trimming

## Security Considerations

1. **Authorization**: Only ADMIN users can create, update, or delete teams
2. **Authentication**: All endpoints require valid JWT token
3. **Input Validation**: Team name validated at domain layer
4. **SQL Injection**: Protected by Kysely's query builder
5. **Rate Limiting**: Applied at application level (100 req/15min)

## Business Logic

### Team Creation
- Name is trimmed before validation
- Duplicate team names are allowed (no uniqueness constraint)
- Team IDs are generated as UUIDs

### Team Updates
- Only name can be updated
- Team must exist before update
- updatedAt timestamp automatically updated

### Team Deletion
- Permanent deletion (no soft delete)
- Team must exist before deletion
- No cascade deletion (no related entities yet)

## Future Enhancements

- [ ] Team logo/badge support
- [ ] Team colors (primary, secondary)
- [ ] Team country/league association
- [ ] Team statistics (founded year, stadium, etc.)
- [ ] Team roster (players)
- [ ] Team schedule (matches)
- [ ] Team social media links
- [ ] Soft delete with restoration
- [ ] Team name uniqueness validation
- [ ] Team search by name (fuzzy matching)
- [ ] Team sorting options
- [ ] Team archive/active status
