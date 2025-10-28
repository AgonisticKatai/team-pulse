import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/**
 * Run database migrations
 *
 * Used in tests to setup PostgreSQL schema before running tests
 */
export async function runMigrations(dbUrl: string) {
  const client = postgres(dbUrl, { max: 1 })
  const db = drizzle(client)

  await migrate(db, { migrationsFolder: './drizzle' })

  await client.end()
}

// CLI usage: tsx src/infrastructure/database/migrate.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
  console.log('Running migrations on:', dbUrl)
  await runMigrations(dbUrl)
  console.log('Migrations completed')
  process.exit(0)
}
