import { Err, Ok, type Result } from '@team-pulse/shared/result'
import type { ColumnSchema, ForeignKeyData, ISchemaReader, TableSchema } from '../domain/ISchemaReader.js'

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
      output += this.formatTable(name, tableData)
    }

    return Ok(output)
  }

  private formatTable(name: string, tableData: TableSchema): string {
    let output = `Table: ${name}\n`
    output += `${'='.repeat(name.length + 7)}\n`
    output += this.formatColumns(tableData.columns)
    output += this.formatForeignKeys(tableData.foreignKeys)
    output += '\n'
    return output
  }

  private formatColumns(columns: Record<string, ColumnSchema>): string {
    let output = 'Columns:\n'
    for (const [, colData] of Object.entries(columns || {})) {
      output += `  - ${colData.name}: ${colData.type}\n`
    }
    return output
  }

  private formatForeignKeys(foreignKeys: Record<string, ForeignKeyData> | undefined): string {
    if (!foreignKeys || Object.keys(foreignKeys).length === 0) {
      return ''
    }

    let output = '\nForeign Keys:\n'
    for (const [fkName, fkData] of Object.entries(foreignKeys)) {
      output += `  - ${fkName}: ${JSON.stringify(fkData)}\n`
    }
    return output
  }
}
