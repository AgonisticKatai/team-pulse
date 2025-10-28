import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Teams table schema
 *
 * Represents football teams in the system.
 * This is the infrastructure layer - the actual database schema.
 * The domain model (Team entity) is separate and independent.
 */
export const teams = pgTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  foundedYear: integer('founded_year'),
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * Type inference from schema
 * These types represent database rows, NOT domain entities
 */
export type TeamRow = typeof teams.$inferSelect
export type NewTeamRow = typeof teams.$inferInsert
