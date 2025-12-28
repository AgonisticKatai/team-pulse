import type { ICounter } from '@domain/services/metrics/ICounter.js'
import type * as promClient from 'prom-client'

/**
 * Prometheus Counter Adapter
 *
 * Adapts the Prometheus Counter to our domain interface (ICounter),
 * allowing the application to be independent of the Prometheus library.
 *
 * Infrastructure Layer - Adapter in Hexagonal Architecture
 */
export class PrometheusCounter implements ICounter {
  private readonly counter: promClient.Counter

  private constructor({ counter }: { counter: promClient.Counter }) {
    this.counter = counter
  }

  static create({ counter }: { counter: promClient.Counter }): PrometheusCounter {
    return new PrometheusCounter({ counter })
  }

  inc({ labels, value = 1 }: { labels?: Record<string, string | number>; value?: number } = {}): void {
    labels ? this.counter.inc(labels, value) : this.counter.inc(value)
  }
}
