import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Err, Ok, type Result } from '@team-pulse/shared'
import type { ISchemaReader, MigrationJournal, SchemaSnapshot, TableSchema } from '../domain/ISchemaReader.js'

/**
 * Drizzle Schema Reader (ADAPTER)
 *
 * This is an ADAPTER in Hexagonal Architecture:
 * - Implements the ISchemaReader PORT (defined in domain)
 * - Reads Drizzle meta files from filesystem
 * - Contains NO business logic (only file reading logic)
 *
 * Benefits:
 * 1. Domain layer doesn't know about filesystem
 * 2. Can swap for another schema source without touching domain/application
 * 3. Easy to test with mock readers
 * 4. Clear separation between business logic and data access
 */
export class DrizzleSchemaReader implements ISchemaReader {
  private readonly metaPath: string

  private constructor({ metaPath }: { metaPath: string }) {
    this.metaPath = metaPath
  }

  static create({ metaPath }: { metaPath: string }): DrizzleSchemaReader {
    return new DrizzleSchemaReader({ metaPath })
  }

  async getLatestSnapshot(): Promise<Result<SchemaSnapshot, Error>> {
    try {
      const files = await readdir(this.metaPath)
      const snapshotFiles = files
        .filter((f) => f.endsWith('_snapshot.json'))
        .sort()
        .reverse()

      if (snapshotFiles.length === 0) {
        return Err(new Error('No schema snapshots found'))
      }

      const latestSnapshot = snapshotFiles[0]
      if (!latestSnapshot) {
        return Err(new Error('No snapshot file found'))
      }

      const content = await readFile(join(this.metaPath, latestSnapshot), 'utf-8')
      const snapshot = JSON.parse(content) as SchemaSnapshot

      return Ok(snapshot)
    } catch (error) {
      return Err(new Error(`Failed to read schema snapshot: ${error instanceof Error ? error.message : String(error)}`))
    }
  }

  async getTableSchema({ tableName }: { tableName: string }): Promise<Result<TableSchema, Error>> {
    const snapshotResult = await this.getLatestSnapshot()

    if (!snapshotResult.ok) {
      return Err(snapshotResult.error)
    }

    const snapshot = snapshotResult.value
    const table = snapshot.tables[tableName]

    if (!table) {
      return Err(new Error(`Table '${tableName}' not found in schema`))
    }

    return Ok(table as TableSchema)
  }

  async getMigrationsHistory(): Promise<Result<MigrationJournal, Error>> {
    try {
      const journalPath = join(this.metaPath, '_journal.json')
      const content = await readFile(journalPath, 'utf-8')
      const journal = JSON.parse(content) as MigrationJournal

      return Ok(journal)
    } catch (error) {
      return Err(new Error(`Failed to read migrations history: ${error instanceof Error ? error.message : String(error)}`))
    }
  }
}
