import type { IGauge } from '@domain/services/metrics/IGauge.js'
import type * as promClient from 'prom-client'

/**
 * Prometheus Gauge Adapter
 *
 * Adapts the Prometheus Gauge to our domain interface (IGauge),
 * allowing the application to be independent of the Prometheus library.
 *
 * Infrastructure Layer - Adapter in Hexagonal Architecture
 */
export class PrometheusGauge implements IGauge {
  private readonly gauge: promClient.Gauge

  private constructor({ gauge }: { gauge: promClient.Gauge }) {
    this.gauge = gauge
  }

  static create({ gauge }: { gauge: promClient.Gauge }): PrometheusGauge {
    return new PrometheusGauge({ gauge })
  }

  set({ value, labels }: { value: number; labels?: Record<string, string | number> }): void {
    labels ? this.gauge.set(labels, value) : this.gauge.set(value)
  }

  inc({ value = 1 }: { value?: number } = {}): void {
    this.gauge.inc(value)
  }

  dec({ value = 1 }: { value?: number } = {}): void {
    this.gauge.dec(value)
  }
}
