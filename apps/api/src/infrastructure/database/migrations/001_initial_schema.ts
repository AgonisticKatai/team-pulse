import type { Kysely } from 'kysely'
import { sql } from 'kysely'

/**
 * Initial Database Schema Migration
 *
 * Creates the foundational tables for the Team Pulse application:
 * - teams: Football teams
 * - users: Authenticated users with role-based access control
 * - refresh_tokens: JWT refresh tokens for authentication
 *
 * Pure TypeScript migration - no SQL files, full type safety.
 */

export async function up(db: Kysely<any>): Promise<void> {
  // Create teams table
  await db.schema
    .createTable('teams')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()

  // Create indexes for teams
  await db.schema.createIndex('teams_name_idx').on('teams').column('name').execute()

  await db.schema.createIndex('teams_created_at_idx').on('teams').column('created_at').execute()

  // Create users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('role', 'text', (col) => col.notNull().check(sql`role IN ('admin', 'guest', 'super_admin')`))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()

  // Create indexes for users
  await db.schema.createIndex('users_role_idx').on('users').column('role').execute()

  await db.schema.createIndex('users_role_created_at_idx').on('users').columns(['role', 'created_at']).execute()

  await db.schema.createIndex('users_created_at_idx').on('users').column('created_at').execute()

  // Create refresh_tokens table
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('token', 'text', (col) => col.notNull().unique())
    .addColumn('user_id', 'text', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`now()`))
    .execute()

  // Create indexes for refresh_tokens
  await db.schema.createIndex('refresh_tokens_user_id_idx').on('refresh_tokens').column('user_id').execute()

  await db.schema.createIndex('refresh_tokens_expires_at_idx').on('refresh_tokens').column('expires_at').execute()

  await db.schema
    .createIndex('refresh_tokens_user_id_expires_at_idx')
    .on('refresh_tokens')
    .columns(['user_id', 'expires_at'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('refresh_tokens').execute()
  await db.schema.dropTable('users').execute()
  await db.schema.dropTable('teams').execute()
}
