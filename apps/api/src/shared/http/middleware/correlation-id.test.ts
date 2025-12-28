import { randomUUID } from 'node:crypto'
import { correlationIdMiddleware } from '@infrastructure/http/middleware/correlation-id.js'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { describe, expect, it, vi } from 'vitest'

describe('correlationIdMiddleware', () => {
  it('should generate a new correlation ID when not provided', async () => {
    // Arrange
    const mockRequest = {
      headers: {},
    } as unknown as FastifyRequest

    const mockReply = {
      header: vi.fn(),
    } as unknown as FastifyReply

    // Act
    await correlationIdMiddleware(mockRequest, mockReply)

    // Assert
    expect(mockRequest.correlationId).toBeDefined()
    expect(mockRequest.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(mockReply.header).toHaveBeenCalledWith('X-Correlation-ID', mockRequest.correlationId)
  })

  it('should use correlation ID from header when provided as string', async () => {
    // Arrange
    const providedId = randomUUID()
    const mockRequest = {
      headers: {
        'x-correlation-id': providedId,
      },
    } as unknown as FastifyRequest

    const mockReply = {
      header: vi.fn(),
    } as unknown as FastifyReply

    // Act
    await correlationIdMiddleware(mockRequest, mockReply)

    // Assert
    expect(mockRequest.correlationId).toBe(providedId)
    expect(mockReply.header).toHaveBeenCalledWith('X-Correlation-ID', providedId)
  })

  it('should use first correlation ID when header is an array', async () => {
    // Arrange
    const providedId = randomUUID()
    const mockRequest = {
      headers: {
        'x-correlation-id': [providedId, randomUUID()],
      },
    } as unknown as FastifyRequest

    const mockReply = {
      header: vi.fn(),
    } as unknown as FastifyReply

    // Act
    await correlationIdMiddleware(mockRequest, mockReply)

    // Assert
    expect(mockRequest.correlationId).toBe(providedId)
    expect(mockReply.header).toHaveBeenCalledWith('X-Correlation-ID', providedId)
  })

  it('should generate new ID when header array is empty', async () => {
    // Arrange
    const mockRequest = {
      headers: {
        'x-correlation-id': [],
      },
    } as unknown as FastifyRequest

    const mockReply = {
      header: vi.fn(),
    } as unknown as FastifyReply

    // Act
    await correlationIdMiddleware(mockRequest, mockReply)

    // Assert
    expect(mockRequest.correlationId).toBeDefined()
    expect(mockRequest.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    expect(mockReply.header).toHaveBeenCalledWith('X-Correlation-ID', mockRequest.correlationId)
  })

  it('should set X-Correlation-ID response header', async () => {
    // Arrange
    const mockRequest = {
      headers: {},
    } as unknown as FastifyRequest

    const mockReply = {
      header: vi.fn(),
    } as unknown as FastifyReply

    // Act
    await correlationIdMiddleware(mockRequest, mockReply)

    // Assert
    expect(mockReply.header).toHaveBeenCalledTimes(1)
    expect(mockReply.header).toHaveBeenCalledWith('X-Correlation-ID', expect.any(String))
  })
})
