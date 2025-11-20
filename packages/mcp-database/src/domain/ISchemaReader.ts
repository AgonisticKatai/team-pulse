import type { Result } from '@team-pulse/shared/result'

/**
 * Schema Snapshot Interface
 *
 * Represents a Drizzle schema snapshot structure
 */
export interface SchemaSnapshot {
  dialect: string
  enums: Record<string, unknown>
  schemas: Record<string, unknown>
  tables: Record<string, TableSchema>
  version: string
}

/**
 * Table Schema Interface
 */
export interface TableSchema {
  columns: Record<string, ColumnSchema>
  foreignKeys?: Record<string, ForeignKeyData>
  indexes?: Record<string, unknown>
  name: string
  schema: string
}

/**
 * Foreign Key Data Interface
 */
export interface ForeignKeyData {
  columnsFrom: string[]
  columnsTo: string[]
  name: string
  onDelete?: string
  onUpdate?: string
  tableFrom: string
  tableTo: string
}

/**
 * Column Schema Interface
 */
export interface ColumnSchema {
  name: string
  notNull: boolean
  primaryKey: boolean
  type: string
}

/**
 * Migration Journal Entry
 */
export interface MigrationEntry {
  breakpoints: boolean
  idx: number
  tag: string
  version: string
  when: number
}

/**
 * Migration Journal
 */
export interface MigrationJournal {
  dialect: string
  entries: MigrationEntry[]
  version: string
}

/**
 * Schema Reader Port
 *
 * Defines the contract for reading database schema information
 * This is a PORT in hexagonal architecture
 */
export interface ISchemaReader {
  /**
   * Get the latest schema snapshot
   */
  getLatestSnapshot(): Promise<Result<SchemaSnapshot, Error>>

  /**
   * Get schema for a specific table
   */
  getTableSchema(params: { tableName: string }): Promise<Result<TableSchema, Error>>

  /**
   * Get migrations history
   */
  getMigrationsHistory(): Promise<Result<MigrationJournal, Error>>
}
