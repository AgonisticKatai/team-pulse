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
├── types/          # Core domain types
│   └── index.ts
└── index.ts        # Main entry point
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
