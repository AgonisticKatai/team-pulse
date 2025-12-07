/**
 * BusinessRuleError - Represents business rule violations (422 Unprocessable Entity)
 *
 * Used when request is valid but violates business logic rules
 *
 * @module errors/BusinessRuleError
 */

import type { ErrorSeverity } from './core.js'
import { ApplicationError, ERROR_CATEGORY, ERROR_CODES, ERROR_SEVERITY } from './core.js'

export class BusinessRuleError extends ApplicationError {
  readonly code = ERROR_CODES.BUSINESS_RULE_ERROR
  readonly category = ERROR_CATEGORY.BUSINESS_RULE

  private constructor({
    message,
    severity = ERROR_SEVERITY.MEDIUM,
    metadata,
  }: {
    message: string
    severity?: ErrorSeverity
    metadata?: Record<string, unknown>
  }) {
    super({
      isOperational: true,
      message,
      metadata,
      severity,
    })
  }

  /**
   * Create a business rule error
   */
  static create({
    message,
    rule,
    metadata,
  }: {
    message: string
    rule?: string
    metadata?: Record<string, unknown>
  }): BusinessRuleError {
    return new BusinessRuleError({
      message,
      metadata: {
        ...metadata,
        ...(rule && { rule }),
      },
    })
  }
}
