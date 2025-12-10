import { PrometheusRegistry } from '@infrastructure/monitoring/prometheus/adapters/PrometheusRegistry.js'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing'
import { Counter, Registry } from 'prom-client'
import { beforeEach, describe, expect, it } from 'vitest'

const { prometheus } = TEST_CONSTANTS.metrics

describe('PrometheusRegistry', () => {
  let promRegistry: Registry
  let adapter: PrometheusRegistry

  beforeEach(() => {
    promRegistry = new Registry()
    adapter = PrometheusRegistry.create({ registry: promRegistry })
  })

  describe('create factory method', () => {
    it('should create instance successfully', () => {
      const registry = PrometheusRegistry.create({ registry: promRegistry })

      expect(registry).toBeInstanceOf(PrometheusRegistry)
    })
  })

  describe('metrics', () => {
    it('should return metrics output when no custom metrics are registered', async () => {
      const result = await adapter.metrics()

      // Prometheus returns empty or newline, not an error
      expect(result).toBeDefined()
    })

    it('should return metrics data when metrics are registered', async () => {
      const counter = new Counter({
        help: prometheus.testMetrics.counter.help,
        name: prometheus.testMetrics.counter.name,
        registers: [promRegistry],
      })
      counter.inc()

      const result = await adapter.metrics()

      expect(result).toContain(prometheus.testMetrics.counter.name)
      expect(result).toContain(prometheus.testMetrics.counter.help)
    })
  })

  describe('contentType', () => {
    it('should return Prometheus text format content type', () => {
      const contentType = adapter.contentType()

      expect(contentType).toBe(prometheus.contentType)
    })
  })

  describe('resetMetrics', () => {
    it('should reset metric values to default', async () => {
      const counter = new Counter({
        help: prometheus.testMetrics.counterForReset.help,
        name: prometheus.testMetrics.counterForReset.name,
        registers: [promRegistry],
      })
      counter.inc()
      counter.inc()

      const beforeReset = await adapter.metrics()
      expect(beforeReset).toContain(`${prometheus.testMetrics.counterForReset.name} 2`)

      adapter.resetMetrics()

      const afterReset = await adapter.metrics()
      // After reset, counter should be back to 0
      expect(afterReset).toContain(`${prometheus.testMetrics.counterForReset.name} 0`)
    })
  })
})
