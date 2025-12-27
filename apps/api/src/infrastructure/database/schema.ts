import { userRoleValues } from '@team-pulse/shared'
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Teams table schema
 *
 * Represents football teams in the system.
 * This is the infrastructure layer - the actual database schema.
 * The domain model (Team entity) is separate and independent.
 */
export const teams = pgTable(
  'teams',
  {
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // Single column indexes
    index('teams_name_idx').on(table.name),
    // Indexes for pagination and sorting
    index('teams_created_at_idx').on(table.createdAt.desc()),
  ],
)

/**
 * Users table schema
 *
 * Represents authenticated users in the system with role-based access control.
 * Roles are defined in userRoleValues from shared package
 */
export const users = pgTable(
  'users',
  {
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    email: text('email').notNull().unique(),
    id: text('id').primaryKey(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: userRoleValues }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    // Single column indexes
    index('users_role_idx').on(table.role),
    // Composite indexes for common query patterns
    index('users_role_created_at_idx').on(table.role, table.createdAt.desc()),
    // Indexes for pagination and sorting
    index('users_created_at_idx').on(table.createdAt.desc()),
  ],
)

/**
 * Refresh tokens table schema
 *
 * Stores refresh tokens for JWT authentication.
 * Tokens are invalidated on logout or when they expire.
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    createdAt: timestamp('created_at', { mode: 'date' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    // Single column indexes
    index('refresh_tokens_user_id_idx').on(table.userId),
    index('refresh_tokens_expires_at_idx').on(table.expiresAt),
    // Composite indexes for common query patterns
    // Optimizes: Finding valid tokens for a user & cleanup of expired tokens by user
    index('refresh_tokens_user_id_expires_at_idx').on(table.userId, table.expiresAt),
  ],
)

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
