import type { FastifySchema } from 'fastify'
import { commonErrorResponses, createSuccessResponseSchema } from './common.js'

/**
 * OpenAPI/JSON Schemas for Authentication Routes
 */

// User schema (without password)
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'USER'], example: 'USER' },
    createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
  },
  required: ['id', 'email', 'role', 'createdAt', 'updatedAt'],
} as const

// Login request body schema
const loginBodySchema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    password: { type: 'string', example: 'SecurePassword123' },
  },
  required: ['email', 'password'],
} as const

// Login response data schema
const loginResponseDataSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    user: userSchema,
  },
  required: ['accessToken', 'refreshToken', 'user'],
} as const

// Refresh token request body schema
const refreshTokenBodySchema = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  },
  required: ['refreshToken'],
} as const

// Refresh token response data schema
const refreshTokenResponseDataSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  },
  required: ['accessToken', 'refreshToken'],
} as const

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const loginSchema: FastifySchema = {
  tags: ['auth'],
  description: 'Login with email and password',
  body: loginBodySchema,
  response: {
    200: {
      description: 'Successfully logged in',
      ...createSuccessResponseSchema(loginResponseDataSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * POST /api/auth/refresh
 * Get new access token using refresh token
 */
export const refreshTokenSchema: FastifySchema = {
  tags: ['auth'],
  description: 'Get new access token using refresh token',
  body: refreshTokenBodySchema,
  response: {
    200: {
      description: 'Successfully refreshed token',
      ...createSuccessResponseSchema(refreshTokenResponseDataSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * POST /api/auth/logout
 * Logout and invalidate refresh token
 */
export const logoutSchema: FastifySchema = {
  tags: ['auth'],
  description: 'Logout and invalidate refresh token',
  security: [{ bearerAuth: [] }],
  body: refreshTokenBodySchema,
  response: {
    204: {
      description: 'Successfully logged out',
      type: 'null',
    },
    ...commonErrorResponses,
  },
}

/**
 * GET /api/auth/me
 * Get current user information
 */
export const getMeSchema: FastifySchema = {
  tags: ['auth'],
  description: 'Get current user information',
  security: [{ bearerAuth: [] }],
  response: {
    200: {
      description: 'Current user information',
      ...createSuccessResponseSchema(userSchema),
    },
    ...commonErrorResponses,
  },
}
