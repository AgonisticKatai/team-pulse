/**
 * Metrics Service Interface
 *
 * This interface defines the contract for metrics collection in the application.
 * It follows hexagonal architecture by placing the interface in the domain layer,
 * allowing the application layer to depend on abstractions rather than concrete implementations.
 *
 * The infrastructure layer (MetricsService) implements this interface.
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
   */
  recordDbError({ errorType, operation, table }: { errorType: string; operation: string; table: string }): void

  /**
   * Record database query metrics
   */
  recordDbQuery({ durationSeconds, operation, table }: { durationSeconds: number; operation: string; table: string }): void

  /**
   * Record HTTP request error
   */
  recordHttpError({ errorType, method, route }: { errorType: string; method: string; route: string }): void

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest({
    durationSeconds,
    method,
    route,
    statusCode,
  }: {
    durationSeconds: number
    method: string
    route: string
    statusCode: number
  }): void

  /**
   * Record successful login
   */
  recordLogin({ role }: { role: string }): void

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void

  /**
   * Set total number of teams
   */
  setTeamsTotal({ count }: { count: number }): void

  /**
   * Set total number of users
   */
  setUsersTotal({ count }: { count: number }): void
}
