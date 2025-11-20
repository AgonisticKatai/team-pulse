import * as promClient from 'prom-client'
import { collectDefaultMetrics, Registry } from 'prom-client'
import type { IMetricsFactory } from '../../../domain/services/metrics/IMetricsFactory.js'
import type { MetricsCollection } from '../../../domain/services/metrics/MetricsCollection.js'
import { PrometheusCounter } from './adapters/PrometheusCounter.js'
import { PrometheusGauge } from './adapters/PrometheusGauge.js'
import { PrometheusHistogram } from './adapters/PrometheusHistogram.js'
import { PrometheusRegistry } from './adapters/PrometheusRegistry.js'

type NativeMetrics = {
  httpRequestDuration: promClient.Histogram
  httpRequestTotal: promClient.Counter
  httpRequestErrors: promClient.Counter
  dbQueryDuration: promClient.Histogram
  dbQueryTotal: promClient.Counter
  dbQueryErrors: promClient.Counter
  usersTotal: promClient.Gauge
  teamsTotal: promClient.Gauge
  loginsTotal: promClient.Counter
}

/**
 * Prometheus Metrics Factory
 *
 * This factory encapsulates ALL knowledge of Prometheus.
 * It creates and configures all Prometheus metrics, then wraps them
 * with our domain adapters to provide a clean, framework-agnostic interface.
 *
 * Infrastructure Layer - Factory in Hexagonal Architecture
 *
 * This is the ONLY place where:
 * - Prometheus Registry is created
 * - Prometheus metrics are instantiated
 * - Metric names, labels, and buckets are configured
 *
 * Switching to a different metrics provider (DataDog, StatsD) only requires
 * creating a new factory (e.g., DataDogMetricsFactory) without touching
 * the domain layer or MetricsService.
 */
export class PrometheusMetricsFactory implements IMetricsFactory {
  private constructor() {}

  static create(): PrometheusMetricsFactory {
    return new PrometheusMetricsFactory()
  }

  createMetrics(): MetricsCollection {
    const promRegistry = this.createRegistry()
    const nativeMetrics = this.createNativeMetrics({ registry: promRegistry })
    return this.wrapWithAdapters({ promRegistry, nativeMetrics })
  }

  /**
   * Create and configure Prometheus Registry with default metrics
   */
  private createRegistry(): Registry {
    const registry = new Registry()
    collectDefaultMetrics({ register: registry })
    return registry
  }

  /**
   * Create all Prometheus native metrics with proper configuration
   */
  private createNativeMetrics({ registry }: { registry: Registry }) {
    return {
      httpRequestDuration: new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
        registers: [registry],
      }),
      httpRequestTotal: new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
        registers: [registry],
      }),
      httpRequestErrors: new promClient.Counter({
        name: 'http_request_errors_total',
        help: 'Total number of HTTP request errors',
        labelNames: ['method', 'route', 'error_type'],
        registers: [registry],
      }),
      dbQueryDuration: new promClient.Histogram({
        name: 'db_query_duration_seconds',
        help: 'Duration of database queries in seconds',
        labelNames: ['operation', 'table'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        registers: [registry],
      }),
      dbQueryTotal: new promClient.Counter({
        name: 'db_queries_total',
        help: 'Total number of database queries',
        labelNames: ['operation', 'table'],
        registers: [registry],
      }),
      dbQueryErrors: new promClient.Counter({
        name: 'db_query_errors_total',
        help: 'Total number of database query errors',
        labelNames: ['operation', 'table', 'error_type'],
        registers: [registry],
      }),
      usersTotal: new promClient.Gauge({
        name: 'users_total',
        help: 'Total number of users in the system',
        registers: [registry],
      }),
      teamsTotal: new promClient.Gauge({
        name: 'teams_total',
        help: 'Total number of teams in the system',
        registers: [registry],
      }),
      loginsTotal: new promClient.Counter({
        name: 'logins_total',
        help: 'Total number of successful logins',
        labelNames: ['role'],
        registers: [registry],
      }),
    }
  }

  /**
   * Wrap Prometheus metrics with our domain adapters
   */
  private wrapWithAdapters({ promRegistry, nativeMetrics }: { promRegistry: Registry; nativeMetrics: NativeMetrics }): MetricsCollection {
    return {
      registry: PrometheusRegistry.create({ registry: promRegistry }),
      httpRequestDuration: PrometheusHistogram.create({ histogram: nativeMetrics.httpRequestDuration }),
      httpRequestTotal: PrometheusCounter.create({ counter: nativeMetrics.httpRequestTotal }),
      httpRequestErrors: PrometheusCounter.create({ counter: nativeMetrics.httpRequestErrors }),
      dbQueryDuration: PrometheusHistogram.create({ histogram: nativeMetrics.dbQueryDuration }),
      dbQueryTotal: PrometheusCounter.create({ counter: nativeMetrics.dbQueryTotal }),
      dbQueryErrors: PrometheusCounter.create({ counter: nativeMetrics.dbQueryErrors }),
      usersTotal: PrometheusGauge.create({ gauge: nativeMetrics.usersTotal }),
      teamsTotal: PrometheusGauge.create({ gauge: nativeMetrics.teamsTotal }),
      loginsTotal: PrometheusCounter.create({ counter: nativeMetrics.loginsTotal }),
    }
  }
}
