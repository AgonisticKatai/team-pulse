# Database Migrations Guide

This project uses **Drizzle ORM** for database migrations with a versioned migration system.

## Migration Workflow

### 1. Make Schema Changes

Edit the schema in `src/infrastructure/database/schema.ts`:

```typescript
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  // Add new fields here
})
```

### 2. Generate Migration Files

After changing the schema, generate a new migration file:

```bash
npm run db:generate
```

This creates a new SQL migration file in `drizzle/` with a timestamp and random name (e.g., `0001_messy_mother_askani.sql`).

### 3. Review the Migration

Check the generated SQL file in `drizzle/` to ensure it matches your intended changes:

```sql
-- Example migration file
CREATE TABLE "new_table" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL
);
```

### 4. Apply Migrations

Migrations run **automatically** when the application starts. You can also run them manually:

```bash
npm run db:migrate:run
```

## Migration Files

Current migrations:
- `0000_easy_madame_hydra.sql` - Creates teams table
- `0001_messy_mother_askani.sql` - Creates users and refresh_tokens tables

## How It Works

### Automatic Migrations

When the app starts (via `buildApp()`), it:
1. Connects to the database
2. Runs all pending migrations from `drizzle/`
3. Tracks applied migrations in the `__drizzle_migrations` table
4. Gracefully handles already-existing schemas

**Exception: Test Environment**
```typescript
// In buildApp()
if (!(env.NODE_ENV === 'test' && process.env.SKIP_MIGRATIONS === 'true')) {
  await runMigrations(env.DATABASE_URL)
}
```

- Tests that use `testcontainers` set `SKIP_MIGRATIONS=true` because they use `db:push` instead
- Tests using shared database (`app.test.ts`) keep migrations enabled (`SKIP_MIGRATIONS=false`)

### Manual Migrations

Use the standalone script for manual migration control:

```bash
npm run db:migrate:run
```

## Development vs Production

### Development

During development, you can use either:
- **Migrations** (recommended): `npm run db:generate && npm run db:migrate:run`
- **Schema Push** (faster): `npm run db:push` - directly syncs schema to DB without migration files

### Test Environment

**Two approaches:**

1. **Testcontainers** (integration tests with isolated databases):
   ```typescript
   // Uses db:push for fast schema creation
   process.env.SKIP_MIGRATIONS = 'true'
   const { db, container } = await setupTestContainer()
   ```
   - Each test suite gets an isolated PostgreSQL container
   - Schema created via `db:push` (faster than migrations)
   - No migration files needed
   - Parallel test execution supported

2. **Shared Database** (basic app tests):
   ```typescript
   // Uses migrations for consistent schema
   process.env.SKIP_MIGRATIONS = 'false'
   const { app } = await buildApp()
   ```
   - Tests share a single database
   - Migrations ensure schema consistency
   - Slower but simpler setup

### Production

**Always use migrations in production**:
1. Migrations are versioned and tracked
2. Changes are reversible
3. Migration history is preserved
4. Team members see the same schema evolution

**Build Process**:
- TypeScript compilation: `tsc`
- Migration files copied: `scripts/copy-migrations.sh`
- Files copied from `drizzle/` to `dist/drizzle/`
- Includes both `.sql` and `.json` files (including `meta/_journal.json`)

**Path Resolution**:
- Migrations use absolute paths from compiled code location
- `migrate.ts` resolves from `dist/infrastructure/database/` to `dist/drizzle/`
- Works in both local builds and serverless environments (Vercel)

**Vercel Deployment**:
- Build command: `turbo build` (runs `tsc && bash scripts/copy-migrations.sh`)
- Function includes: `apps/api/dist/drizzle/**/*.{sql,json}` via `vercel.json`
- Migration files must be in `dist/` folder for serverless function access

## Common Tasks

### Create a New Migration

```bash
# 1. Edit schema.ts
# 2. Generate migration
npm run db:generate
# 3. Review generated SQL in drizzle/
# 4. Migrations run automatically on next app start
```

### Reset Database (Development Only)

```bash
# Drop all tables and re-run migrations
# WARNING: This deletes all data!
npm run db:push -- --force
```

### View Database in Drizzle Studio

```bash
npm run db:studio
```

Opens a visual database browser at http://localhost:4983

## Migration Best Practices

1. **Never edit generated migration files** - they're tracked by hash
2. **One logical change per migration** - easier to review and rollback
3. **Test migrations on staging** before production
4. **Review SQL before applying** - ensure it's safe
5. **Backup production data** before major schema changes

## Troubleshooting

### "relation already exists" Error

The migration system gracefully handles this - it means your schema is already up-to-date (e.g., from using `db:push` or running migrations multiple times).

You'll see notices like:
```
NOTICE: schema "drizzle" already exists, skipping
NOTICE: relation "__drizzle_migrations" already exists, skipping
ℹ️  Database schema already exists (skipping migrations)
```

This is **normal behavior** and not an error - the migration system detects existing schema and skips gracefully.

### Migrations Not Running

Check:
1. `DATABASE_URL` environment variable is set
2. Database is accessible
3. Migration files exist in `drizzle/` directory
4. Check logs for "🔄 Running database migrations..."
5. In tests with testcontainers, verify `SKIP_MIGRATIONS` is set correctly

### Migration Failed

Check the error message and:
1. Review the failing SQL in `drizzle/XXX.sql`
2. Check database permissions
3. Verify schema changes are valid
4. Check for conflicting table/column names

## Scripts Reference

- `npm run db:generate` - Generate new migration from schema changes
- `npm run db:migrate` - (Drizzle CLI) Apply migrations
- `npm run db:migrate:run` - (Programmatic) Apply migrations via Node script
- `npm run db:push` - Push schema directly without migrations (dev only)
- `npm run db:studio` - Open Drizzle Studio database browser
- `npm run db:seed` - Seed database with initial data
