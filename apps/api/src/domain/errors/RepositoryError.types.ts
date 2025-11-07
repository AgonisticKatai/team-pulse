/**
 * Repository Error Type Definitions
 */

/**
 * Properties for creating a RepositoryError
 */
export interface RepositoryErrorProps {
  message: string
  operation?: string
  cause?: Error
}

/**
 * Properties for creating a RepositoryError for a specific operation
 * Extends RepositoryErrorProps but makes 'operation' required
 */
export type ForOperationProps = RepositoryErrorProps & {
  operation: string
}
