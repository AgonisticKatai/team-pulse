import type { FastifyReply, FastifyRequest } from 'fastify'
import { metricsService } from '../../monitoring/MetricsService.js'

// WeakMap to store request start times
const requestStartTimes = new WeakMap<FastifyRequest, bigint>()

/**
 * onRequest hook to capture request start time
 * Note: async is required even without await for proper Fastify lifecycle handling
 */
// biome-ignore lint/suspicious/useAwait: Fastify hooks must be async for proper lifecycle
export async function metricsOnRequest(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  requestStartTimes.set(request, process.hrtime.bigint())
}

/**
 * onResponse hook to record metrics after response has been sent
 * This is the recommended Fastify pattern for metrics collection
 * The onResponse hook fires after the response is sent, ideal for statistics
 * Note: async is required even without await for proper Fastify lifecycle handling
 */
// biome-ignore lint/suspicious/useAwait: Fastify hooks must be async for proper lifecycle
export async function metricsOnResponse(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const startTime = requestStartTimes.get(request)

  if (!startTime) {
    // If no startTime, the onRequest hook didn't execute correctly
    return
  }

  const endTime = process.hrtime.bigint()
  const durationSeconds = Number(endTime - startTime) / 1e9

  const method = request.method
  const route = request.routeOptions?.url || 'unknown'
  const statusCode = reply.statusCode

  // Record metrics
  metricsService.recordHttpRequest(method, route, statusCode, durationSeconds)

  // Record errors (4xx and 5xx status codes)
  if (statusCode >= 400) {
    const errorType = statusCode >= 500 ? 'server_error' : 'client_error'
    metricsService.recordHttpError(method, route, errorType)
  }

  // Clean up WeakMap
  requestStartTimes.delete(request)
}
