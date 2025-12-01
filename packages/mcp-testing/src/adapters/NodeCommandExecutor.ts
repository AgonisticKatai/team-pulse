import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { Err, Ok, type Result } from '@team-pulse/shared/result'
import type { CommandOutput, ICommandExecutor } from '../domain/ICommandExecutor.js'

const execAsync = promisify(exec)

/**
 * Node Command Executor
 *
 * This is an ADAPTER in hexagonal architecture:
 * - Implements ICommandExecutor interface (PORT)
 * - Uses Node.js child_process to execute commands
 * - Handles command execution errors
 * - No business logic, pure infrastructure
 */
export class NodeCommandExecutor implements ICommandExecutor {
  private readonly defaultCwd: string

  private constructor({ defaultCwd }: { defaultCwd: string }) {
    this.defaultCwd = defaultCwd
  }

  static create({ defaultCwd }: { defaultCwd: string }): NodeCommandExecutor {
    return new NodeCommandExecutor({ defaultCwd })
  }

  async execute({ command, cwd }: { command: string; cwd?: string }): Promise<Result<CommandOutput, Error>> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || this.defaultCwd,
      })

      return Ok({ stderr, stdout })
    } catch (error) {
      if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
        // Command executed but returned non-zero exit code
        // Still return output as it may contain useful information
        return Ok({
          stderr: String(error.stderr || ''),
          stdout: String(error.stdout || ''),
        })
      }

      // Execution error
      const message = error instanceof Error ? error.message : String(error)
      return Err(new Error(`Command execution failed: ${message}`))
    }
  }
}
