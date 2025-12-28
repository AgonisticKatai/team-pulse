import { PrometheusHistogram } from '@shared/monitoring/prometheus/histogram/PrometheusHistogram.js'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { Histogram, Registry } from 'prom-client'
import { beforeEach, describe, expect, it } from 'vitest'

const { prometheus } = TEST_CONSTANTS.metrics

describe('PrometheusHistogram', () => {
  let promRegistry: Registry
  let promHistogram: Histogram
  let adapter: PrometheusHistogram

  beforeEach(() => {
    promRegistry = new Registry()
    promHistogram = new Histogram({
      buckets: [...prometheus.testMetrics.histogram.buckets],
      help: prometheus.testMetrics.histogram.help,
      labelNames: ['method', 'route'],
      name: prometheus.testMetrics.histogram.name,
      registers: [promRegistry],
    })
    adapter = PrometheusHistogram.create({ histogram: promHistogram })
  })

  describe('create factory method', () => {
    it('should create instance successfully', () => {
      const histogram = PrometheusHistogram.create({ histogram: promHistogram })

      expect(histogram).toBeInstanceOf(PrometheusHistogram)
    })
  })

  describe('observe', () => {
    it('should observe value with labels', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.observe({ labels, value: prometheus.values.duration })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`method="${prometheus.labels.method}"`)
      expect(metrics).toContain(`route="${prometheus.labels.route}"`)
      expect(metrics).toContain(`${prometheus.testMetrics.histogram.name}_count`)
      expect(metrics).toContain(`${prometheus.testMetrics.histogram.name}_sum`)
    })

    it('should track multiple observations', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.observe({ labels, value: 0.1 })
      adapter.observe({ labels, value: 0.2 })
      adapter.observe({ labels, value: 0.3 })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(
        `${prometheus.testMetrics.histogram.name}_count{method="${prometheus.labels.method}",route="${prometheus.labels.route}"} 3`,
      )
    })

    it('should accumulate sum of observations', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.observe({ labels, value: 0.1 })
      adapter.observe({ labels, value: 0.2 })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(
        `${prometheus.testMetrics.histogram.name}_sum{method="${prometheus.labels.method}",route="${prometheus.labels.route}"} 0.30000000000000004`,
      )
    })

    it('should distribute observations into buckets', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.observe({ labels, value: 0.05 })
      adapter.observe({ labels, value: 0.3 })
      adapter.observe({ labels, value: 2 })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.histogram.name}_bucket`)
    })
  })
})
