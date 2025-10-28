import type { Config } from 'drizzle-kit'

export default {
  schema: './src/infrastructure/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://teampulse:teampulse@localhost:5432/teampulse',
  },
} satisfies Config
