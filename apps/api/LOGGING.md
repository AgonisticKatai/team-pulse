# Structured Logging Guide

This project uses **Fastify's built-in logger (Pino)** with structured logging and **automatic correlation ID injection** via AsyncLocalStorage.

## Features

- **Structured Logging**: JSON format in production for machine parsing
- **Pretty Logging**: Human-readable format in development (via piping)
- **Request Context**: Automatic logging of request/response details
- **Automatic Correlation IDs**: Track requests across the entire system automatically
- **Error Serialization**: Proper stack trace and error details in logs
- **AsyncLocalStorage**: Thread-safe request context without manual propagation

## Correlation IDs

Correlation IDs help track a single request through the entire system, making debugging easier in production.

### How It Works

1. **Client sends request** (optionally with `X-Correlation-ID` header)
2. **Middleware extracts or generates** correlation ID (UUID)
3. **Correlation ID is stored** in AsyncLocalStorage
4. **Pino mixin automatically reads** from AsyncLocalStorage
5. **ALL logs automatically include** `correlationId` field
6. **Response includes** `X-Correlation-ID` header for client tracking

### Automatic Correlation ID Injection ✨

**The correlation ID is AUTOMATICALLY included in ALL logs** via AsyncLocalStorage + Pino mixin.

No manual work needed:

```typescript
// ✅ This is all you need - correlationId is added automatically!
request.log.info('User logged in')

// Output in JSON:
// {
//   "level": "info",
//   "correlationId": "550e8400-e29b-41d4-a716-446655440000",
//   "reqId": "req-1",
//   "msg": "User logged in"
// }

// You can still add more context if needed
request.log.info({ userId: user.id }, 'User logged in')
```

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

### Why AsyncLocalStorage + Mixin?

We use AsyncLocalStorage with Pino mixin instead of child loggers because:

**✅ Benefits:**
- **No deadlocks**: Doesn't suffer from child logger + pino-pretty issues
- **Automatic**: No need to manually pass `correlationId` to every log call
- **Clean code**: No `{ correlationId: request.correlationId }` everywhere
- **Thread-safe**: Works correctly across async operations
- **Minimal overhead**: ~1-2% performance impact in most applications
- **Modern best practice**: Recommended approach in 2025 for Node.js logging

**❌ Why not child loggers:**
- Child loggers with pino-pretty transport can cause deadlocks
- Require explicit logger passing through function calls
- More complex setup and error-prone

**❌ Why not manual inclusion:**
- Verbose and error-prone (easy to forget)
- Clutters code with repetitive correlation ID passing
- Harder to maintain consistency

## Log Formats

### Development

JSON logs by default, can be piped to pino-pretty for human-readable output:

```bash
# Run with pretty printing
pnpm dev | pnpm exec pino-pretty

# Output:
# [12:34:56 INFO] (correlationId: 550e8400-e29b-41d4-a716-446655440000): GET /api/teams
# [12:34:56 INFO] (correlationId: 550e8400-e29b-41d4-a716-446655440000): User logged in
```

Raw JSON (default):
```json
{"level":"info","correlationId":"550e8400-e29b-41d4-a716-446655440000","reqId":"req-1","msg":"User logged in"}
```

### Production

Structured JSON logs for machine parsing and log aggregation:

```json
{
  "level": "info",
  "time": "2025-11-15T12:34:56.789Z",
  "env": "production",
  "service": "team-pulse-api",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "reqId": "req-1",
  "req": {
    "method": "GET",
    "url": "/api/teams"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 15,
  "msg": "request completed"
}
```

## Usage in Code

### In Route Handlers

The logger is available on the `request` object. Correlation IDs are **automatically included**:

```typescript
fastify.get('/api/teams', async (request, reply) => {
  // ✨ Correlation ID is automatically included in all logs!
  request.log.info('Fetching teams')

  try {
    const teams = await teamRepository.findAll()
    request.log.info({ count: teams.length }, 'Teams fetched successfully')
    return teams
  } catch (error) {
    request.log.error({ error }, 'Failed to fetch teams')
    throw error
  }
})
```

### In Service Layers (Outside Request Context)

You can also access the correlation ID from anywhere in your service layer:

```typescript
import { getCorrelationId } from '../infrastructure/logging/context.js'
import { logger } from '../infrastructure/logging/logger.js' // App-level logger

class TeamService {
  async findTeam(id: string) {
    // Get correlation ID from AsyncLocalStorage
    const correlationId = getCorrelationId()

    // Log with app logger (outside request context)
    logger.info({ correlationId, teamId: id }, 'Finding team')

    // ... rest of logic
  }
}
```

