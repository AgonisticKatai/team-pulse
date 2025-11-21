import { ApplicationError } from './core'

/**
 * External Service Error
 *
 * Used when an external service fails or is unavailable.
 * This is an operational error but may indicate system issues.
 *
 * Examples:
 * - Payment gateway timeout
 * - Email service unavailable
 * - Third-party API error
 *
 * HTTP Status: 502 Bad Gateway
 */

export class ExternalServiceError extends ApplicationError {
  static readonly CODE = 'EXTERNAL_SERVICE_ERROR' as const
  static readonly CATEGORY = 'external' as const

  readonly code = ExternalServiceError.CODE
  readonly category = ExternalServiceError.CATEGORY

  private constructor({
    service,
    message,
    cause,
  }: {
    service: string
    message: string
    cause?: Error
  }) {
    super({
      message,
      severity: 'high',
      metadata: { service },
      isOperational: true,
      cause,
    })
  }

  /**
   * Create external service error
   */
  static create({ service, message, cause }: { service: string; message: string; cause?: Error }): ExternalServiceError {
    return new ExternalServiceError({ service, message, cause })
  }

  /**
   * Service timeout
   */
  static timeout({ service }: { service: string }): ExternalServiceError {
    return new ExternalServiceError({
      service,
      message: `${service} request timed out`,
    })
  }

  /**
   * Service unavailable
   */
  static unavailable({ service }: { service: string }): ExternalServiceError {
    return new ExternalServiceError({
      service,
      message: `${service} is currently unavailable`,
    })
  }
}
