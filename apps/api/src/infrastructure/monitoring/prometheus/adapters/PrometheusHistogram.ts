import type * as promClient from 'prom-client'
import type { IHistogram } from '../../../../domain/services/metrics/IHistogram.js'

/**
 * Prometheus Histogram Adapter
 *
 * Adapts the Prometheus Histogram to our domain interface (IHistogram),
 * allowing the application to be independent of the Prometheus library.
 *
 * Infrastructure Layer - Adapter in Hexagonal Architecture
 */
export class PrometheusHistogram implements IHistogram {
  private readonly histogram: promClient.Histogram

  private constructor({ histogram }: { histogram: promClient.Histogram }) {
    this.histogram = histogram
  }

  static create({ histogram }: { histogram: promClient.Histogram }): PrometheusHistogram {
    return new PrometheusHistogram({ histogram })
  }

  observe({ labels, value }: { labels: Record<string, string | number>; value: number }): void {
    this.histogram.observe(labels, value)
  }
}
