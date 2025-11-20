import type { Result } from '@team-pulse/shared/result'

/**
 * Command Execution Result
 */
export interface CommandOutput {
  stdout: string
  stderr: string
}

/**
 * Command Executor Port
 *
 * Defines the contract for executing shell commands
 * This is a PORT in hexagonal architecture
 */
export interface ICommandExecutor {
  /**
   * Execute a command in the workspace
   */
  execute(params: { command: string; cwd?: string }): Promise<Result<CommandOutput, Error>>
}
