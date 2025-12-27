import type { ColumnType, Insertable, Selectable, Updateable } from 'kysely'

/**
 * Kysely Database Schema (Type-Safe)
 *
 * Pure TypeScript schema definition for compile-time type safety.
 * This is the single source of truth for database types.
 *
 * Uses Kysely's type helpers:
 * - ColumnType: Handles different types for SELECT vs INSERT vs UPDATE
 * - Generated: For auto-generated columns (like auto-increment IDs, defaults)
 * - Selectable: Type for SELECT results
 * - Insertable: Type for INSERT operations
 * - Updateable: Type for UPDATE operations
 */

/**
 * Teams Table
 */
export interface TeamsTable {
  id: string
  name: string
  created_at: ColumnType<Date, Date | undefined, never>
  updated_at: ColumnType<Date, Date | undefined, Date>
}

export type Team = Selectable<TeamsTable>
export type NewTeam = Insertable<TeamsTable>
export type TeamUpdate = Updateable<TeamsTable>

/**
 * Users Table
 */
export interface UsersTable {
  id: string
  email: string
  password_hash: string
  role: 'admin' | 'guest' | 'super_admin'
  created_at: ColumnType<Date, Date | undefined, never>
  updated_at: ColumnType<Date, Date | undefined, Date>
}

export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>

/**
 * Refresh Tokens Table
 */
export interface RefreshTokensTable {
  id: string
  token: string
  user_id: string
  expires_at: Date
  created_at: ColumnType<Date, Date | undefined, never>
}

export type RefreshToken = Selectable<RefreshTokensTable>
export type NewRefreshToken = Insertable<RefreshTokensTable>
export type RefreshTokenUpdate = Updateable<RefreshTokensTable>

/**
 * Database Interface
 *
 * Central type definition for the entire database.
 * Kysely uses this to provide type-safe queries.
 */
export interface Database {
  teams: TeamsTable
  users: UsersTable
  refresh_tokens: RefreshTokensTable
}
