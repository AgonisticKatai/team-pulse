import type { ICounter } from '@shared/monitoring/metrics/ICounter.js'
import type { IGauge } from '@shared/monitoring/metrics/IGauge.js'
import type { IHistogram } from '@shared/monitoring/metrics/IHistogram.js'
import type { IMetricRegistry } from '@shared/monitoring/metrics/IMetricRegistry.js'

/**
 * Collection of all metrics used by the application
 *
 * This type represents the complete set of metrics needed by MetricsService.
 * It is agnostic to any specific metrics implementation (Prometheus, DataDog, etc.)
 *
 * Domain Layer - Pure abstraction with zero coupling to infrastructure
 */
export interface MetricsCollection {
  // Registry for exporting metrics
  readonly registry: IMetricRegistry

  // HTTP metrics
  readonly httpRequestDuration: IHistogram
  readonly httpRequestTotal: ICounter
  readonly httpRequestErrors: ICounter

  // Database metrics
  readonly dbQueryDuration: IHistogram
  readonly dbQueryTotal: ICounter
  readonly dbQueryErrors: ICounter

  // Business metrics
  readonly usersTotal: IGauge
  readonly teamsTotal: IGauge
  readonly loginsTotal: ICounter
}
