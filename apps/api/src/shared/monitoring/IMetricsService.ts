import type {
  DbErrorMetrics,
  DbQueryMetrics,
  HttpErrorMetrics,
  HttpRequestMetrics,
  LoginMetrics,
  TotalCountMetrics,
} from '@shared/monitoring/metrics/metrics.types.js'

/**
 * Metrics Service Interface
 *
 * This interface defines the contract for metrics collection in the application.
 * It follows hexagonal architecture by placing the interface in the domain layer,
 * allowing the application layer to depend on abstractions rather than concrete implementations.
 *
 * The infrastructure layer (MetricsService) implements this interface.
 *
 * All methods use type-safe parameters derived from metrics configuration,
 * providing compile-time validation of metric values.
 */
export interface IMetricsService {
  /**
   * Get content type for Prometheus metrics
   */
  getContentType(): string

  /**
   * Get metrics in Prometheus format
   */
  getMetrics(): Promise<string>

  /**
   * Record database query error
   *
   * @param params - Database error metrics with validated types
   * @param params.operation - Database operation ('select' | 'insert' | 'update' | 'delete')
   * @param params.table - Database table ('users' | 'teams' | 'refresh_tokens')
   * @param params.errorType - Error type description
   */
  recordDbError(params: DbErrorMetrics): void

  /**
   * Record database query metrics
   *
   * @param params - Database query metrics with validated types
   * @param params.operation - Database operation ('select' | 'insert' | 'update' | 'delete')
   * @param params.table - Database table ('users' | 'teams' | 'refresh_tokens')
   * @param params.durationSeconds - Query duration in seconds
   */
  recordDbQuery(params: DbQueryMetrics): void

  /**
   * Record HTTP request error
   *
   * @param params - HTTP error metrics with validated types
   * @param params.method - HTTP method ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | etc.)
   * @param params.route - Route path
   * @param params.errorType - Error type ('client_error' | 'server_error')
   */
  recordHttpError(params: HttpErrorMetrics): void

  /**
   * Record HTTP request metrics
   *
   * @param params - HTTP request metrics with validated types
   * @param params.method - HTTP method ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | etc.)
   * @param params.route - Route path
   * @param params.statusCode - HTTP status code
   * @param params.durationSeconds - Request duration in seconds
   */
  recordHttpRequest(params: HttpRequestMetrics): void

  /**
   * Record successful login
   *
   * @param params - Login metrics with validated types
   * @param params.role - User role ('USER' | 'ADMIN' | 'SUPER_ADMIN')
   */
  recordLogin(params: LoginMetrics): void

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void

  /**
   * Set total number of teams
   *
   * @param params - Total count metrics
   * @param params.count - Number of teams
   */
  setTeamsTotal(params: TotalCountMetrics): void

  /**
   * Set total number of users
   *
   * @param params - Total count metrics
   * @param params.count - Number of users
   */
  setUsersTotal(params: TotalCountMetrics): void
}
