import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Teams table schema
 *
 * Represents football teams in the system.
 * This is the infrastructure layer - the actual database schema.
 * The domain model (Team entity) is separate and independent.
 */
export const teams = pgTable('teams', {
  city: text('city').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  foundedYear: integer('founded_year'),
  id: text('id').primaryKey(),
  name: text('name').notNull(),
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
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  email: text('email').notNull().unique(),
  id: text('id').primaryKey(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // 'SUPER_ADMIN' | 'ADMIN' | 'USER'
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
  createdAt: timestamp('created_at', { mode: 'date' })
    .notNull()
    .$defaultFn(() => new Date()),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
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
