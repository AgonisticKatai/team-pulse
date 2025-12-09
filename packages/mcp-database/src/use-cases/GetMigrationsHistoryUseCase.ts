import type { Result } from '@team-pulse/shared'
import type { ISchemaReader } from '../domain/ISchemaReader.js'

/**
 * Get Migrations History Use Case
 *
 * Gets the history of database migrations
 */
export class GetMigrationsHistoryUseCase {
  private readonly schemaReader: ISchemaReader

  private constructor({ schemaReader }: { schemaReader: ISchemaReader }) {
    this.schemaReader = schemaReader
  }

  static create({ schemaReader }: { schemaReader: ISchemaReader }): GetMigrationsHistoryUseCase {
    return new GetMigrationsHistoryUseCase({ schemaReader })
  }

  async execute(): Promise<Result<string, Error>> {
    const journalResult = await this.schemaReader.getMigrationsHistory()

    if (!journalResult.ok) {
      return journalResult
    }

    const journal = journalResult.value

    let output = 'Database Migrations History\n'
    output += '============================\n\n'

    if (journal.entries && Array.isArray(journal.entries)) {
      for (const entry of journal.entries) {
        output += `Migration: ${entry.idx}\n`
        output += `  Tag: ${entry.tag}\n`
        output += `  When: ${entry.when}\n`
        output += `  Breakpoints: ${entry.breakpoints}\n\n`
      }
    }

    return { ok: true, value: output }
  }
}
