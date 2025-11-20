import type { MetricsCollection } from './MetricsCollection.js'

/**
 * Factory interface for creating metrics collections
 *
 * This port allows different implementations (Prometheus, DataDog, StatsD, etc.)
 * to provide their own metric implementations while keeping the domain layer
 * completely decoupled from any specific metrics library.
 *
 * Domain Layer - Port in Hexagonal Architecture
 *
 * Example implementations:
 * - PrometheusMetricsFactory (infrastructure/monitoring/prometheus/)
 * - DataDogMetricsFactory (infrastructure/monitoring/datadog/)
 * - InMemoryMetricsFactory (for testing)
 */
export interface IMetricsFactory {
  /**
   * Create and configure all application metrics
   *
   * @returns Complete collection of configured metrics
   */
  createMetrics(): MetricsCollection
}