**Note:** When using `request.log`, the correlation ID is automatic. When using a standalone logger outside the request context, you can manually get it from AsyncLocalStorage if needed.

### Log Levels

- `request.log.trace()` - Very detailed debugging
- `request.log.debug()` - Debugging information
- `request.log.info()` - General information
- `request.log.warn()` - Warning messages
- `request.log.error()` - Error messages
- `request.log.fatal()` - Fatal errors

### Structured Logging

Include additional context with structured fields (correlation ID is automatic):

```typescript
// ✨ Log with structured data - correlationId added automatically!
request.log.info({
  userId: user.id,
  action: 'login',
  ip: request.ip
}, 'User logged in successfully')

// Produces (in production JSON format):
// {
//   "level": "info",
//   "time": "2025-11-15T12:34:56.789Z",
//   "correlationId": "550e8400-e29b-41d4-a716-446655440000",  // ← Automatic!
//   "reqId": "req-1",                                          // ← Automatic!
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
- `NODE_ENV`: Controls log format (development = JSON, production = JSON with metadata)

### Development Setup

```bash
# .env
LOG_LEVEL=debug
NODE_ENV=development
```

Run with pretty printing (optional):

```bash
pnpm dev | pnpm exec pino-pretty
```

Output:
```
[12:34:56 DEBUG] (correlationId: abc-123): Checking user permissions
[12:34:56 INFO] (correlationId: abc-123): User authenticated successfully
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
  "correlationId": "abc-123",
  "msg": "User authenticated successfully"
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

### Logger Configuration in Tests

The logger is configured differently in test environment to avoid polluting test output:

```typescript
// src/infrastructure/logging/logger-config.ts
if (env === 'test') {
  return {
    level: 'silent'  // Logger is functional but produces no output
  }
}
```

**Why not `false`?**
- Fastify's `inject()` method (used for testing) relies on logger infrastructure for request lifecycle
- Plugins and hooks may call `request.log.*` methods
- Returning `false` completely disables the logger, breaking internal Fastify mechanisms

**Why `silent` level?**
- Keeps test output clean (no log pollution)
- Logger infrastructure remains functional
- Tests can still use `request.log.*` without errors

### Correlation ID in Tests

The correlation ID middleware is **disabled in test environment**:

```typescript
// src/app.ts
if (env.NODE_ENV !== 'test') {
  fastify.addHook('onRequest', correlationIdMiddleware)
}
```

**Rationale:**
1. Tests don't involve distributed systems requiring request tracing
2. Logger is set to 'silent' level anyway
3. Test requests are isolated and don't need correlation tracking
4. Simplifies test setup and reduces overhead
5. AsyncLocalStorage context not needed in tests

### Enabling Logging for Test Debugging

If you need to see logs during test development:

```typescript
// In your test file
process.env.NODE_ENV = 'development'
process.env.LOG_LEVEL = 'debug'

// Now rebuild the app - logs will be visible
const { app } = await buildApp()
```

**Note:** Remember to revert this before committing tests.

## How It Works Internally

### AsyncLocalStorage + Pino Mixin

1. **Request arrives** → `correlationIdMiddleware` runs
2. **Correlation ID extracted/generated** → Stored in AsyncLocalStorage
3. **Every log call** → Pino mixin function executes
4. **Mixin reads** from AsyncLocalStorage → Injects `correlationId` field
5. **Log output** → Includes correlation ID automatically

```typescript
// In logger-config.ts
{
  mixin() {
    const context = getRequestContext()  // ← Reads from AsyncLocalStorage
    return context ? {
      correlationId: context.correlationId,
      reqId: context.requestId,
    } : {}
  }
}
```

This happens **automatically for every log**, so you never have to think about it.

## Troubleshooting

### Logs not appearing

Check:
1. `LOG_LEVEL` environment variable is set correctly
2. You're using `request.log` not `console.log`
3. Test environment doesn't disable logging

### Correlation ID missing from logs

Check:
1. Correlation ID middleware is registered in `app.ts`
2. Middleware runs before your route handlers (`onRequest` hook)
3. You're in development or production environment (not test)
4. The mixin function is configured in logger config

### Pretty printing not working

Pretty printing requires piping:

```bash
# ❌ Wrong - pretty printing not configured as transport
pnpm dev

# ✅ Correct - pipe to pino-pretty
pnpm dev | pnpm exec pino-pretty
```

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Fastify Logging](https://www.fastify.io/docs/latest/Reference/Logging/)
- [12-Factor App: Logs](https://12factor.net/logs)
