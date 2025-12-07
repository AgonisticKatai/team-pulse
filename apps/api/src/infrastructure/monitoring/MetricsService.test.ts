import { METRIC_CONFIG } from '@domain/services/metrics/metrics.config.js'
import { MetricsService } from '@infrastructure/monitoring/MetricsService.js'
import { PrometheusMetricsFactory } from '@infrastructure/monitoring/prometheus/PrometheusMetricsFactory.js'
import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { beforeEach, describe, expect, it } from 'vitest'

const { prometheus } = TEST_CONSTANTS.metrics
const { users } = TEST_CONSTANTS

describe('MetricsService', () => {
  let service: MetricsService

  beforeEach(() => {
    const metricsFactory = PrometheusMetricsFactory.create()
    service = MetricsService.create({ metricsFactory })
    service.reset()
  })

  describe('create factory method', () => {
    it('should create instance successfully', () => {
      const metricsFactory = PrometheusMetricsFactory.create()
      const metricsService = MetricsService.create({ metricsFactory })

      expect(metricsService).toBeDefined()
      expect(metricsService).toBeInstanceOf(MetricsService)
    })

    it('should create multiple independent instances', () => {
      const metricsFactory1 = PrometheusMetricsFactory.create()
      const metricsFactory2 = PrometheusMetricsFactory.create()
      const service1 = MetricsService.create({ metricsFactory: metricsFactory1 })
      const service2 = MetricsService.create({ metricsFactory: metricsFactory2 })

      expect(service1).toBeDefined()
      expect(service2).toBeDefined()
      expect(service1).not.toBe(service2)
    })
  })

  describe('getContentType', () => {
    it('should return Prometheus content type', () => {
      const contentType = service.getContentType()

      expect(contentType).toBeDefined()
      expect(contentType).toContain('text/plain')
    })
  })

  describe('getMetrics', () => {
    it('should return metrics as string', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toBeDefined()
      expect(typeof metrics).toBe('string')
    })

    it('should include default metrics (memory, CPU, etc.)', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toContain('process_cpu')
      expect(metrics).toContain('nodejs_version_info')
    })

    it('should include HTTP metrics definitions', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_DURATION.name)
      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_TOTAL.name)
      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_ERRORS.name)
    })

    it('should include database metrics definitions', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_DURATION.name)
      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_TOTAL.name)
      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_ERRORS.name)
    })

    it('should include business metrics definitions', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.USERS_TOTAL.name)
      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name)
      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.name)
    })
  })

  describe('recordHttpRequest', () => {
    it('should record HTTP request successfully', async () => {
      const params = {
        durationSeconds: prometheus.http.durations.medium,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
      }

      service.recordHttpRequest(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_TOTAL.name)
      expect(metrics).toContain(`method="${prometheus.http.methods.get}"`)
      expect(metrics).toContain(`route="${prometheus.http.routes.users}"`)
      expect(metrics).toContain(`status_code="${prometheus.http.statusCodes.ok}"`)
    })

    it('should record multiple HTTP requests', async () => {
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.medium,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
      })
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.slow,
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.teams,
        statusCode: prometheus.http.statusCodes.created,
      })
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.fast,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`method="${prometheus.http.methods.get}"`)
      expect(metrics).toContain(`method="${prometheus.http.methods.post}"`)
      expect(metrics).toContain(`status_code="${prometheus.http.statusCodes.ok}"`)
      expect(metrics).toContain(`status_code="${prometheus.http.statusCodes.created}"`)
    })

    it('should record HTTP request duration', async () => {
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.verySlow,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.teams,
        statusCode: prometheus.http.statusCodes.ok,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_DURATION.name)
    })

    it('should handle different HTTP status codes', async () => {
      const statusCodes = [
        prometheus.http.statusCodes.ok,
        prometheus.http.statusCodes.created,
        prometheus.http.statusCodes.badRequest,
        prometheus.http.statusCodes.notFound,
        prometheus.http.statusCodes.serverError,
      ]

      for (const statusCode of statusCodes) {
        service.recordHttpRequest({
          durationSeconds: prometheus.http.durations.fast,
          method: prometheus.http.methods.get,
          route: prometheus.http.routes.test,
          statusCode,
        })
      }

      const metrics = await service.getMetrics()

      for (const code of statusCodes) {
        expect(metrics).toContain(`status_code="${code}"`)
      }
    })
  })

  describe('recordHttpError', () => {
    it('should record HTTP error successfully', async () => {
      const params = {
        errorType: prometheus.http.errors.client,
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.users,
      }

      service.recordHttpError(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_ERRORS.name)
      expect(metrics).toContain(`method="${prometheus.http.methods.post}"`)
      expect(metrics).toContain(`route="${prometheus.http.routes.users}"`)
      expect(metrics).toContain(`error_type="${prometheus.http.errors.client}"`)
    })

    it('should record multiple error types', async () => {
      service.recordHttpError({
        errorType: prometheus.http.errors.client,
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.login,
      })
      service.recordHttpError({
        errorType: prometheus.http.errors.client,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.teamsById,
      })
      service.recordHttpError({
        errorType: prometheus.http.errors.client,
        method: prometheus.http.methods.put,
        route: prometheus.http.routes.usersById,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`error_type="${prometheus.http.errors.client}"`)
      expect(metrics).toContain(`error_type="${prometheus.http.errors.client}"`)
      expect(metrics).toContain(`error_type="${prometheus.http.errors.client}"`)
    })
  })

  describe('recordDbQuery', () => {
    it('should record database query successfully', async () => {
      const params = {
        durationSeconds: prometheus.db.durations.medium,
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.users,
      }

      service.recordDbQuery(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_TOTAL.name)
      expect(metrics).toContain(`operation="${prometheus.db.operations.select}"`)
      expect(metrics).toContain(`table="${prometheus.db.tables.users}"`)
    })

    it('should record multiple database operations', async () => {
      service.recordDbQuery({
        durationSeconds: prometheus.db.durations.fast,
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.users,
      })
      service.recordDbQuery({
        durationSeconds: prometheus.db.durations.slow,
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.teams,
      })
      service.recordDbQuery({
        durationSeconds: prometheus.db.durations.medium,
        operation: prometheus.db.operations.update,
        table: prometheus.db.tables.users,
      })
      service.recordDbQuery({
        durationSeconds: prometheus.db.durations.fast,
        operation: prometheus.db.operations.delete,
        table: prometheus.db.tables.teams,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`operation="${prometheus.db.operations.select}"`)
      expect(metrics).toContain(`operation="${prometheus.db.operations.insert}"`)
      expect(metrics).toContain(`operation="${prometheus.db.operations.update}"`)
      expect(metrics).toContain(`operation="${prometheus.db.operations.delete}"`)
    })

    it('should record query duration', async () => {
      service.recordDbQuery({
        durationSeconds: prometheus.db.durations.medium,
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.teams,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_DURATION.name)
    })

    it('should handle queries on different tables', async () => {
      const tables = [
        prometheus.db.tables.users,
        prometheus.db.tables.teams,
        prometheus.db.tables.refreshTokens,
        prometheus.db.tables.refreshTokens,
      ]

      for (const table of tables) {
        service.recordDbQuery({
          durationSeconds: prometheus.db.durations.fast,
          operation: prometheus.db.operations.select,
          table,
        })
      }

      const metrics = await service.getMetrics()

      for (const table of tables) {
        expect(metrics).toContain(`table="${table}"`)
      }
    })
  })

  describe('recordDbError', () => {
    it('should record database error successfully', async () => {
      const params = {
        errorType: prometheus.db.errors.uniqueConstraint,
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.users,
      }

      service.recordDbError(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_ERRORS.name)
      expect(metrics).toContain(`operation="${prometheus.db.operations.insert}"`)
      expect(metrics).toContain(`table="${prometheus.db.tables.users}"`)
      expect(metrics).toContain(`error_type="${prometheus.db.errors.uniqueConstraint}"`)
    })

    it('should record multiple database error types', async () => {
      service.recordDbError({
        errorType: prometheus.db.errors.uniqueConstraint,
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.users,
      })
      service.recordDbError({
        errorType: prometheus.db.errors.connectionTimeout,
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.teams,
      })
      service.recordDbError({
        errorType: prometheus.db.errors.queryTimeout,
        operation: prometheus.db.operations.update,
        table: prometheus.db.tables.refreshTokens,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`error_type="${prometheus.db.errors.uniqueConstraint}"`)
      expect(metrics).toContain(`error_type="${prometheus.db.errors.connectionTimeout}"`)
      expect(metrics).toContain(`error_type="${prometheus.db.errors.queryTimeout}"`)
    })
  })

  describe('setUsersTotal', () => {
    it('should set total users count', async () => {
      const count = prometheus.business.counts.veryLarge

      service.setUsersTotal({ count })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.USERS_TOTAL.name)
      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${count}`)
    })

    it('should update users count', async () => {
      service.setUsersTotal({ count: prometheus.business.counts.large })
      service.setUsersTotal({ count: prometheus.business.counts.veryLarge })
      service.setUsersTotal({ count: prometheus.business.counts.huge })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${prometheus.business.counts.huge}`)
      expect(metrics).not.toContain(`${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${prometheus.business.counts.large}`)
      expect(metrics).not.toContain(
        `${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${prometheus.business.counts.veryLarge}`,
      )
    })

    it('should handle zero users', async () => {
      service.setUsersTotal({ count: prometheus.business.counts.zero })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${prometheus.business.counts.zero}`)
    })
  })

  describe('setTeamsTotal', () => {
    it('should set total teams count', async () => {
      const count = prometheus.business.counts.medium

      service.setTeamsTotal({ count })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name)
      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${count}`)
    })

    it('should update teams count', async () => {
      service.setTeamsTotal({ count: prometheus.business.counts.small })
      service.setTeamsTotal({ count: prometheus.business.counts.medium })
      service.setTeamsTotal({ count: prometheus.business.counts.large })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${prometheus.business.counts.large}`)
      expect(metrics).not.toContain(`${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${prometheus.business.counts.small}`)
      expect(metrics).not.toContain(`${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${prometheus.business.counts.medium}`)
    })

    it('should handle zero teams', async () => {
      service.setTeamsTotal({ count: prometheus.business.counts.zero })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${prometheus.business.counts.zero}`)
    })
  })

  describe('recordLogin', () => {
    it('should record login with user role', async () => {
      service.recordLogin({ role: users.johnDoe.role })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.name)
      expect(metrics).toContain(`role="${users.johnDoe.role}"`)
    })

    it('should record login with admin role', async () => {
      service.recordLogin({ role: users.adminUser.role })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`role="${users.adminUser.role}"`)
    })

    it('should record login with super admin role', async () => {
      service.recordLogin({ role: users.superAdminUser.role })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`role="${users.superAdminUser.role}"`)
    })

    it('should record multiple logins for different roles', async () => {
      service.recordLogin({ role: users.johnDoe.role })
      service.recordLogin({ role: users.johnDoe.role })
      service.recordLogin({ role: users.adminUser.role })
      service.recordLogin({ role: users.superAdminUser.role })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`role="${users.johnDoe.role}"`)
      expect(metrics).toContain(`role="${users.adminUser.role}"`)
      expect(metrics).toContain(`role="${users.superAdminUser.role}"`)
    })
  })

  describe('reset', () => {
    it('should reset all metrics', async () => {
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.medium,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
      })
      service.setUsersTotal({ count: prometheus.business.counts.large })
      service.setTeamsTotal({ count: prometheus.business.counts.medium })

      service.reset()
      const metricsAfterReset = await service.getMetrics()

      expect(metricsAfterReset).toContain(
        `${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${prometheus.business.counts.zero}`,
      )
      expect(metricsAfterReset).toContain(
        `${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${prometheus.business.counts.zero}`,
      )
    })

    it('should allow recording new metrics after reset', async () => {
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.medium,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
      })
      service.reset()

      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.slow,
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.teams,
        statusCode: prometheus.http.statusCodes.created,
      })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`method="${prometheus.http.methods.post}"`)
      expect(metrics).toContain(`route="${prometheus.http.routes.teams}"`)
    })
  })

  describe('integration - multiple metrics', () => {
    it('should handle recording all types of metrics together', async () => {
      service.recordHttpRequest({
        durationSeconds: prometheus.http.durations.medium,
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
      })
      service.recordHttpError({
        errorType: prometheus.http.errors.client,
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.teams,
      })

      service.recordDbQuery({
        durationSeconds: prometheus.db.durations.medium,
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.users,
      })
      service.recordDbError({
        errorType: prometheus.db.errors.uniqueConstraint,
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.teams,
      })

      service.setUsersTotal({ count: prometheus.business.counts.massive })
      service.setTeamsTotal({ count: prometheus.business.counts.large })
      service.recordLogin({ role: users.adminUser.role })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_TOTAL.name)
      expect(metrics).toContain(METRIC_CONFIG.HTTP.REQUEST_ERRORS.name)
      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_TOTAL.name)
      expect(metrics).toContain(METRIC_CONFIG.DB.QUERY_ERRORS.name)
      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.USERS_TOTAL.name} ${prometheus.business.counts.massive}`)
      expect(metrics).toContain(`${METRIC_CONFIG.BUSINESS.TEAMS_TOTAL.name} ${prometheus.business.counts.large}`)
      expect(metrics).toContain(METRIC_CONFIG.BUSINESS.LOGINS_TOTAL.name)
    })
  })
})
