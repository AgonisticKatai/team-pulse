import { Ok, type Result } from '@team-pulse/shared'
import type { ICommandExecutor } from '../domain/ICommandExecutor.js'

export type PackageTarget = 'api' | 'web' | 'shared' | 'all'

/**
 * Run Tests Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Orchestrates test execution via command executor
 * - Builds appropriate test commands for different packages
 * - Handles optional test filtering
 */
export class RunTestsUseCase {
  private readonly commandExecutor: ICommandExecutor

  private constructor({ commandExecutor }: { commandExecutor: ICommandExecutor }) {
    this.commandExecutor = commandExecutor
  }

  static create({ commandExecutor }: { commandExecutor: ICommandExecutor }): RunTestsUseCase {
    return new RunTestsUseCase({ commandExecutor })
  }

  async execute({ pkg, filter }: { pkg: PackageTarget; filter?: string }): Promise<Result<string, Error>> {
    const command = this.buildCommand({ pkg, filter })

    const result = await this.commandExecutor.execute({ command })

    if (!result.ok) {
      return result
    }

    const { stdout, stderr } = result.value
    const output = this.formatOutput({ pkg, stdout, stderr })

    return Ok(output)
  }

  private buildCommand({ pkg, filter }: { pkg: PackageTarget; filter?: string }): string {
    let command: string

    if (pkg === 'all') {
      command = 'pnpm test'
    } else {
      command = `pnpm --filter @team-pulse/${pkg} test`
    }

    if (filter) {
      command += ` -- ${filter}`
    }

    return command
  }

  private formatOutput({ pkg, stdout, stderr }: { pkg: PackageTarget; stdout: string; stderr: string }): string {
    let output = `Test Results for ${pkg}:\n\n`
    output += stdout

    if (stderr) {
      output += `\n\n${stderr}`
    }

    return output
  }
}
