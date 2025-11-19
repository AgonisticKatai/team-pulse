import { Err, Ok, type Result } from '@team-pulse/shared'
import type { ISchemaReader } from '../domain/ISchemaReader.js'

/**
 * Explain Schema Relationships Use Case
 *
 * Explains relationships between tables in the database
 */
export class ExplainSchemaRelationshipsUseCase {
  private readonly schemaReader: ISchemaReader

  private constructor({ schemaReader }: { schemaReader: ISchemaReader }) {
    this.schemaReader = schemaReader
  }

  static create({ schemaReader }: { schemaReader: ISchemaReader }): ExplainSchemaRelationshipsUseCase {
    return new ExplainSchemaRelationshipsUseCase({ schemaReader })
  }

  async execute({ tableName }: { tableName?: string } = {}): Promise<Result<string, Error>> {
    const snapshotResult = await this.schemaReader.getLatestSnapshot()

    if (!snapshotResult.ok) {
      return snapshotResult
    }

    const snapshot = snapshotResult.value
    let output = 'Database Schema Relationships\n'
    output += '================================\n\n'

    const tables = tableName ? { [tableName]: snapshot.tables[tableName] } : snapshot.tables

    if (tableName && !tables[tableName]) {
      return Err(new Error(`Table '${tableName}' not found in schema`))
    }

    for (const [name, tableData] of Object.entries(tables)) {
      if (!tableData) continue

      output += `Table: ${name}\n`
      output += `${'='.repeat(name.length + 7)}\n`

      // Columns
      output += 'Columns:\n'
      for (const [, colData] of Object.entries(tableData.columns || {})) {
        output += `  - ${colData.name}: ${colData.type}\n`
      }

      // Foreign Keys
      if (tableData.foreignKeys && Object.keys(tableData.foreignKeys).length > 0) {
        output += '\nForeign Keys:\n'
        for (const [fkName, fkData] of Object.entries(tableData.foreignKeys)) {
          output += `  - ${fkName}: ${JSON.stringify(fkData)}\n`
        }
      }

      output += '\n'
    }

    return Ok(output)
  }
}
