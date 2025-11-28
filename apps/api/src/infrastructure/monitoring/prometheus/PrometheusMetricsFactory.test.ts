import { METRIC_CONFIG } from '@domain/services/metrics/metrics.config.js'
import { PrometheusMetricsFactory } from '@infrastructure/monitoring/prometheus/PrometheusMetricsFactory.js'
import { beforeEach, describe, expect, it } from 'vitest'

describe('PrometheusMetricsFactory', () => {
  let factory: PrometheusMetricsFactory

  beforeEach(() => {
    factory = PrometheusMetricsFactory.create()
  })

  describe('create factory method', () => {
    it('should create factory instance successfully', () => {
      const metricsFactory = PrometheusMetricsFactory.create()

      expect(metricsFactory).toBeInstanceOf(PrometheusMetricsFactory)
    })
  })

  describe('createMetrics', () => {
    it('should create complete metrics collection', () => {
      const metrics = factory.createMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.registry).toBeDefined()
      expect(metrics.httpRequestDuration).toBeDefined()
      expect(metrics.httpRequestTotal).toBeDefined()
      expect(metrics.httpRequestErrors).toBeDefined()
      expect(metrics.dbQueryDuration).toBeDefined()
      expect(metrics.dbQueryTotal).toBeDefined()
      expect(metrics.dbQueryErrors).toBeDefined()
      expect(metrics.usersTotal).toBeDefined()
      expect(metrics.teamsTotal).toBeDefined()
      expect(metrics.loginsTotal).toBeDefined()
    })

    it('should return metrics that implement domain interfaces', () => {
      const metrics = factory.createMetrics()

      // Verify each metric has the expected methods from domain interfaces
      expect(metrics.registry.metrics).toBeDefined()
      expect(metrics.registry.contentType).toBeDefined()
      expect(metrics.registry.resetMetrics).toBeDefined()

      expect(metrics.httpRequestDuration.observe).toBeDefined()
      expect(metrics.httpRequestTotal.inc).toBeDefined()
      expect(metrics.usersTotal.set).toBeDefined()
      expect(metrics.usersTotal.inc).toBeDefined()
      expect(metrics.usersTotal.dec).toBeDefined()
    })

    it('should create working metrics that can be used', async () => {
      const metrics = factory.createMetrics()

      // Test that metrics actually work
      // biome-ignore lint/style/useNamingConvention: Prometheus metrics use snake_case for labels
      metrics.httpRequestTotal.inc({ labels: { method: 'GET', route: '/test', status_code: 200 } })
      metrics.usersTotal.set({ value: 42 })

      const metricsOutput = await metrics.registry.metrics()
      expect(metricsOutput).toContain(METRIC_CONFIG.HTTP.REQUEST_TOTAL.name)
      expect(metricsOutput).toContain(METRIC_CONFIG.BUSINESS.USERS_TOTAL.name)
    })

    it('should create isolated metrics for each factory instance', async () => {
      const factory1 = PrometheusMetricsFactory.create()
      const factory2 = PrometheusMetricsFactory.create()

      const metrics1 = factory1.createMetrics()
      const metrics2 = factory2.createMetrics()

      // Each factory should create independent metrics
      metrics1.usersTotal.set({ value: 10 })
      metrics2.usersTotal.set({ value: 20 })

      const output1 = await metrics1.registry.metrics()
      const output2 = await metrics2.registry.metrics()

      expect(output1).toContain('users_total 10')
      expect(output2).toContain('users_total 20')
    })

    it('should configure default metrics collection', async () => {
      const metrics = factory.createMetrics()

      const metricsOutput = await metrics.registry.metrics()

      // Verify default Node.js metrics are collected
      expect(metricsOutput).toContain('process_')
      expect(metricsOutput).toContain('nodejs_')
    })
  })
})
