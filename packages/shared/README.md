# @team-pulse/shared

Shared package containing DTOs with Zod validation schemas and common types.

## Important: ESM Import Rules

⚠️ **CRITICAL**: All internal imports MUST use explicit `.js` extensions, even in `.ts` files.

### Why?

This package is consumed by Vercel serverless functions running in Node.js ESM mode, which requires explicit file extensions.

### Examples

```typescript
// ✅ CORRECT
export * from './types/index.js'
export { SomeType } from './dtos/auth.dto.js'
import type { UserRole } from '../types/index.js'

// ❌ WRONG - Will fail in production!
export * from './types'
export { SomeType } from './dtos/auth.dto'
import type { UserRole } from '../types'
```

### Verification

Run before committing:
```bash
npm run validate:imports
```

## Structure

```
src/
├── dtos/           # Data Transfer Objects with Zod schemas
│   ├── auth.dto.ts
│   ├── team.dto.ts
│   └── index.ts
├── errors/         # Application error system
│   ├── core.ts                    # Base error class and constants
│   ├── ValidationError.ts         # 400 - Validation failures
│   ├── AuthenticationError.ts     # 401 - Authentication failures
│   ├── AuthorizationError.ts      # 403 - Authorization failures
│   ├── NotFoundError.ts           # 404 - Resource not found
│   ├── ConflictError.ts           # 409 - Resource conflicts
│   ├── BusinessRuleError.ts       # 422 - Business rule violations
│   ├── ExternalServiceError.ts    # 502 - External service failures
│   ├── InternalError.ts           # 500 - Internal server errors
│   └── index.ts
├── types/          # Core domain types
│   └── index.ts
└── index.ts        # Main entry point
```

## Error System

A comprehensive, type-safe error management system for consistent error handling across the application.

### Importing

```typescript
// Import specific errors
import { ValidationError, NotFoundError } from '@team-pulse/shared/errors'

// Import constants and types
import { ERROR_CODES, ERROR_SEVERITY, ERROR_CATEGORY } from '@team-pulse/shared/errors'
import type { IApplicationError, ErrorSeverity } from '@team-pulse/shared/errors'
```

### Error Types

All errors extend `ApplicationError` and include:
- `code`: Unique error code (e.g., `"VALIDATION_ERROR"`)
- `category`: Error category (e.g., `"validation"`)
- `severity`: Error severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `timestamp`: When the error occurred
- `isOperational`: Whether the error is safe to expose to clients
- `metadata`: Additional context (optional)

#### ValidationError (400 Bad Request)

```typescript
// Generic validation error
ValidationError.create({
  message: 'Invalid input data',
  metadata: { source: 'registration-form' }
})

// Field-specific error
ValidationError.forField({
  field: 'email',
  message: 'Email format is invalid'
})

// From Zod validation
try {
  schema.parse(data)
} catch (error) {
  throw ValidationError.fromZodError({ error })
}
```

#### AuthenticationError (401 Unauthorized)

```typescript
// Generic authentication error
AuthenticationError.create({ message: 'Authentication required' })

// Pre-built authentication errors
AuthenticationError.invalidCredentials()
AuthenticationError.invalidToken({ reason: 'expired' })
AuthenticationError.missingToken()
```

#### AuthorizationError (403 Forbidden)

```typescript
// Generic authorization error
AuthorizationError.create({ message: 'Access denied' })

// Permission-based error
AuthorizationError.insufficientPermissions({
  required: 'admin',
  actual: 'user'
})

// Multiple required permissions
AuthorizationError.insufficientPermissions({
  required: ['write', 'delete'],
  actual: 'read'
})
```

#### NotFoundError (404 Not Found)

```typescript
// Generic not found
NotFoundError.create({ message: 'Resource not found' })

// Resource-specific
NotFoundError.forResource({
  resource: 'User',
  identifier: 'user-123'
})
```

#### ConflictError (409 Conflict)

```typescript
// Generic conflict
ConflictError.create({ message: 'Operation conflicts with current state' })

// Duplicate resource
ConflictError.duplicate({
  resource: 'User',
  identifier: 'email@example.com'
})
```

#### BusinessRuleError (422 Unprocessable Entity)

