import { Ok, type Result } from '@team-pulse/shared/result'
import type { ICommandExecutor } from '../domain/ICommandExecutor.js'

export type LintPackageTarget = 'api' | 'web' | 'shared' | 'all'

/**
 * Lint Check Use Case
 *
 * This is an APPLICATION SERVICE / USE CASE:
 * - Orchestrates linting via command executor
 * - Builds appropriate lint commands for different packages
 * - Supports auto-fix option
 */
export class LintCheckUseCase {
  private readonly commandExecutor: ICommandExecutor

  private constructor({ commandExecutor }: { commandExecutor: ICommandExecutor }) {
    this.commandExecutor = commandExecutor
  }

  static create({ commandExecutor }: { commandExecutor: ICommandExecutor }): LintCheckUseCase {
    return new LintCheckUseCase({ commandExecutor })
  }

  async execute({ pkg, fix }: { pkg: LintPackageTarget; fix: boolean }): Promise<Result<string, Error>> {
    const command = this.buildCommand({ fix, pkg })

    const result = await this.commandExecutor.execute({ command })

    if (!result.ok) {
      return result
    }

    const { stdout, stderr } = result.value
    const output = this.formatOutput({ fix, pkg, stderr, stdout })

    return Ok(output)
  }

  private buildCommand({ pkg, fix }: { pkg: LintPackageTarget; fix: boolean }): string {
    const lintCommand = fix ? 'lint:fix' : 'lint'

    if (pkg === 'all') {
      return `pnpm ${lintCommand}`
    }

    return `pnpm --filter @team-pulse/${pkg} ${lintCommand}`
  }

  private formatOutput({ pkg, fix, stdout, stderr }: { pkg: LintPackageTarget; fix: boolean; stdout: string; stderr: string }): string {
    const action = fix ? 'Lint Fix' : 'Lint Check'
    let output = `${action} Results for ${pkg}:\n\n`
    output += stdout

    if (stderr) {
      output += `\n\n${stderr}`
    }

    return output
  }
}
