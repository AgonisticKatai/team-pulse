import { PrometheusGauge } from '@shared/monitoring/prometheus/gauge/PrometheusGauge.js'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { Gauge, Registry } from 'prom-client'
import { beforeEach, describe, expect, it } from 'vitest'

const { prometheus } = TEST_CONSTANTS.metrics

describe('PrometheusGauge', () => {
  let promRegistry: Registry
  let promGauge: Gauge
  let adapter: PrometheusGauge

  beforeEach(() => {
    promRegistry = new Registry()
    promGauge = new Gauge({
      help: prometheus.testMetrics.gauge.help,
      labelNames: ['method', 'route'],
      name: prometheus.testMetrics.gauge.name,
      registers: [promRegistry],
    })
    adapter = PrometheusGauge.create({ gauge: promGauge })
  })

  describe('create factory method', () => {
    it('should create instance successfully', () => {
      const gauge = PrometheusGauge.create({ gauge: promGauge })

      expect(gauge).toBeInstanceOf(PrometheusGauge)
    })
  })

  describe('set', () => {
    it('should set gauge value without labels', async () => {
      adapter.set({ value: prometheus.values.count })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.gauge.name} ${prometheus.values.count}`)
    })

    it('should set gauge value with labels', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.set({ labels, value: prometheus.values.count })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`method="${prometheus.labels.method}"`)
      expect(metrics).toContain(`route="${prometheus.labels.route}"`)
      expect(metrics).toContain(`${prometheus.values.count}`)
    })

    it('should update gauge value when set multiple times', async () => {
      adapter.set({ value: 10 })
      adapter.set({ value: 20 })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.gauge.name} 20`)
    })
  })

  describe('inc', () => {
    it('should increment gauge by 1 when no value provided', async () => {
      adapter.set({ value: 10 })
      adapter.inc({})

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.gauge.name} 11`)
    })

    it('should increment gauge by specific value', async () => {
      adapter.set({ value: 10 })
      adapter.inc({ value: 5 })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.gauge.name} 15`)
    })
  })

  describe('dec', () => {
    it('should decrement gauge by 1 when no value provided', async () => {
      adapter.set({ value: 10 })
      adapter.dec({})

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.gauge.name} 9`)
    })

    it('should decrement gauge by specific value', async () => {
      adapter.set({ value: 10 })
      adapter.dec({ value: 3 })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.gauge.name} 7`)
    })
  })
})
