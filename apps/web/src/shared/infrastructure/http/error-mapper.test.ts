import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  InternalError,
  NotFoundError,
  ValidationError,
} from '@team-pulse/shared'
import { describe, expect, it } from 'vitest'
import { mapStatusToError } from './error-mapper.js'

describe('mapStatusToError', () => {
  it('should map 400 to ValidationError', () => {
    const error = mapStatusToError({ message: 'Invalid input', status: 400 })

    expect(error).toBeInstanceOf(ValidationError)
    expect(error.message).toBe('Invalid input')
    expect(error.metadata?.status).toBe(400)
  })

  it('should map 401 to AuthenticationError', () => {
    const error = mapStatusToError({ message: 'Unauthorized', status: 401 })

    expect(error).toBeInstanceOf(AuthenticationError)
    expect(error.message).toBe('Unauthorized')
    expect(error.metadata?.status).toBe(401)
  })

  it('should map 403 to AuthorizationError', () => {
    const error = mapStatusToError({ message: 'Forbidden', status: 403 })

    expect(error).toBeInstanceOf(AuthorizationError)
    expect(error.message).toBe('Forbidden')
    expect(error.metadata?.status).toBe(403)
  })

  it('should map 404 to NotFoundError', () => {
    const error = mapStatusToError({ message: 'Not found', status: 404 })

    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.message).toBe('Not found')
    expect(error.metadata?.status).toBe(404)
  })

  it('should map 409 to ConflictError', () => {
    const error = mapStatusToError({ message: 'Conflict', status: 409 })

    expect(error).toBeInstanceOf(ConflictError)
    expect(error.message).toBe('Conflict')
    expect(error.metadata?.status).toBe(409)
  })

  it('should map 500 to InternalError', () => {
    const error = mapStatusToError({ message: 'Server error', status: 500 })

    expect(error).toBeInstanceOf(InternalError)
    expect(error.message).toBe('Server error')
    expect(error.metadata?.status).toBe(500)
  })

  it('should map 502 to InternalError', () => {
    const error = mapStatusToError({ message: 'Bad gateway', status: 502 })

    expect(error).toBeInstanceOf(InternalError)
    expect(error.metadata?.status).toBe(502)
  })

  it('should map 503 to InternalError', () => {
    const error = mapStatusToError({ message: 'Service unavailable', status: 503 })

    expect(error).toBeInstanceOf(InternalError)
    expect(error.metadata?.status).toBe(503)
  })

  it('should map 504 to InternalError', () => {
    const error = mapStatusToError({ message: 'Gateway timeout', status: 504 })

    expect(error).toBeInstanceOf(InternalError)
    expect(error.metadata?.status).toBe(504)
  })

  it('should map unknown status codes to InternalError with status in message', () => {
    const error = mapStatusToError({ message: "I'm a teapot", status: 418 })

    expect(error).toBeInstanceOf(InternalError)
    expect(error.message).toBe("HTTP 418: I'm a teapot")
    expect(error.metadata?.status).toBe(418)
  })

  it('should always include status in metadata', () => {
    const statuses = [400, 401, 403, 404, 409, 500, 502, 503, 504, 999]

    for (const status of statuses) {
      const error = mapStatusToError({ message: 'Test message', status })
      expect(error.metadata?.status).toBe(status)
    }
  })
})
