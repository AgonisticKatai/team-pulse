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
    this.mcpServer.registerTool(
      'run-tests',
      {
        description: 'Run tests for a specific package or all tests in the workspace',
        inputSchema: {
          filter: z.string().optional(),
          package: z.enum(['api', 'web', 'shared', 'all']),
        },
      },
      async (args: { package: string; filter?: string }) => {
        const pkg = (args.package || 'all') as 'api' | 'web' | 'shared' | 'all'
        const filter = args.filter as string | undefined
        const result = await this.runTestsUseCase.execute({ filter, pkg })

        if (!result.ok) {
          return {
            content: [{ text: result.error.message, type: 'text' as const }],
            isError: true,
          }
        }

        return {
          content: [{ text: result.value, type: 'text' as const }],
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
            content: [{ text: result.error.message, type: 'text' as const }],
            isError: true,
          }
        }

        return {
          content: [{ text: result.value, type: 'text' as const }],
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
            content: [{ text: result.error.message, type: 'text' as const }],
            isError: true,
          }
        }

        return {
          content: [{ text: result.value, type: 'text' as const }],
        }
      },
    )

    this.mcpServer.registerTool(
      'lint-check',
      {
        description: 'Run lint checks on a specific package',
        inputSchema: {
          fix: z.boolean().optional(),
          package: z.enum(['api', 'web', 'shared', 'all']),
        },
      },
      async (args: { package: string; fix?: boolean }) => {
        const pkg = (args.package || 'all') as 'api' | 'web' | 'shared' | 'all'
        const fix = args.fix ?? false
        const result = await this.lintCheckUseCase.execute({ fix, pkg })

        if (!result.ok) {
          return {
            content: [{ text: result.error.message, type: 'text' as const }],
            isError: true,
          }
        }

        return {
          content: [{ text: result.value, type: 'text' as const }],
        }
      },
    )
  }

  async run() {
    const transport = new StdioServerTransport()
    await this.mcpServer.server.connect(transport)
  }
}

const server = new TestingMCPServer()
server.run()
