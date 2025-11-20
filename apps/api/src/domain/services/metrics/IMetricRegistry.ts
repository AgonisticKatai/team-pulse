/**
 * Metric Registry Interface
 *
 * Abstraction for a metrics registry that can collect and export metrics.
 * This allows the application to be independent of any specific metrics library
 * (Prometheus, DataDog, StatsD, etc.)
 */
export interface IMetricRegistry {
  /**
   * Get metrics in the registry's native format
   */
  metrics(): Promise<string>

  /**
   * Get the content type for the metrics format
   */
  contentType(): string

  /**
   * Reset all metrics in the registry
   */
  resetMetrics(): void
}
