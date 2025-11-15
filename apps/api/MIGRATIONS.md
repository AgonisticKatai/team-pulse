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

### Production

**Always use migrations in production**:
1. Migrations are versioned and tracked
2. Changes are reversible
3. Migration history is preserved
4. Team members see the same schema evolution

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

The migration system gracefully handles this - it means your schema is already up-to-date (e.g., from using `db:push`).

### Migrations Not Running

Check:
1. `DATABASE_URL` environment variable is set
2. Database is accessible
3. Migration files exist in `drizzle/` directory
4. Check logs for "🔄 Running database migrations..."

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
