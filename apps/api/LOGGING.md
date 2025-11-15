# Structured Logging Guide

This project uses **Fastify's built-in logger (Pino)** with structured logging and correlation IDs for request tracing.

## Features

- **Structured Logging**: JSON format in production for machine parsing
- **Pretty Logging**: Human-readable format in development with colors
- **Correlation IDs**: Track requests across the entire system
- **Request Context**: Automatic logging of request/response details
- **Error Serialization**: Proper stack trace and error details in logs

## Correlation IDs

### What is a Correlation ID?

A correlation ID is a unique identifier (UUID) attached to each HTTP request that:
- Tracks a request through the entire system
- Appears in all log messages for that request
- Can be passed to external services for distributed tracing
- Helps debug issues in production

### How It Works

1. **Client sends request** (optionally with `X-Correlation-ID` header)
2. **Middleware extracts or generates** correlation ID
3. **All logs for that request** include the correlation ID
4. **Response includes** `X-Correlation-ID` header

### Example

```bash
# Client sends request with correlation ID
curl -H "X-Correlation-ID: abc-123" http://localhost:3000/api/teams

# All logs for this request will include: correlationId: "abc-123"
# Response will include: X-Correlation-ID: abc-123
```

If no correlation ID is provided, one is automatically generated:

```bash
# Client sends request without correlation ID
curl http://localhost:3000/api/teams

# System generates UUID: X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
```

## Log Formats

### Development

Pretty-printed logs with colors for easy reading:

```
[12:34:56 INFO] 550e8400-e29b-41d4-a716-446655440000 GET /api/teams 200 15ms
[12:34:57 ERROR] 550e8400-e29b-41d4-a716-446655440000 Database connection failed
```

### Production

Structured JSON logs for machine parsing and log aggregation:

```json
{
  "level": "info",
  "time": "2025-11-15T12:34:56.789Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
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

The logger is available on the `request` object and automatically includes the correlation ID:

```typescript
fastify.get('/api/teams', async (request, reply) => {
  // Log with correlation ID automatically included
  request.log.info('Fetching teams')

  try {
    const teams = await teamRepository.findAll()
    request.log.info({ count: teams.length }, 'Teams fetched successfully')
    return teams
  } catch (error) {
    request.log.error(error, 'Failed to fetch teams')
    throw error
  }
})
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
// Log with structured data
request.log.info({
  userId: user.id,
  action: 'login',
  ip: request.ip
}, 'User logged in successfully')

// Produces:
// {
//   "correlationId": "...",
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
- `NODE_ENV`: Controls log format (development = pretty, production = JSON)

### Development Setup

```bash
# .env
LOG_LEVEL=debug
NODE_ENV=development
```

Pretty printed logs with colors:

```
[12:34:56 DEBUG] abc-123 Checking user permissions
[12:34:56 INFO] abc-123 User authenticated successfully
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
  fastify.addHook('onRequest', correlationIdHook)
}
```

**Rationale:**
1. Tests don't involve distributed systems requiring request tracing
2. The hook creates child loggers, which can interfere with the silent logger
3. Test requests are isolated and don't need correlation tracking
4. Simplifies test setup and reduces overhead

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

## Troubleshooting

### Logs not appearing

Check:
1. `LOG_LEVEL` environment variable is set correctly
2. You're using `request.log` not `console.log`
3. Test environment doesn't disable logging

### Correlation ID missing

Check:
1. Correlation ID middleware is registered (`correlationIdHook`)
2. You're using the logger from the request object
3. The hook runs before your route handlers

### Pretty printing not working

Check:
1. `NODE_ENV=development` is set
2. `pino-pretty` is installed (optional dependency)
3. Running in a TTY (terminal) not a pipe

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [Fastify Logging](https://www.fastify.io/docs/latest/Reference/Logging/)
- [12-Factor App: Logs](https://12factor.net/logs)
