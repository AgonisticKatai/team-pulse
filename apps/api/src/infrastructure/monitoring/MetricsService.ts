import * as promClient from 'prom-client'
import { type Counter, collectDefaultMetrics, type Histogram, Registry } from 'prom-client'

/**
 * Service for managing Prometheus metrics
 * Provides HTTP, database, and business metrics
 */
export class MetricsService {
  private readonly registry: Registry

  // HTTP metrics
  private readonly httpRequestDuration: Histogram
  private readonly httpRequestTotal: Counter
  private readonly httpRequestErrors: Counter

  // Database metrics
  private readonly dbQueryDuration: Histogram
  private readonly dbQueryTotal: Counter
  private readonly dbQueryErrors: Counter

  // Business metrics
  private readonly usersTotal: Counter
  private readonly teamsTotal: Counter
  private readonly loginsTotal: Counter

  constructor() {
    this.registry = new Registry()

    // Collect default metrics (memory, CPU, etc.)
    collectDefaultMetrics({ register: this.registry })

    // HTTP metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [this.registry],
    })

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    })

    this.httpRequestErrors = new promClient.Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    })

    // Database metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    })

    this.dbQueryTotal = new promClient.Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
      registers: [this.registry],
    })

    this.dbQueryErrors = new promClient.Counter({
      name: 'db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['operation', 'table', 'error_type'],
      registers: [this.registry],
    })

    // Business metrics
    this.usersTotal = new promClient.Counter({
      name: 'users_total',
      help: 'Total number of users created',
      labelNames: ['role'],
      registers: [this.registry],
    })

    this.teamsTotal = new promClient.Counter({
      name: 'teams_total',
      help: 'Total number of teams created',
      registers: [this.registry],
    })

    this.loginsTotal = new promClient.Counter({
      name: 'logins_total',
      help: 'Total number of successful logins',
      labelNames: ['role'],
      registers: [this.registry],
    })
  }

  /**
   * Get metrics in Prometheus format
   */
  getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  /**
   * Get content type for Prometheus metrics
   */
  getContentType(): string {
    return this.registry.contentType
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, durationSeconds: number): void {
    this.httpRequestDuration.observe(
      // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
      { method, route, status_code: statusCode },
      durationSeconds,
    )
    // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
    this.httpRequestTotal.inc({ method, route, status_code: statusCode })
  }

  /**
   * Record HTTP request error
   */
  recordHttpError(method: string, route: string, errorType: string): void {
    // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
    this.httpRequestErrors.inc({ method, route, error_type: errorType })
  }

  /**
   * Record database query metrics
   */
  recordDbQuery(operation: string, table: string, durationSeconds: number): void {
    this.dbQueryDuration.observe({ operation, table }, durationSeconds)
    this.dbQueryTotal.inc({ operation, table })
  }

  /**
   * Record database query error
   */
  recordDbError(operation: string, table: string, errorType: string): void {
    // biome-ignore lint/style/useNamingConvention: Prometheus label names use snake_case
    this.dbQueryErrors.inc({ operation, table, error_type: errorType })
  } /**
   * Record user creation
   */
  recordUserCreated(role: string): void {
    this.usersTotal.inc({ role })
  }

  /**
   * Record team creation
   */
  recordTeamCreated(): void {
    this.teamsTotal.inc()
  }

  /**
   * Record successful login
   */
  recordLogin(role: string): void {
    this.loginsTotal.inc({ role })
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.registry.resetMetrics()
  }
}

// Singleton instance
export const metricsService = new MetricsService()
