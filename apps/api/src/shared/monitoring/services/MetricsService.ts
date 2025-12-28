import type { IMetricsFactory } from '@shared/monitoring/interfaces/IMetricsFactory.js'
import type { IMetricsService } from '@shared/monitoring/interfaces/IMetricsService.js'
import type { MetricsCollection } from '@shared/monitoring/types/MetricsCollection.js'
import type {
  DbErrorMetrics,
  DbQueryMetrics,
  HttpErrorMetrics,
  HttpRequestMetrics,
  LoginMetrics,
  TotalCountMetrics,
} from '@shared/monitoring/types/metrics.types.js'

/**
 * Service for managing application metrics
 * Provides HTTP, database, and business metrics
 *
 * This service is COMPLETELY DECOUPLED from any specific metrics library.
 * It depends only on domain abstractions (IMetricRegistry, IHistogram, ICounter, IGauge).
 *
 * The metrics implementation (Prometheus, DataDog, StatsD, etc.) is injected
 * via the IMetricsFactory in the factory method.
 *
 * Architecture: Hexagonal Architecture (Ports & Adapters)
 * - Domain Layer: Interfaces (IMetricsService, IMetricsFactory, MetricsCollection)
 * - Infrastructure Layer: This service + specific factories (PrometheusMetricsFactory, etc.)
 *
 * To switch metrics providers:
 * 1. Create new factory (e.g., DataDogMetricsFactory implements IMetricsFactory)
 * 2. Update container to use DataDogMetricsFactory instead of PrometheusMetricsFactory
 * 3. MetricsService code DOES NOT CHANGE
 */
export class MetricsService implements IMetricsService {
  private readonly metrics: MetricsCollection

  private constructor({ metrics }: { metrics: MetricsCollection }) {
    this.metrics = metrics
  }

  /**
   * Factory method to create MetricsService with injected metrics
   *
   * @param metricsFactory - Factory that creates the metrics collection
   * @returns Configured MetricsService instance
   */
  static create({ metricsFactory }: { metricsFactory: IMetricsFactory }): MetricsService {
    const metrics = metricsFactory.createMetrics()
    return new MetricsService({ metrics })
  }

  /**
   * Get metrics in the registry's format
   */
  getMetrics(): Promise<string> {
    return this.metrics.registry.metrics()
  }

  /**
   * Get content type for metrics
   */
  getContentType(): string {
    return this.metrics.registry.contentType()
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest({ durationSeconds, method, route, statusCode }: HttpRequestMetrics): void {
    // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
    const labels = { method, route, status_code: statusCode }
    this.metrics.httpRequestDuration.observe({ labels, value: durationSeconds })
    this.metrics.httpRequestTotal.inc({ labels })
  }

  /**
   * Record HTTP request error
   */
  recordHttpError({ errorType, method, route }: HttpErrorMetrics): void {
    // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
    this.metrics.httpRequestErrors.inc({ labels: { error_type: errorType, method, route } })
  }

  /**
   * Record database query metrics
   */
  recordDbQuery({ durationSeconds, operation, table }: DbQueryMetrics): void {
    const labels = { operation, table }
    this.metrics.dbQueryDuration.observe({ labels, value: durationSeconds })
    this.metrics.dbQueryTotal.inc({ labels })
  }

  /**
   * Record database query error
   */
  recordDbError({ errorType, operation, table }: DbErrorMetrics): void {
    // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
    this.metrics.dbQueryErrors.inc({ labels: { error_type: errorType, operation, table } })
  }

  /**
   * Set total number of users
   */
  setUsersTotal({ count }: TotalCountMetrics): void {
    this.metrics.usersTotal.set({ value: count })
  }

  /**
   * Set total number of teams
   */
  setTeamsTotal({ count }: TotalCountMetrics): void {
    this.metrics.teamsTotal.set({ value: count })
  }

  /**
   * Record successful login
   */
  recordLogin({ role }: LoginMetrics): void {
    this.metrics.loginsTotal.inc({ labels: { role } })
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.registry.resetMetrics()
  }
}
