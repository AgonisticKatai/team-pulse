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
 * Users table schema
 *
 * Represents authenticated users in the system with role-based access control.
 * Roles: SUPER_ADMIN, ADMIN, USER
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'SUPER_ADMIN' | 'ADMIN' | 'USER'
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * Refresh tokens table schema
 *
 * Stores refresh tokens for JWT authentication.
 * Tokens are invalidated on logout or when they expire.
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
})

/**
 * Type inference from schema
 * These types represent database rows, NOT domain entities
 */
export type TeamRow = typeof teams.$inferSelect
export type NewTeamRow = typeof teams.$inferInsert

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert

export type RefreshTokenRow = typeof refreshTokens.$inferSelect
export type NewRefreshTokenRow = typeof refreshTokens.$inferInsert
