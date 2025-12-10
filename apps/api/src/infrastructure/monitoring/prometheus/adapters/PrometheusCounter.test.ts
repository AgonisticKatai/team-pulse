import { PrometheusCounter } from '@infrastructure/monitoring/prometheus/adapters/PrometheusCounter.js'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { Counter, Registry } from 'prom-client'
import { beforeEach, describe, expect, it } from 'vitest'

const { prometheus } = TEST_CONSTANTS.metrics

describe('PrometheusCounter', () => {
  let promRegistry: Registry
  let promCounter: Counter
  let adapter: PrometheusCounter

  beforeEach(() => {
    promRegistry = new Registry()
    promCounter = new Counter({
      help: prometheus.testMetrics.counter.help,
      labelNames: ['method', 'route'],
      name: prometheus.testMetrics.counter.name,
      registers: [promRegistry],
    })
    adapter = PrometheusCounter.create({ counter: promCounter })
  })

  describe('create factory method', () => {
    it('should create instance successfully', () => {
      const counter = PrometheusCounter.create({ counter: promCounter })

      expect(counter).toBeInstanceOf(PrometheusCounter)
    })
  })

  describe('inc', () => {
    it('should increment counter without labels or value', async () => {
      adapter.inc({})

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.counter.name} 1`)
    })

    it('should increment counter by specific value', async () => {
      adapter.inc({ value: prometheus.values.count })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.counter.name} ${prometheus.values.count}`)
    })

    it('should increment counter with labels', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.inc({ labels })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`method="${prometheus.labels.method}"`)
      expect(metrics).toContain(`route="${prometheus.labels.route}"`)
    })

    it('should increment counter with labels and custom value', async () => {
      const labels = {
        method: prometheus.labels.method,
        route: prometheus.labels.route,
      }

      adapter.inc({ labels, value: prometheus.values.count })

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(
        `${prometheus.testMetrics.counter.name}{method="${prometheus.labels.method}",route="${prometheus.labels.route}"} ${prometheus.values.count}`,
      )
    })

    it('should accumulate multiple increments', async () => {
      adapter.inc({})
      adapter.inc({})
      adapter.inc({})

      const metrics = await promRegistry.metrics()
      expect(metrics).toContain(`${prometheus.testMetrics.counter.name} 3`)
    })
  })
})
