import type { FastifyReply, FastifyRequest } from 'fastify'
import type { IMetricsService } from '../../../domain/services/IMetricsService.js'

// WeakMap to store request start times
const requestStartTimes = new WeakMap<FastifyRequest, bigint>()

/**
 * Factory to create onRequest hook to capture request start time
 * Note: async is required even without await for proper Fastify lifecycle handling
 */
export function createMetricsOnRequest() {
  // biome-ignore lint/suspicious/useAwait: Fastify hooks must be async for proper lifecycle
  return async function metricsOnRequest(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    requestStartTimes.set(request, process.hrtime.bigint())
  }
}

/**
 * Factory to create onResponse hook to record metrics after response has been sent
 * This is the recommended Fastify pattern for metrics collection
 * The onResponse hook fires after the response is sent, ideal for statistics
 * Note: async is required even without await for proper Fastify lifecycle handling
 */
export function createMetricsOnResponse({ metricsService }: { metricsService: IMetricsService }) {
  // biome-ignore lint/suspicious/useAwait: Fastify hooks must be async for proper lifecycle
  return async function metricsOnResponse(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const startTime = requestStartTimes.get(request)

    if (!startTime) {
      return
    }

    const endTime = process.hrtime.bigint()
    const durationSeconds = Number(endTime - startTime) / 1e9

    const method = request.method
    const route = request.routeOptions?.url || 'unknown'
    const statusCode = reply.statusCode

    metricsService.recordHttpRequest({ durationSeconds, method, route, statusCode })

    if (statusCode >= 400) {
      const errorType = statusCode >= 500 ? 'server_error' : 'client_error'
      metricsService.recordHttpError({ errorType, method, route })
    }

    requestStartTimes.delete(request)
  }
}
