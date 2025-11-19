#!/usr/bin/env node
import { resolve } from 'node:path'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js'
import { DrizzleSchemaReader } from './adapters/DrizzleSchemaReader.js'
import { ExplainSchemaRelationshipsUseCase } from './use-cases/ExplainSchemaRelationshipsUseCase.js'
import { GetDatabaseSchemaUseCase, type SchemaFormat } from './use-cases/GetDatabaseSchemaUseCase.js'
import { GetMigrationsHistoryUseCase } from './use-cases/GetMigrationsHistoryUseCase.js'
import { GetTableSchemaUseCase } from './use-cases/GetTableSchemaUseCase.js'

/**
 * Database Schema MCP Server
 *
 * This is the ENTRY POINT / INFRASTRUCTURE LAYER:
 * - Sets up the MCP server
 * - Wires up dependencies (DI)
 * - Handles MCP protocol communication
 * - Delegates to use cases for business logic
 *
 * Architecture:
 * Infrastructure (this) → Application (use cases) → Domain (interfaces) → Adapters (implementations)
 */
class DatabaseSchemaMCPServer {
  private server: Server
  private getDatabaseSchemaUseCase: GetDatabaseSchemaUseCase
  private getTableSchemaUseCase: GetTableSchemaUseCase
  private getMigrationsHistoryUseCase: GetMigrationsHistoryUseCase
  private explainSchemaRelationshipsUseCase: ExplainSchemaRelationshipsUseCase

  private constructor() {
    // Initialize MCP Server
    this.server = new Server(
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get-database-schema',
          description: 'Get the complete TeamPulse database schema including all tables, columns, relations, and types',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                enum: ['full', 'summary', 'tables-only'],
                description: 'Output format: full (complete schema), summary (table names and counts), tables-only (just table structures)',
                default: 'full',
              },
            },
          },
        },
        {
          name: 'get-table-schema',
          description: 'Get detailed schema information for a specific table',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Name of the table to retrieve schema for',
              },
            },
            required: ['tableName'],
          },
        },
        {
          name: 'get-migrations-history',
          description: 'Get the history of database migrations with details about each migration',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'explain-schema-relationships',
          description: 'Explain the relationships between tables in the database schema',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: {
                type: 'string',
                description: 'Optional: focus on relationships for a specific table',
              },
            },
          },
        },
      ] satisfies Tool[],
    }))

    // Handle tool calls
    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK types are not fully typed
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      try {
        switch (request.params.name) {
          case 'get-database-schema': {
            const format = (request.params.arguments?.format || 'full') as SchemaFormat
            const result = await this.getDatabaseSchemaUseCase.execute({
              format,
            })

            if (!result.ok) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Error: ${result.error.message}`,
                  },
                ],
                isError: true,
              }
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text: result.value,
                },
              ],
            }
          }

          case 'get-table-schema': {
            const tableName = request.params.arguments?.tableName as string
            if (!tableName) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: 'Error: tableName is required',
                  },
                ],
                isError: true,
              }
            }

            const result = await this.getTableSchemaUseCase.execute({
              tableName,
            })

            if (!result.ok) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Error: ${result.error.message}`,
                  },
                ],
                isError: true,
              }
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text: result.value,
                },
              ],
            }
          }

          case 'get-migrations-history': {
            const result = await this.getMigrationsHistoryUseCase.execute()

            if (!result.ok) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Error: ${result.error.message}`,
                  },
                ],
                isError: true,
              }
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text: result.value,
                },
              ],
            }
          }

          case 'explain-schema-relationships': {
            const tableName = request.params.arguments?.tableName as string | undefined
            const result = await this.explainSchemaRelationshipsUseCase.execute({
              tableName,
            })

            if (!result.ok) {
              return {
                content: [
                  {
                    type: 'text' as const,
                    text: `Error: ${result.error.message}`,
                  },
                ],
                isError: true,
              }
            }

            return {
              content: [
                {
                  type: 'text' as const,
                  text: result.value,
                },
              ],
            }
          }

          default:
            return {
              content: [
                {
                  type: 'text' as const,
                  text: `Error: Unknown tool: ${request.params.name}`,
                },
              ],
              isError: true,
            }
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    })
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    // biome-ignore lint/suspicious/noConsole: MCP server needs to log to stderr
    console.error('TeamPulse Database Schema MCP server running on stdio')
  }
}

// Entry point
const server = DatabaseSchemaMCPServer.create()
server.run().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: MCP server needs to log errors to stderr
  console.error('Fatal error:', error)
  process.exit(1)
})
