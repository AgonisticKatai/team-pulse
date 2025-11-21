import { ApplicationError } from './core'

/**
 * Business Rule Error
 *
 * Used when a domain business rule is violated.
 * This is an operational error - safe to expose to users.
 *
 * Examples:
 * - Cannot delete team with active matches
 * - Cannot update completed match
 * - Invalid state transition
 *
 * HTTP Status: 422 Unprocessable Entity
 */

export class BusinessRuleError extends ApplicationError {
  static readonly CODE = 'BUSINESS_RULE_VIOLATION' as const
  static readonly CATEGORY = 'business_rule' as const

  readonly code = BusinessRuleError.CODE
  readonly category = BusinessRuleError.CATEGORY

  private constructor({ rule, message }: { rule: string; message: string }) {
    super({
      message,
      severity: 'medium',
      metadata: { rule },
      isOperational: true,
    })
  }

  /**
   * Create business rule violation error
   */
  static create({ rule, message }: { rule: string; message: string }): BusinessRuleError {
    return new BusinessRuleError({ rule, message })
  }
}
