import type { FastifySchema } from 'fastify'
import { commonErrorResponses, createSuccessResponseSchema, paginationSchema } from './common.js'

/**
 * OpenAPI/JSON Schemas for User Management Routes
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

// Create user request body schema
const createUserBodySchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      example: 'newuser@example.com',
      description: 'User email address',
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 100,
      example: 'SecurePass123',
      description: 'Password (min 8 chars, must contain uppercase, lowercase, and number)',
    },
    role: {
      type: 'string',
      enum: ['SUPER_ADMIN', 'ADMIN', 'USER'],
      example: 'USER',
      description: 'User role',
    },
  },
  required: ['email', 'password', 'role'],
} as const

// Pagination query schema
const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
  },
} as const

// List users response data schema
const usersListDataSchema = {
  type: 'object',
  properties: {
    users: {
      type: 'array',
      items: userSchema,
    },
    pagination: paginationSchema,
  },
  required: ['users', 'pagination'],
} as const

/**
 * POST /api/users
 * Create a new user
 */
export const createUserSchema: FastifySchema = {
  tags: ['users'],
  description: 'Create a new user (requires SUPER_ADMIN or ADMIN role)',
  security: [{ bearerAuth: [] }],
  body: createUserBodySchema,
  response: {
    201: {
      description: 'User successfully created',
      ...createSuccessResponseSchema(userSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * GET /api/users
 * List all users with pagination
 */
export const listUsersSchema: FastifySchema = {
  tags: ['users'],
  description: 'List all users with pagination (requires SUPER_ADMIN or ADMIN role)',
  security: [{ bearerAuth: [] }],
  querystring: paginationQuerySchema,
  response: {
    200: {
      description: 'List of users',
      ...createSuccessResponseSchema(usersListDataSchema),
    },
    ...commonErrorResponses,
  },
}
