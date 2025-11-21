import type { IMetricRegistry } from '@domain/services/metrics/IMetricRegistry.js'
import type * as promClient from 'prom-client'

/**
 * Prometheus Registry Adapter
 *
 * Adapts the Prometheus Registry to our domain interface (IMetricRegistry),
 * allowing the application to be independent of the Prometheus library.
 *
 * Infrastructure Layer - Adapter in Hexagonal Architecture
 */
export class PrometheusRegistry implements IMetricRegistry {
  private readonly registry: promClient.Registry

  private constructor({ registry }: { registry: promClient.Registry }) {
    this.registry = registry
  }

  static create({ registry }: { registry: promClient.Registry }): PrometheusRegistry {
    return new PrometheusRegistry({ registry })
  }

  // biome-ignore lint/suspicious/useAwait: async required by domain interface (IMetricRegistry) for consistency across adapters
  async metrics(): Promise<string> {
    return this.registry.metrics()
  }

  contentType(): string {
    return this.registry.contentType
  }

  resetMetrics(): void {
    this.registry.resetMetrics()
  }
}