```typescript
// Business rule violation
BusinessRuleError.create({
  message: 'Cannot delete team with active members',
  rule: 'team_has_members',
  metadata: { memberCount: 5 }
})
```

#### ExternalServiceError (502 Bad Gateway)

```typescript
// External service failure
ExternalServiceError.create({
  message: 'Payment service unavailable',
  service: 'PaymentService',
  metadata: { statusCode: 503 }
})
```

#### InternalError (500 Internal Server Error)

⚠️ **Note**: `isOperational: false` - details should NOT be exposed to clients.

```typescript
// Generic internal error
InternalError.create({
  message: 'Internal server error',
  metadata: { errorId: 'err-123' }
})

// From unexpected exception
try {
  // ... risky operation
} catch (error) {
  throw InternalError.fromError({
    error,
    context: 'database-connection'
  })
}
```

### Error Methods

#### `withContext()`

Add additional context to an error:

```typescript
const error = ValidationError.forField({
  field: 'email',
  message: 'Invalid format'
})

// Add request context
throw error.withContext({
  ctx: {
    userId: 'user-123',
    endpoint: '/api/users'
  }
})
```

#### `toJSON()`

Serialize error for logging or API responses:

```typescript
const error = NotFoundError.forResource({
  resource: 'User',
  identifier: 'user-123'
})

console.log(error.toJSON())
// {
//   name: 'NotFoundError',
//   message: 'User not found',
//   code: 'NOT_FOUND_ERROR',
//   category: 'not_found',
//   severity: 'low',
//   timestamp: '2025-11-25T...',
//   isOperational: true,
//   metadata: { resource: 'User', identifier: 'user-123' }
// }
```

### Type Guards

```typescript
import { isApplicationError, isIApplicationError } from '@team-pulse/shared/errors'

// Check if error is ApplicationError instance
if (isApplicationError(error)) {
  console.log(error.code, error.category)
}

// Check if object implements IApplicationError interface
if (isIApplicationError(obj)) {
  console.log(obj.code, obj.severity)
}
```

### Constants

```typescript
import { ERROR_CODES, ERROR_SEVERITY, ERROR_CATEGORY } from '@team-pulse/shared/errors'

// Error codes
ERROR_CODES.VALIDATION_ERROR        // 'VALIDATION_ERROR'
ERROR_CODES.AUTHENTICATION_ERROR    // 'AUTHENTICATION_ERROR'
ERROR_CODES.AUTHORIZATION_ERROR     // 'AUTHORIZATION_ERROR'
ERROR_CODES.NOT_FOUND_ERROR         // 'NOT_FOUND_ERROR'
ERROR_CODES.CONFLICT_ERROR          // 'CONFLICT_ERROR'
ERROR_CODES.BUSINESS_RULE_ERROR     // 'BUSINESS_RULE_ERROR'
ERROR_CODES.EXTERNAL_SERVICE_ERROR  // 'EXTERNAL_SERVICE_ERROR'
ERROR_CODES.INTERNAL_ERROR          // 'INTERNAL_ERROR'

// Severity levels
ERROR_SEVERITY.LOW       // 'low'
ERROR_SEVERITY.MEDIUM    // 'medium'
ERROR_SEVERITY.HIGH      // 'high'
ERROR_SEVERITY.CRITICAL  // 'critical'

// Categories (map to HTTP status codes)
ERROR_CATEGORY.VALIDATION      // 'validation' (400)
ERROR_CATEGORY.AUTHENTICATION  // 'authentication' (401)
ERROR_CATEGORY.AUTHORIZATION   // 'authorization' (403)
ERROR_CATEGORY.NOT_FOUND       // 'not_found' (404)
ERROR_CATEGORY.CONFLICT        // 'conflict' (409)
ERROR_CATEGORY.BUSINESS_RULE   // 'business_rule' (422)
ERROR_CATEGORY.EXTERNAL        // 'external' (502)
ERROR_CATEGORY.INTERNAL        // 'internal' (500)
```

## Development

```bash
# Build
npm run build

# Test
npm run test

# Type check
npm run type-check

# Validate imports have .js extensions
npm run validate:imports
```
