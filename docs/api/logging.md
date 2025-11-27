# Structured Logging Guide

This project uses **Fastify's built-in logger (Pino)** with structured logging and **correlation IDs for distributed tracing**.

## Features

- **Structured Logging**: JSON format in production for machine parsing
- **Pretty Logging**: Human-readable colorized format in development (via pino-pretty)
- **Request Context**: Automatic logging of request/response details
- **Correlation IDs**: Track requests across the entire system
- **Error Serialization**: Proper stack trace and error details in logs
- **Tested in CI/CD**: Integration tests validate middleware doesn't cause timeouts or deadlocks

## Correlation IDs

Correlation IDs help track a single request through the entire system, making debugging easier in production.

### How It Works

1. **Client sends request** (optionally with `X-Correlation-ID` header)
2. **Middleware extracts or generates** correlation ID (UUID)
3. **Correlation ID is attached** to `request.correlationId`
4. **Pino serializer** includes it when request object is logged
5. **Response includes** `X-Correlation-ID` header for client tracking

### Using Correlation IDs in Logs

The correlation ID is available via the request serializer and on `request.correlationId`:

```typescript
// The correlation ID appears automatically in request logs
// via Pino's request serializer
app.get('/api/users', async (request, reply) => {
  // Fastify automatically logs the request, including correlationId
  request.log.info('Fetching users')
  
  // You can also access it directly
  const correlationId = request.correlationId
  
  // Include it in custom logs
  request.log.info({ correlationId, count: users.length }, 'Users fetched')
  
  // Pass it to external services
  await externalApi.call({ 
    headers: { 'X-Correlation-ID': correlationId } 
  })
})
```

### Technical Implementation

1. **correlationIdMiddleware** (in `correlation-id.ts`):
   - Runs on **every request** via `onRequest` hook (including tests)
   - **MUST be async** for proper Fastify lifecycle handling with pino-pretty
   - Extracts or generates correlation ID
   - Attaches it to `request.correlationId`
   - Adds `X-Correlation-ID` response header

2. **Pino request serializer** (in `logger-config.ts`):
   - Configured at logger creation time
   - Runs when request object is logged
   - Reads `correlationId` from request
   - Includes it in the log output

**Why this approach**:
- ✅ **No child loggers** - Avoids pino-pretty deadlock issues
- ✅ **No AsyncLocalStorage** - Avoids Fastify hook compatibility issues
- ✅ **No mixin** - Avoids circular reference and performance issues
- ✅ **Simple** - Straightforward request property access
- ✅ **Standard** - Uses Pino's built-in serializer feature
- ✅ **Tested** - Integration tests validate no timeouts or deadlocks

**Critical: Async Hook Requirement**
The middleware MUST be declared as `async function` even without `await` expressions. This is required for Fastify's lifecycle to work correctly with pino-pretty transport. A synchronous middleware caused a production incident where the entire API hung.

**Important**: The correlation ID appears in logs that include the request object (like automatic request logging and error logs). For custom logs where you want the correlation ID, include it manually: `request.log.info({ correlationId: request.correlationId }, 'message')`.

### Example

```bash
# Client sends request with correlation ID
curl -H "X-Correlation-ID: abc-123" http://localhost:3000/api/teams

# Response will include: X-Correlation-ID: abc-123
```

If no correlation ID is provided, one is automatically generated:

```bash
# Client sends request without correlation ID
curl http://localhost:3000/api/teams

# System generates UUID: X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

### Testing

The correlation ID middleware is tested in **all environments** (development, test, production) to ensure it doesn't cause timeouts or deadlocks. See `correlation-id.integration.test.ts` for comprehensive tests that validate:

- ✅ No timeouts (critical regression test)
- ✅ Correlation IDs are generated when not provided
- ✅ Client-provided correlation IDs are preserved
- ✅ Array headers are handled correctly
- ✅ Multiple concurrent requests work without deadlocks
- ✅ Works with protected and public endpoints
- ✅ Works with GET and POST requests

**Why we test in all environments**: We had a production incident where a synchronous middleware caused the entire API to hang. These tests catch such issues before deployment.

## Log Formats

### Development

Pretty-printed logs with colorization (via pino-pretty transport):

```bash
# Automatic pretty printing in development
pnpm dev

