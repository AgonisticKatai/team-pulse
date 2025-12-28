import type { IMetricsFactory } from '@shared/monitoring/interfaces/IMetricsFactory.js'
import { PrometheusCounter } from '@shared/monitoring/prometheus/counter/PrometheusCounter.js'
import { PrometheusGauge } from '@shared/monitoring/prometheus/gauge/PrometheusGauge.js'
import { PrometheusHistogram } from '@shared/monitoring/prometheus/histogram/PrometheusHistogram.js'
import { PrometheusRegistry } from '@shared/monitoring/prometheus/registry/PrometheusRegistry.js'
import type { MetricsCollection } from '@shared/monitoring/types/MetricsCollection.js'
import { METRIC_CONFIG } from '@shared/monitoring/types/metrics.config.js'
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
    return this.wrapWithAdapters({ nativeMetrics, promRegistry })
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
      dbQueryDuration: new promClient.Histogram({
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
        help: METRIC_CONFIG.DB.QUERY_DURATION.help,
        labelNames: [...METRIC_CONFIG.DB.QUERY_DURATION.labelNames],
        name: METRIC_CONFIG.DB.QUERY_DURATION.name,
        registers: [registry],
      }),
      dbQueryErrors: new promClient.Counter({
        help: METRIC_CONFIG.DB.QUERY_ERRORS.help,
        labelNames: [...METRIC_CONFIG.DB.QUERY_ERRORS.labelNames],
        name: METRIC_CONFIG.DB.QUERY_ERRORS.name,
        registers: [registry],
      }),
      dbQueryTotal: new promClient.Counter({
        help: METRIC_CONFIG.DB.QUERY_TOTAL.help,
        labelNames: [...METRIC_CONFIG.DB.QUERY_TOTAL.labelNames],
        name: METRIC_CONFIG.DB.QUERY_TOTAL.name,
        registers: [registry],
      }),
      httpRequestDuration: new promClient.Histogram({
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
        help: METRIC_CONFIG.HTTP.REQUEST_DURATION.help,
        labelNames: [...METRIC_CONFIG.HTTP.REQUEST_DURATION.labelNames],
        name: METRIC_CONFIG.HTTP.REQUEST_DURATION.name,
        registers: [registry],
      }),
      httpRequestErrors: new promClient.Counter({
        help: METRIC_CONFIG.HTTP.REQUEST_ERRORS.help,
        labelNames: [...METRIC_CONFIG.HTTP.REQUEST_ERRORS.labelNames],
        name: METRIC_CONFIG.HTTP.REQUEST_ERRORS.name,
        registers: [registry],
      }),
      httpRequestTotal: new promClient.Counter({
        help: METRIC_CONFIG.HTTP.REQUEST_TOTAL.help,
        labelNames: [...METRIC_CONFIG.HTTP.REQUEST_TOTAL.labelNames],
        name: METRIC_CONFIG.HTTP.REQUEST_TOTAL.name,
        registers: [registry],
      }),
      loginsTotal: new promClient.Counter({
        help: METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.help,
        labelNames: [...METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.labelNames],
        name: METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.name,
        registers: [registry],
      }),
      teamsTotal: new promClient.Gauge({
        help: METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.help,
        name: METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name,
        registers: [registry],
      }),
      usersTotal: new promClient.Gauge({
        help: METRIC_CONFIG.BUSINESS.USERS_TOTAL.help,
        name: METRIC_CONFIG.BUSINESS.USERS_TOTAL.name,
        registers: [registry],
      }),
    }
  }

  /**
   * Wrap Prometheus metrics with our domain adapters
   */
  private wrapWithAdapters({
    promRegistry,
    nativeMetrics,
  }: {
    promRegistry: Registry
    nativeMetrics: NativeMetrics
  }): MetricsCollection {
    return {
      dbQueryDuration: PrometheusHistogram.create({ histogram: nativeMetrics.dbQueryDuration }),
      dbQueryErrors: PrometheusCounter.create({ counter: nativeMetrics.dbQueryErrors }),
      dbQueryTotal: PrometheusCounter.create({ counter: nativeMetrics.dbQueryTotal }),
      httpRequestDuration: PrometheusHistogram.create({ histogram: nativeMetrics.httpRequestDuration }),
      httpRequestErrors: PrometheusCounter.create({ counter: nativeMetrics.httpRequestErrors }),
      httpRequestTotal: PrometheusCounter.create({ counter: nativeMetrics.httpRequestTotal }),
      loginsTotal: PrometheusCounter.create({ counter: nativeMetrics.loginsTotal }),
      registry: PrometheusRegistry.create({ registry: promRegistry }),
      teamsTotal: PrometheusGauge.create({ gauge: nativeMetrics.teamsTotal }),
      usersTotal: PrometheusGauge.create({ gauge: nativeMetrics.usersTotal }),
    }
  }
}
