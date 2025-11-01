import type { Config } from 'drizzle-kit'

export default {
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://teampulse:teampulse@localhost:5432/teampulse',
  },
  dialect: 'postgresql',
  out: './drizzle',
  schema: './src/infrastructure/database/schema.ts',
} satisfies Config
