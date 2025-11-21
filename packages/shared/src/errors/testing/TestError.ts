/**
 * Test Error Helper
 *
 * Concrete ApplicationError implementation for testing purposes.
 * Provides a reusable error class for testing base error functionality
 * without coupling tests to specific domain errors.
 *
 * Usage:
 * ```typescript
 * import { TestError } from '@team-pulse/shared/errors/testing'
 *
 * const error = TestError.create({ message: 'Test error' })
 * expect(error).toBeInstanceOf(ApplicationError)
 * ```
 */

import { ApplicationError, type ErrorSeverity } from '../core.js'

/**
 * Test error for validating ApplicationError base functionality
 *
 * This is a minimal implementation used exclusively in tests.
 * It allows testing core error behavior without depending on
 * specific domain error implementations.
 */
export class TestError extends ApplicationError {
  static readonly CODE = 'TEST_ERROR' as const
  static readonly CATEGORY = 'validation' as const

  readonly code = TestError.CODE
  readonly category = TestError.CATEGORY

  private constructor({
    message,
    severity,
    metadata,
  }: {
    message: string
    severity?: ErrorSeverity
    metadata?: Record<string, unknown>
  }) {
    super({ message, severity, metadata, isOperational: true })
  }

  /**
   * Factory method to create test error
   */
  static create({ message, severity, metadata }: { message: string; severity?: ErrorSeverity; metadata?: Record<string, unknown> }): TestError {
    return new TestError({ message, severity, metadata })
  }
}
