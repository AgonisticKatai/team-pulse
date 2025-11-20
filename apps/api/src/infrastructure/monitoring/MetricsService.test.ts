import { TEST_CONSTANTS } from '@team-pulse/shared/testing/constants'
import { beforeEach, describe, expect, it } from 'vitest'
import { MetricsService } from './MetricsService.js'
import { PrometheusMetricsFactory } from './prometheus/PrometheusMetricsFactory.js'

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

      expect(metrics).toContain('http_request_duration_seconds')
      expect(metrics).toContain('http_requests_total')
      expect(metrics).toContain('http_request_errors_total')
    })

    it('should include database metrics definitions', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toContain('db_query_duration_seconds')
      expect(metrics).toContain('db_queries_total')
      expect(metrics).toContain('db_query_errors_total')
    })

    it('should include business metrics definitions', async () => {
      const metrics = await service.getMetrics()

      expect(metrics).toContain('users_total')
      expect(metrics).toContain('teams_total')
      expect(metrics).toContain('logins_total')
    })
  })

  describe('recordHttpRequest', () => {
    it('should record HTTP request successfully', async () => {
      const params = {
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.medium,
      }

      service.recordHttpRequest(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain('http_requests_total')
      expect(metrics).toContain(`method="${prometheus.http.methods.get}"`)
      expect(metrics).toContain(`route="${prometheus.http.routes.users}"`)
      expect(metrics).toContain(`status_code="${prometheus.http.statusCodes.ok}"`)
    })

    it('should record multiple HTTP requests', async () => {
      service.recordHttpRequest({
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.medium,
      })
      service.recordHttpRequest({
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.teams,
        statusCode: prometheus.http.statusCodes.created,
        durationSeconds: prometheus.http.durations.slow,
      })
      service.recordHttpRequest({
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.fast,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`method="${prometheus.http.methods.get}"`)
      expect(metrics).toContain(`method="${prometheus.http.methods.post}"`)
      expect(metrics).toContain(`status_code="${prometheus.http.statusCodes.ok}"`)
      expect(metrics).toContain(`status_code="${prometheus.http.statusCodes.created}"`)
    })

    it('should record HTTP request duration', async () => {
      service.recordHttpRequest({
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.teams,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.verySlow,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain('http_request_duration_seconds')
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
          method: prometheus.http.methods.get,
          route: prometheus.http.routes.test,
          statusCode,
          durationSeconds: prometheus.http.durations.fast,
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
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.users,
        errorType: prometheus.http.errors.validation,
      }

      service.recordHttpError(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain('http_request_errors_total')
      expect(metrics).toContain(`method="${prometheus.http.methods.post}"`)
      expect(metrics).toContain(`route="${prometheus.http.routes.users}"`)
      expect(metrics).toContain(`error_type="${prometheus.http.errors.validation}"`)
    })

    it('should record multiple error types', async () => {
      service.recordHttpError({
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.login,
        errorType: prometheus.http.errors.authentication,
      })
      service.recordHttpError({
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.teamsById,
        errorType: prometheus.http.errors.notFound,
      })
      service.recordHttpError({
        method: prometheus.http.methods.put,
        route: prometheus.http.routes.usersById,
        errorType: prometheus.http.errors.validation,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`error_type="${prometheus.http.errors.authentication}"`)
      expect(metrics).toContain(`error_type="${prometheus.http.errors.notFound}"`)
      expect(metrics).toContain(`error_type="${prometheus.http.errors.validation}"`)
    })
  })

  describe('recordDbQuery', () => {
    it('should record database query successfully', async () => {
      const params = {
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.users,
        durationSeconds: prometheus.db.durations.medium,
      }

      service.recordDbQuery(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain('db_queries_total')
      expect(metrics).toContain(`operation="${prometheus.db.operations.select}"`)
      expect(metrics).toContain(`table="${prometheus.db.tables.users}"`)
    })

    it('should record multiple database operations', async () => {
      service.recordDbQuery({
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.users,
        durationSeconds: prometheus.db.durations.fast,
      })
      service.recordDbQuery({
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.teams,
        durationSeconds: prometheus.db.durations.slow,
      })
      service.recordDbQuery({
        operation: prometheus.db.operations.update,
        table: prometheus.db.tables.users,
        durationSeconds: prometheus.db.durations.medium,
      })
      service.recordDbQuery({
        operation: prometheus.db.operations.delete,
        table: prometheus.db.tables.teams,
        durationSeconds: prometheus.db.durations.fast,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`operation="${prometheus.db.operations.select}"`)
      expect(metrics).toContain(`operation="${prometheus.db.operations.insert}"`)
      expect(metrics).toContain(`operation="${prometheus.db.operations.update}"`)
      expect(metrics).toContain(`operation="${prometheus.db.operations.delete}"`)
    })

    it('should record query duration', async () => {
      service.recordDbQuery({
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.teams,
        durationSeconds: prometheus.db.durations.medium,
      })

      const metrics = await service.getMetrics()

      expect(metrics).toContain('db_query_duration_seconds')
    })

    it('should handle queries on different tables', async () => {
      const tables = [prometheus.db.tables.users, prometheus.db.tables.teams, prometheus.db.tables.refreshTokens, prometheus.db.tables.sessions]

      for (const table of tables) {
        service.recordDbQuery({
          operation: prometheus.db.operations.select,
          table,
          durationSeconds: prometheus.db.durations.fast,
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
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.users,
        errorType: prometheus.db.errors.uniqueConstraint,
      }

      service.recordDbError(params)
      const metrics = await service.getMetrics()

      expect(metrics).toContain('db_query_errors_total')
      expect(metrics).toContain(`operation="${prometheus.db.operations.insert}"`)
      expect(metrics).toContain(`table="${prometheus.db.tables.users}"`)
      expect(metrics).toContain(`error_type="${prometheus.db.errors.uniqueConstraint}"`)
    })

    it('should record multiple database error types', async () => {
      service.recordDbError({
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.users,
        errorType: prometheus.db.errors.uniqueConstraint,
      })
      service.recordDbError({
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.teams,
        errorType: prometheus.db.errors.connectionTimeout,
      })
      service.recordDbError({
        operation: prometheus.db.operations.update,
        table: prometheus.db.tables.sessions,
        errorType: prometheus.db.errors.queryTimeout,
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

      expect(metrics).toContain('users_total')
      expect(metrics).toContain(`users_total ${count}`)
    })

    it('should update users count', async () => {
      service.setUsersTotal({ count: prometheus.business.counts.large })
      service.setUsersTotal({ count: prometheus.business.counts.veryLarge })
      service.setUsersTotal({ count: prometheus.business.counts.huge })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`users_total ${prometheus.business.counts.huge}`)
      expect(metrics).not.toContain(`users_total ${prometheus.business.counts.large}`)
      expect(metrics).not.toContain(`users_total ${prometheus.business.counts.veryLarge}`)
    })

    it('should handle zero users', async () => {
      service.setUsersTotal({ count: prometheus.business.counts.zero })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`users_total ${prometheus.business.counts.zero}`)
    })
  })

  describe('setTeamsTotal', () => {
    it('should set total teams count', async () => {
      const count = prometheus.business.counts.medium

      service.setTeamsTotal({ count })
      const metrics = await service.getMetrics()

      expect(metrics).toContain('teams_total')
      expect(metrics).toContain(`teams_total ${count}`)
    })

    it('should update teams count', async () => {
      service.setTeamsTotal({ count: prometheus.business.counts.small })
      service.setTeamsTotal({ count: prometheus.business.counts.medium })
      service.setTeamsTotal({ count: prometheus.business.counts.large })

      const metrics = await service.getMetrics()

      expect(metrics).toContain(`teams_total ${prometheus.business.counts.large}`)
      expect(metrics).not.toContain(`teams_total ${prometheus.business.counts.small}`)
      expect(metrics).not.toContain(`teams_total ${prometheus.business.counts.medium}`)
    })

    it('should handle zero teams', async () => {
      service.setTeamsTotal({ count: prometheus.business.counts.zero })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`teams_total ${prometheus.business.counts.zero}`)
    })
  })

  describe('recordLogin', () => {
    it('should record login with user role', async () => {
      service.recordLogin({ role: users.johnDoe.role })
      const metrics = await service.getMetrics()

      expect(metrics).toContain('logins_total')
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
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.medium,
      })
      service.setUsersTotal({ count: prometheus.business.counts.large })
      service.setTeamsTotal({ count: prometheus.business.counts.medium })

      service.reset()
      const metricsAfterReset = await service.getMetrics()

      expect(metricsAfterReset).toContain(`users_total ${prometheus.business.counts.zero}`)
      expect(metricsAfterReset).toContain(`teams_total ${prometheus.business.counts.zero}`)
    })

    it('should allow recording new metrics after reset', async () => {
      service.recordHttpRequest({
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.medium,
      })
      service.reset()

      service.recordHttpRequest({
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.teams,
        statusCode: prometheus.http.statusCodes.created,
        durationSeconds: prometheus.http.durations.slow,
      })
      const metrics = await service.getMetrics()

      expect(metrics).toContain(`method="${prometheus.http.methods.post}"`)
      expect(metrics).toContain(`route="${prometheus.http.routes.teams}"`)
    })
  })

  describe('integration - multiple metrics', () => {
    it('should handle recording all types of metrics together', async () => {
      service.recordHttpRequest({
        method: prometheus.http.methods.get,
        route: prometheus.http.routes.users,
        statusCode: prometheus.http.statusCodes.ok,
        durationSeconds: prometheus.http.durations.medium,
      })
      service.recordHttpError({
        method: prometheus.http.methods.post,
        route: prometheus.http.routes.teams,
        errorType: prometheus.http.errors.validation,
      })

      service.recordDbQuery({
        operation: prometheus.db.operations.select,
        table: prometheus.db.tables.users,
        durationSeconds: prometheus.db.durations.medium,
      })
      service.recordDbError({
        operation: prometheus.db.operations.insert,
        table: prometheus.db.tables.teams,
        errorType: prometheus.db.errors.uniqueConstraint,
      })

      service.setUsersTotal({ count: prometheus.business.counts.massive })
      service.setTeamsTotal({ count: prometheus.business.counts.large })
      service.recordLogin({ role: users.adminUser.role })

      const metrics = await service.getMetrics()

      expect(metrics).toContain('http_requests_total')
      expect(metrics).toContain('http_request_errors_total')
      expect(metrics).toContain('db_queries_total')
      expect(metrics).toContain('db_query_errors_total')
      expect(metrics).toContain(`users_total ${prometheus.business.counts.massive}`)
      expect(metrics).toContain(`teams_total ${prometheus.business.counts.large}`)
      expect(metrics).toContain('logins_total')
    })
  })
})
