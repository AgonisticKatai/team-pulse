import { Ok, type Result } from '@team-pulse/shared/result'
import type { ISchemaReader, SchemaSnapshot } from '../domain/ISchemaReader.js'

export type SchemaFormat = 'full' | 'summary' | 'tables-only'

/**
 * Get Database Schema Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Orchestrates schema reading and formatting
 * - Contains application-specific logic
 * - Maps between different output formats
 *
 * Responsibilities:
 * 1. Read latest schema snapshot
 * 2. Format according to requested format
 * 3. Return formatted output
 */
export class GetDatabaseSchemaUseCase {
  private readonly schemaReader: ISchemaReader

  private constructor({ schemaReader }: { schemaReader: ISchemaReader }) {
    this.schemaReader = schemaReader
  }

  static create({ schemaReader }: { schemaReader: ISchemaReader }): GetDatabaseSchemaUseCase {
    return new GetDatabaseSchemaUseCase({ schemaReader })
  }

  async execute({ format = 'full' }: { format?: SchemaFormat } = {}): Promise<Result<string, Error>> {
    const snapshotResult = await this.schemaReader.getLatestSnapshot()

    if (!snapshotResult.ok) {
      return snapshotResult
    }

    const snapshot = snapshotResult.value

    switch (format) {
      case 'summary':
        return Ok(this.formatSummary({ snapshot }))
      case 'tables-only':
        return Ok(this.formatTablesOnly({ snapshot }))
      case 'full':
      default:
        return Ok(JSON.stringify(snapshot, null, 2))
    }
  }

  private formatSummary({ snapshot }: { snapshot: SchemaSnapshot }): string {
    const tableCount = Object.keys(snapshot.tables).length
    const enumCount = Object.keys(snapshot.enums || {}).length

    let summary = 'TeamPulse Database Schema Summary\n'
    summary += '=====================================\n\n'
    summary += `Dialect: ${snapshot.dialect}\n`
    summary += `Version: ${snapshot.version}\n`
    summary += `Tables: ${tableCount}\n`
    summary += `Enums: ${enumCount}\n\n`
    summary += 'Tables:\n'

    for (const [tableName, tableData] of Object.entries(snapshot.tables)) {
      const columnCount = Object.keys(tableData.columns || {}).length
      summary += `  - ${tableName} (${columnCount} columns)\n`
    }

    return summary
  }

  private formatTablesOnly({ snapshot }: { snapshot: SchemaSnapshot }): string {
    return JSON.stringify(snapshot.tables, null, 2)
  }
}
