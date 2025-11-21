#!/usr/bin/env node
import { resolve } from 'node:path'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, type Tool } from '@modelcontextprotocol/sdk/types.js'
import { NodeCommandExecutor } from './adapters/NodeCommandExecutor.js'
import { TeamPulseTestPatternProvider } from './adapters/TeamPulseTestPatternProvider.js'
import type { TestPatternCategory } from './domain/ITestPatternProvider.js'
import type { CoveragePackageTarget } from './use-cases/GetTestCoverageUseCase.js'
import { GetTestCoverageUseCase } from './use-cases/GetTestCoverageUseCase.js'
import { GetTestPatternsUseCase } from './use-cases/GetTestPatternsUseCase.js'
import type { LintPackageTarget } from './use-cases/LintCheckUseCase.js'
import { LintCheckUseCase } from './use-cases/LintCheckUseCase.js'
import type { PackageTarget } from './use-cases/RunTestsUseCase.js'
import { RunTestsUseCase } from './use-cases/RunTestsUseCase.js'

/**
 * TeamPulse Testing MCP Server
 *
 * MCP server entry point following hexagonal architecture:
 * - Creates adapters (NodeCommandExecutor, TeamPulseTestPatternProvider)
 * - Wires dependencies into use cases
 * - Sets up MCP server handlers
 * - No business logic here, just composition and routing
 */
class TestingMCPServer {
  private server: Server
  private runTestsUseCase: RunTestsUseCase
  private getTestCoverageUseCase: GetTestCoverageUseCase
  private getTestPatternsUseCase: GetTestPatternsUseCase
  private lintCheckUseCase: LintCheckUseCase

  constructor() {
    // Initialize MCP server
    this.server = new Server(
      {
        name: 'team-pulse-testing',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    )

    // Setup workspace root
    const workspaceRoot = resolve(process.cwd(), '../..')

    // Create adapters (infrastructure layer)
    const commandExecutor = NodeCommandExecutor.create({ defaultCwd: workspaceRoot })
    const patternProvider = TeamPulseTestPatternProvider.create()

    // Create use cases with dependency injection
    this.runTestsUseCase = RunTestsUseCase.create({ commandExecutor })
    this.getTestCoverageUseCase = GetTestCoverageUseCase.create({ commandExecutor })
    this.getTestPatternsUseCase = GetTestPatternsUseCase.create({ patternProvider })
    this.lintCheckUseCase = LintCheckUseCase.create({ commandExecutor })

    this.setupHandlers()
  }

  protected setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'run-tests',
          description: 'Run tests for a specific package or all tests in the workspace',
          inputSchema: {
            type: 'object',
            properties: {
              package: {
                type: 'string',
                enum: ['api', 'web', 'shared', 'all'],
                description: 'Which package to run tests for',
                default: 'all',
              },
              filter: {
                type: 'string',
                description: 'Optional filter to run specific test files or suites',
              },
            },
          },
        },
        {
          name: 'get-test-coverage',
          description: 'Get test coverage report for a specific package',
          inputSchema: {
            type: 'object',
            properties: {
              package: {
                type: 'string',
                enum: ['api', 'web', 'shared'],
                description: 'Which package to get coverage for',
              },
            },
            required: ['package'],
          },
        },
        {
          name: 'get-test-patterns',
          description: 'Get information about testing patterns and best practices used in TeamPulse',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['all', 'unit-tests', 'integration-tests', 'test-data', 'mocking'],
                description: 'Category of testing patterns to retrieve',
                default: 'all',
              },
            },
          },
        },
        {
          name: 'lint-check',
          description: 'Run lint checks on a specific package',
          inputSchema: {
            type: 'object',
            properties: {
              package: {
                type: 'string',
                enum: ['api', 'web', 'shared', 'all'],
                description: 'Which package to lint',
                default: 'all',
              },
              fix: {
                type: 'boolean',
                description: 'Automatically fix linting issues',
                default: false,
              },
            },
          },
        },
      ] satisfies Tool[],
    }))

    // biome-ignore lint/suspicious/noExplicitAny: MCP SDK types are not fully typed
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      try {
        switch (request.params.name) {
          case 'run-tests':
            return await this.handleRunTests(request.params.arguments)

          case 'get-test-coverage':
            return await this.handleGetTestCoverage(request.params.arguments)

          case 'get-test-patterns':
            return this.handleGetTestPatterns(request.params.arguments)

          case 'lint-check':
            return await this.handleLintCheck(request.params.arguments)

          default:
            throw new Error(`Unknown tool: ${request.params.name}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        }
      }
    })
  }

  // biome-ignore lint/suspicious/noExplicitAny: MCP arguments are not fully typed
  private async handleRunTests(args: any) {
    const pkg = (args?.package as PackageTarget) || 'all'
    const filter = args?.filter as string | undefined

    const result = await this.runTestsUseCase.execute({ pkg, filter })

    if (!result.ok) {
      return {
        content: [{ type: 'text' as const, text: result.error.message }],
        isError: true,
      }
    }

    return {
      content: [{ type: 'text' as const, text: result.value }],
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: MCP arguments are not fully typed
  private async handleGetTestCoverage(args: any) {
    const pkg = args?.package as CoveragePackageTarget

    if (!pkg) {
      return {
        content: [{ type: 'text' as const, text: 'Error: package parameter is required' }],
        isError: true,
      }
    }

    const result = await this.getTestCoverageUseCase.execute({ pkg })

    if (!result.ok) {
      return {
        content: [{ type: 'text' as const, text: result.error.message }],
        isError: true,
      }
    }

    return {
      content: [{ type: 'text' as const, text: result.value }],
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: MCP arguments are not fully typed
  private handleGetTestPatterns(args: any) {
    const category = (args?.category as TestPatternCategory) || 'all'

    const result = this.getTestPatternsUseCase.execute({ category })

    if (!result.ok) {
      return {
        content: [{ type: 'text' as const, text: result.error.message }],
        isError: true,
      }
    }

    return {
      content: [{ type: 'text' as const, text: result.value }],
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: MCP arguments are not fully typed
  private async handleLintCheck(args: any) {
    const pkg = (args?.package as LintPackageTarget) || 'all'
    const fix = Boolean(args?.fix)

    const result = await this.lintCheckUseCase.execute({ pkg, fix })

    if (!result.ok) {
      return {
        content: [{ type: 'text' as const, text: result.error.message }],
        isError: true,
      }
    }

    return {
      content: [{ type: 'text' as const, text: result.value }],
    }
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.server.connect(transport)
    // biome-ignore lint/suspicious/noConsole: MCP server needs to log to stderr
    console.error('TeamPulse Testing MCP server running on stdio')
  }
}

const server = new TestingMCPServer()
server.run().catch((error) => {
  // biome-ignore lint/suspicious/noConsole: MCP server needs to log errors to stderr
  console.error('Fatal error:', error)
  process.exit(1)
})