# Output:
[12:34:56] INFO (req-1): GET /api/teams
    correlationId: "550e8400-e29b-41d4-a716-446655440000"
[12:34:56] INFO (req-1): User logged in
    correlationId: "550e8400-e29b-41d4-a716-446655440000"
```

### Production

Structured JSON logs for machine parsing and log aggregation:

```json
{
  "level": "info",
  "time": "2025-11-15T12:34:56.789Z",
  "env": "production",
  "service": "team-pulse-api",
  "req": {
    "id": "req-1",
    "method": "GET",
    "url": "/api/teams",
    "correlationId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 15,
  "msg": "request completed"
}
```

### Test

Silent logs (no output) to avoid polluting test results:

```typescript
// Logger is set to 'silent' level
// No logs appear during test runs
// Logger infrastructure still works for Fastify lifecycle
```

## Usage in Code

### In Route Handlers

The logger is available on the `request` object. Correlation IDs are included via request serializer:

```typescript
fastify.get('/api/teams', async (request, reply) => {
  // Correlation ID automatically included when request is logged
  request.log.info('Fetching teams')

  try {
    const teams = await teamRepository.findAll()
    
    // Include correlation ID explicitly in custom logs
    request.log.info({ 
      correlationId: request.correlationId, 
      count: teams.length 
    }, 'Teams fetched successfully')
    
    return teams
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch teams')
    throw error
  }
})
```

### Accessing Correlation ID

The correlation ID is available directly on the request object:

```typescript
const correlationId = request.correlationId

// Pass to external services
await externalApi.call({
  headers: { 'X-Correlation-ID': correlationId }
})

// Include in database queries for audit trails
await db.insert({ correlationId, userId, action })
```

### Log Levels

- `request.log.trace()` - Very detailed debugging
- `request.log.debug()` - Debugging information
- `request.log.info()` - General information
- `request.log.warn()` - Warning messages
- `request.log.error()` - Error messages
- `request.log.fatal()` - Fatal errors

### Structured Logging

Include additional context with structured fields:

```typescript
request.log.info({
  userId: user.id,
  action: 'login',
  ip: request.ip
}, 'User logged in successfully')

// Produces (in production JSON format):
// {
//   "level": "info",
//   "time": "2025-11-15T12:34:56.789Z",
//   "req": {
//     "correlationId": "550e8400-e29b-41d4-a716-446655440000"
//   },
//   "reqId": "req-1",
//   "userId": "123",
//   "action": "login",
//   "ip": "192.168.1.1",
//   "msg": "User logged in successfully"
// }
```

### Error Logging

Errors are automatically serialized with stack traces:

```typescript
try {
  await riskyOperation()
} catch (error) {
  request.log.error(error, 'Operation failed')
  // Includes: message, name, stack, type
}
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set log level (trace, debug, info, warn, error, fatal)
- `NODE_ENV`: Controls log format (development = pretty with pino-pretty, production = JSON)

### Development Setup

```bash
# .env
LOG_LEVEL=debug
NODE_ENV=development
```

Automatic pretty printing via pino-pretty transport:

```
[12:34:56] DEBUG: Checking user permissions
    correlationId: "abc-123"
[12:34:56] INFO: User authenticated successfully
    correlationId: "abc-123"
```

### Production Setup

```bash
# .env.production
LOG_LEVEL=info
NODE_ENV=production
```

Structured JSON logs for CloudWatch, Datadog, etc.:

```json
{
  "level": "info",
  "time": "2025-11-15T12:34:56.789Z",
  "req": {
    "correlationId": "abc-123",
    "method": "GET",
    "url": "/api/teams"
  },
  "msg": "request completed"
}
```

## Best Practices

### 1. Use Structured Fields

✅ **Good**: Include context as structured fields

```typescript
request.log.info({ teamId: team.id, memberCount: team.members.length }, 'Team created')
```

❌ **Bad**: Concatenate strings

```typescript
request.log.info(`Team ${team.id} created with ${team.members.length} members`)
```

### 2. Choose Appropriate Log Levels

```typescript
// trace: Very detailed debugging (disabled in production)
request.log.trace({ query }, 'Executing database query')

// debug: Debugging information (disabled in production)
request.log.debug({ cacheHit: true }, 'Cache lookup result')

// info: General information (always logged)
request.log.info({ teamId }, 'Team created successfully')

// warn: Warning conditions
request.log.warn({ retries: 3 }, 'Retrying failed operation')

// error: Error conditions
request.log.error(error, 'Failed to process request')

// fatal: Application crash (process will exit)
request.log.fatal(error, 'Database connection lost')
```

### 3. Include Correlation IDs in External Calls

When making HTTP requests to other services, pass the correlation ID:

```typescript
const response = await fetch('https://api.example.com/data', {
  headers: {
    'X-Correlation-ID': request.correlationId
  }
})
```

### 4. Don't Log Sensitive Data

❌ **Never log**:
- Passwords
- API keys
- Access tokens
- Credit card numbers
- Personal information (without consent)

```typescript
// ❌ BAD
request.log.info({ password: user.password }, 'User created')

// ✅ GOOD
request.log.info({ userId: user.id, email: user.email }, 'User created')
```

## Monitoring and Debugging

### Finding Logs by Correlation ID

In development, search logs for the correlation ID:

```bash
# Search logs for specific correlation ID
grep "550e8400-e29b-41d4-a716-446655440000" logs/app.log
```

In production, use your log aggregation service:

```
# CloudWatch Logs Insights
fields @timestamp, @message
| filter correlationId = "550e8400-e29b-41d4-a716-446655440000"
| sort @timestamp desc

# Datadog
correlationId:"550e8400-e29b-41d4-a716-446655440000"
```

### Debugging a Request Flow

1. Get correlation ID from response header or error message
2. Search logs for that correlation ID
3. See the complete request lifecycle:

```
12:34:56 INFO abc-123 Request received: GET /api/teams
12:34:56 DEBUG abc-123 Checking authentication
12:34:56 DEBUG abc-123 User authenticated: user@example.com
12:34:56 DEBUG abc-123 Querying database
12:34:56 INFO abc-123 Query completed: 150ms
12:34:56 INFO abc-123 Request completed: 200 165ms
```

## Testing

The logging system includes comprehensive tests to validate production behavior:

### Test Configuration

The logger is configured with `silent` level in tests but remains fully functional:

```typescript
// src/infrastructure/logging/logger-config.ts
if (env === 'test') {
  return {
    level: 'silent'  // No output, but infrastructure works
  }
}
```

**Why not `false`?**
- Fastify's request lifecycle requires logger infrastructure
- Middleware still needs to function for integration tests
- Plugins and hooks call `request.log.*` methods

### Correlation ID Tests

**Unit tests** (`correlation-id.test.ts`):
- Test middleware logic in isolation
- Mock request/reply objects
- Verify UUID generation and header handling

**Integration tests** (`correlation-id.integration.test.ts`):
- Use real Fastify instance with full configuration
- Test with actual PostgreSQL database via testcontainers
- **Critical**: Validate no timeouts or deadlocks (catches async hook issues)
- Test concurrent requests and protected endpoints

### Running Tests

```bash
# Run all tests including logging tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

## Troubleshooting

### Logs not appearing

Check:
1. `LOG_LEVEL` environment variable is set correctly
2. You're using `request.log` not `console.log`
3. In development, pino-pretty transport should be automatic

### Correlation ID missing from logs

Check:
1. Correlation ID middleware is registered in `app.ts`
2. Middleware runs before route handlers (`onRequest` hook)
3. Request serializer includes `correlationId: req.correlationId`

### Server hangs or timeouts

This can happen if the `onRequest` hook is synchronous with pino-pretty:

```typescript
// ❌ WRONG - will cause deadlock
export function correlationIdMiddleware(request, reply) { ... }

// ✅ CORRECT - must be async
export async function correlationIdMiddleware(request, reply): Promise<void> { ... }
```

See the "Critical Async Requirement" section above.

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Fastify Logging](https://www.fastify.io/docs/latest/Reference/Logging/)
- [12-Factor App: Logs](https://12factor.net/logs)
