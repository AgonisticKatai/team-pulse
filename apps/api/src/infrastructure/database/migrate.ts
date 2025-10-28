import postgres from 'postgres'

/**
 * Run database migrations
 *
 * Creates tables in PostgreSQL using raw SQL.
 * This avoids SQLite-specific SQL migration files and ensures compatibility.
 */
export async function runMigrations(dbUrl: string) {
  const client = postgres(dbUrl, { max: 1 })

  // Create teams table
  await client`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL,
      founded_year INTEGER,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    )
  `

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
