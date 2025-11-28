import type { IMetricsFactory } from '@domain/services/metrics/IMetricsFactory.js'
import type { MetricsCollection } from '@domain/services/metrics/MetricsCollection.js'
import { METRIC_CONFIG } from '@domain/services/metrics/metrics.config.js'
import { PrometheusCounter } from '@infrastructure/monitoring/prometheus/adapters/PrometheusCounter.js'
import { PrometheusGauge } from '@infrastructure/monitoring/prometheus/adapters/PrometheusGauge.js'
import { PrometheusHistogram } from '@infrastructure/monitoring/prometheus/adapters/PrometheusHistogram.js'
import { PrometheusRegistry } from '@infrastructure/monitoring/prometheus/adapters/PrometheusRegistry.js'
import * as promClient from 'prom-client'
import { collectDefaultMetrics, Registry } from 'prom-client'

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
        name: METRIC_CONFIG.HTTP.REQUEST_DURATION.name,
        help: METRIC_CONFIG.HTTP.REQUEST_DURATION.help,
        labelNames: [...METRIC_CONFIG.HTTP.REQUEST_DURATION.labelNames],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
        registers: [registry],
      }),
      httpRequestTotal: new promClient.Counter({
        name: METRIC_CONFIG.HTTP.REQUEST_TOTAL.name,
        help: METRIC_CONFIG.HTTP.REQUEST_TOTAL.help,
        labelNames: [...METRIC_CONFIG.HTTP.REQUEST_TOTAL.labelNames],
        registers: [registry],
      }),
      httpRequestErrors: new promClient.Counter({
        name: METRIC_CONFIG.HTTP.REQUEST_ERRORS.name,
        help: METRIC_CONFIG.HTTP.REQUEST_ERRORS.help,
        labelNames: [...METRIC_CONFIG.HTTP.REQUEST_ERRORS.labelNames],
        registers: [registry],
      }),
      dbQueryDuration: new promClient.Histogram({
        name: METRIC_CONFIG.DB.QUERY_DURATION.name,
        help: METRIC_CONFIG.DB.QUERY_DURATION.help,
        labelNames: [...METRIC_CONFIG.DB.QUERY_DURATION.labelNames],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        registers: [registry],
      }),
      dbQueryTotal: new promClient.Counter({
        name: METRIC_CONFIG.DB.QUERY_TOTAL.name,
        help: METRIC_CONFIG.DB.QUERY_TOTAL.help,
        labelNames: [...METRIC_CONFIG.DB.QUERY_TOTAL.labelNames],
        registers: [registry],
      }),
      dbQueryErrors: new promClient.Counter({
        name: METRIC_CONFIG.DB.QUERY_ERRORS.name,
        help: METRIC_CONFIG.DB.QUERY_ERRORS.help,
        labelNames: [...METRIC_CONFIG.DB.QUERY_ERRORS.labelNames],
        registers: [registry],
      }),
      usersTotal: new promClient.Gauge({
        name: METRIC_CONFIG.BUSINESS.USERS_TOTAL.name,
        help: METRIC_CONFIG.BUSINESS.USERS_TOTAL.help,
        registers: [registry],
      }),
      teamsTotal: new promClient.Gauge({
        name: METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name,
        help: METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.help,
        registers: [registry],
      }),
      loginsTotal: new promClient.Counter({
        name: METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.name,
        help: METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.help,
        labelNames: [...METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.labelNames],
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
