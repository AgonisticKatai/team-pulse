import type { Config } from 'drizzle-kit'

export default {
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/teampulse.db',
  },
} satisfies Config
