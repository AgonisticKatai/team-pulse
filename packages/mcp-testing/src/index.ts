#!/usr/bin/env node
import { resolve } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { NodeCommandExecutor } from './adapters/NodeCommandExecutor.js'
import { TeamPulseTestPatternProvider } from './adapters/TeamPulseTestPatternProvider.js'
import { GetTestCoverageUseCase } from './use-cases/GetTestCoverageUseCase.js'
import { GetTestPatternsUseCase } from './use-cases/GetTestPatternsUseCase.js'
import { LintCheckUseCase } from './use-cases/LintCheckUseCase.js'
import { RunTestsUseCase } from './use-cases/RunTestsUseCase.js'

class TestingMCPServer {
  private mcpServer: McpServer
  private runTestsUseCase: RunTestsUseCase
  private getTestCoverageUseCase: GetTestCoverageUseCase
  private getTestPatternsUseCase: GetTestPatternsUseCase
  private lintCheckUseCase: LintCheckUseCase

  constructor() {
    this.mcpServer = new McpServer(
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

    const workspaceRoot = resolve(process.cwd(), '../..')
    const commandExecutor = NodeCommandExecutor.create({ defaultCwd: workspaceRoot })
    const patternProvider = TeamPulseTestPatternProvider.create()

    this.runTestsUseCase = RunTestsUseCase.create({ commandExecutor })
    this.getTestCoverageUseCase = GetTestCoverageUseCase.create({ commandExecutor })
    this.getTestPatternsUseCase = GetTestPatternsUseCase.create({ patternProvider })
    this.lintCheckUseCase = LintCheckUseCase.create({ commandExecutor })

    this.setupHandlers()
  }

  protected setupHandlers() {
    // ✅ CORRECTO: Raw shape sin z.object()
    this.mcpServer.registerTool(
      'run-tests',
      {
        description: 'Run tests for a specific package or all tests in the workspace',
        inputSchema: {
          package: z.enum(['api', 'web', 'shared', 'all']),
          filter: z.string().optional(),
        },
      },
      async (args: { package: string; filter?: string }) => {
        const pkg = (args.package || 'all') as 'api' | 'web' | 'shared' | 'all'
        const filter = args.filter as string | undefined
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
      },
    )

    this.mcpServer.registerTool(
      'get-test-coverage',
      {
        description: 'Get test coverage report for a specific package',
        inputSchema: {
          package: z.enum(['api', 'web', 'shared']),
        },
      },
      async (args: { package: string }) => {
        const pkg = args.package as 'api' | 'web' | 'shared'
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
      },
    )

    this.mcpServer.registerTool(
      'get-test-patterns',
      {
        description: 'Get information about testing patterns and best practices used in TeamPulse',
        inputSchema: {
          category: z.enum(['all', 'unit-tests', 'integration-tests', 'test-data', 'mocking']).optional(),
        },
      },
      (args: { category?: string }) => {
        const category = (args.category || 'all') as 'all' | 'unit-tests' | 'integration-tests' | 'test-data' | 'mocking'
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
      },
    )

    this.mcpServer.registerTool(
      'lint-check',
      {
        description: 'Run lint checks on a specific package',
        inputSchema: {
          package: z.enum(['api', 'web', 'shared', 'all']),
          fix: z.boolean().optional(),
        },
      },
      async (args: { package: string; fix?: boolean }) => {
        const pkg = (args.package || 'all') as 'api' | 'web' | 'shared' | 'all'
        const fix = args.fix ?? false
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
      },
    )
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.mcpServer.server.connect(transport)
    console.error('TeamPulse Testing MCP server running on stdio')
  }
}

const server = new TestingMCPServer()
server.run().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
