import type { FastifySchema } from 'fastify'
import { commonErrorResponses, createSuccessResponseSchema } from './common.js'

/**
 * OpenAPI/JSON Schemas for Authentication Routes
 */

// User schema for login response (without password)
// Note: Fields are not marked as required to allow flexibility in serialization
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: 'test-user' },
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'USER'], example: 'USER' },
    createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
  },
  additionalProperties: false,
} as const

// Current user schema (from JWT token payload)
// Note: Fields are not marked as required to allow flexibility in serialization
const currentUserSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string', example: 'test-user' },
    email: { type: 'string', format: 'email', example: 'user@example.com' },
    role: { type: 'string', enum: ['SUPER_ADMIN', 'ADMIN', 'USER'], example: 'USER' },
  },
  additionalProperties: false,
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
// Note: Fields are not marked as required to allow flexibility in serialization
const loginResponseDataSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    user: userSchema,
  },
  additionalProperties: false,
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
// Note: Fields are not marked as required to allow flexibility in serialization
const refreshTokenResponseDataSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  },
  additionalProperties: false,
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
      ...createSuccessResponseSchema(currentUserSchema),
    },
    ...commonErrorResponses,
  },
}
