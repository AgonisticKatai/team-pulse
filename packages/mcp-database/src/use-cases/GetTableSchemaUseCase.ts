import type { Result } from '@team-pulse/shared'
import type { ISchemaReader } from '../domain/ISchemaReader.js'

/**
 * Get Table Schema Use Case
 *
 * Gets detailed schema information for a specific table
 */
export class GetTableSchemaUseCase {
  private readonly schemaReader: ISchemaReader

  private constructor({ schemaReader }: { schemaReader: ISchemaReader }) {
    this.schemaReader = schemaReader
  }

  static create({ schemaReader }: { schemaReader: ISchemaReader }): GetTableSchemaUseCase {
    return new GetTableSchemaUseCase({ schemaReader })
  }

  async execute({ tableName }: { tableName: string }): Promise<Result<string, Error>> {
    const tableResult = await this.schemaReader.getTableSchema({ tableName })

    if (!tableResult.ok) {
      return tableResult
    }

    const output = `Schema for table '${tableName}':\n\n${JSON.stringify(tableResult.value, null, 2)}`
    return { ok: true, value: output }
  }
}
