import { Ok, type Result } from '@team-pulse/shared'
import type { ICommandExecutor } from '../domain/ICommandExecutor.js'

export type CoveragePackageTarget = 'api' | 'web' | 'shared'

/**
 * Get Test Coverage Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Orchestrates coverage report generation
 * - Builds coverage commands for specific packages
 * - Formats coverage output
 */
export class GetTestCoverageUseCase {
  private readonly commandExecutor: ICommandExecutor

  private constructor({ commandExecutor }: { commandExecutor: ICommandExecutor }) {
    this.commandExecutor = commandExecutor
  }

  static create({ commandExecutor }: { commandExecutor: ICommandExecutor }): GetTestCoverageUseCase {
    return new GetTestCoverageUseCase({ commandExecutor })
  }

  async execute({ pkg }: { pkg: CoveragePackageTarget }): Promise<Result<string, Error>> {
    const command = this.buildCommand({ pkg })

    const result = await this.commandExecutor.execute({ command })

    if (!result.ok) {
      return result
    }

    const { stdout, stderr } = result.value
    const output = this.formatOutput({ pkg, stderr, stdout })

    return Ok(output)
  }

  private buildCommand({ pkg }: { pkg: CoveragePackageTarget }): string {
    return `pnpm --filter @team-pulse/${pkg} test:coverage`
  }

  private formatOutput({
    pkg,
    stdout,
    stderr,
  }: {
    pkg: CoveragePackageTarget
    stdout: string
    stderr: string
  }): string {
    let output = `Coverage Report for ${pkg}:\n\n`
    output += stdout

    if (stderr) {
      output += `\n\n${stderr}`
    }

    return output
  }
}
