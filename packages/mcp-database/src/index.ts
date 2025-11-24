#!/usr/bin/env node
import { resolve } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { DrizzleSchemaReader } from './adapters/DrizzleSchemaReader.js'
import { ExplainSchemaRelationshipsUseCase } from './use-cases/ExplainSchemaRelationshipsUseCase.js'
import { GetDatabaseSchemaUseCase, type SchemaFormat } from './use-cases/GetDatabaseSchemaUseCase.js'
import { GetMigrationsHistoryUseCase } from './use-cases/GetMigrationsHistoryUseCase.js'
import { GetTableSchemaUseCase } from './use-cases/GetTableSchemaUseCase.js'

/**
 * Database Schema MCP Server
 *
 * This is the ENTRY POINT / INFRASTRUCTURE LAYER:
 * - Sets up the MCP server using the new McpServer API with Zod schemas
 * - Wires up dependencies (DI)
 * - Handles MCP protocol communication
 * - Delegates to use cases for business logic
 *
 * Architecture:
 * Infrastructure (this) → Application (use cases) → Domain (interfaces) → Adapters (implementations)
 */
class DatabaseSchemaMCPServer {
  private mcpServer: McpServer
  private getDatabaseSchemaUseCase: GetDatabaseSchemaUseCase
  private getTableSchemaUseCase: GetTableSchemaUseCase
  private getMigrationsHistoryUseCase: GetMigrationsHistoryUseCase
  private explainSchemaRelationshipsUseCase: ExplainSchemaRelationshipsUseCase

  private constructor() {
    // Initialize MCP Server using the high-level McpServer API
    this.mcpServer = new McpServer(
      {
        name: 'team-pulse-database',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    )

    // Dependency Injection: Wire up adapters and use cases
    const metaPath = resolve(process.cwd(), '../../apps/api/drizzle/meta')
    const schemaReader = DrizzleSchemaReader.create({ metaPath })

    this.getDatabaseSchemaUseCase = GetDatabaseSchemaUseCase.create({
      schemaReader,
    })
    this.getTableSchemaUseCase = GetTableSchemaUseCase.create({
      schemaReader,
    })
    this.getMigrationsHistoryUseCase = GetMigrationsHistoryUseCase.create({
      schemaReader,
    })
    this.explainSchemaRelationshipsUseCase = ExplainSchemaRelationshipsUseCase.create({
      schemaReader,
    })

    this.setupHandlers()
  }

  static create(): DatabaseSchemaMCPServer {
    return new DatabaseSchemaMCPServer()
  }

  private setupHandlers(): void {
    // Register get-database-schema tool with Zod schema
    this.mcpServer.registerTool(
      'get-database-schema',
      {
        description: 'Get the complete TeamPulse database schema including all tables, columns, relations, and types',
        inputSchema: {
          format: z.enum(['full', 'summary', 'tables-only']).optional(),
        },
      },
      async (args: { format?: string }) => {
        const format = (args.format || 'full') as SchemaFormat
        const result = await this.getDatabaseSchemaUseCase.execute({ format })

        if (!result.ok) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${result.error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text' as const, text: result.value }],
        }
      },
    )

    // Register get-table-schema tool with Zod schema
    this.mcpServer.registerTool(
      'get-table-schema',
      {
        description: 'Get detailed schema information for a specific table',
        inputSchema: {
          tableName: z.string(),
        },
      },
      async (args: { tableName: string }) => {
        const tableName = args.tableName as string
        const result = await this.getTableSchemaUseCase.execute({ tableName })

        if (!result.ok) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${result.error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text' as const, text: result.value }],
        }
      },
    )

    // Register get-migrations-history tool (no parameters needed)
    this.mcpServer.registerTool(
      'get-migrations-history',
      {
        description: 'Get the history of database migrations with details about each migration',
      },
      async () => {
        const result = await this.getMigrationsHistoryUseCase.execute()

        if (!result.ok) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${result.error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text' as const, text: result.value }],
        }
      },
    )

    // Register explain-schema-relationships tool with Zod schema
    this.mcpServer.registerTool(
      'explain-schema-relationships',
      {
        description: 'Explain the relationships between tables in the database schema',
        inputSchema: {
          tableName: z.string().optional(),
        },
      },
      async (args: { tableName?: string }) => {
        const tableName = args.tableName as string | undefined
        const result = await this.explainSchemaRelationshipsUseCase.execute({ tableName })

        if (!result.ok) {
          return {
            content: [{ type: 'text' as const, text: `Error: ${result.error.message}` }],
            isError: true,
          }
        }

        return {
          content: [{ type: 'text' as const, text: result.value }],
        }
      },
    )
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.mcpServer.server.connect(transport)
  }
}

// Entry point
const server = DatabaseSchemaMCPServer.create()
server.run()
