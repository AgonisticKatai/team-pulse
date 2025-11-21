import type { FastifySchema } from 'fastify'
import { commonErrorResponses, createSuccessResponseSchema, paginationSchema } from './common.js'

/**
 * OpenAPI/JSON Schemas for Team Management Routes
 */

// Team schema
// Note: Fields are not marked as required to allow flexibility in serialization
const teamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
    name: { type: 'string', example: 'FC Barcelona', minLength: 1, maxLength: 100 },
    city: { type: 'string', example: 'Barcelona', minLength: 1, maxLength: 100 },
    foundedYear: { type: 'number', nullable: true, example: 1899, minimum: 1800 },
    createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
    updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
  },
  additionalProperties: false,
} as const

// Create team request body schema
const createTeamBodySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      example: 'Real Madrid',
      description: 'Team name',
    },
    city: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      example: 'Madrid',
      description: 'City where the team is based',
    },
    foundedYear: {
      type: 'number',
      minimum: 1800,
      maximum: new Date().getFullYear(),
      nullable: true,
      example: 1902,
      description: 'Year the team was founded',
    },
  },
  required: ['name', 'city'],
} as const

// Update team request body schema
const updateTeamBodySchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      example: 'Real Madrid CF',
      description: 'Team name',
    },
    city: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      example: 'Madrid',
      description: 'City where the team is based',
    },
    foundedYear: {
      type: 'number',
      minimum: 1800,
      maximum: new Date().getFullYear(),
      nullable: true,
      example: 1902,
      description: 'Year the team was founded',
    },
  },
} as const

// Pagination query schema
const paginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'number', minimum: 1, default: 1, description: 'Page number' },
    limit: { type: 'number', minimum: 1, maximum: 100, default: 10, description: 'Items per page' },
  },
} as const

// List teams response data schema
// Note: Fields are not marked as required to allow flexibility in serialization
const teamsListDataSchema = {
  type: 'object',
  properties: {
    teams: {
      type: 'array',
      items: teamSchema,
    },
    pagination: paginationSchema,
  },
  additionalProperties: false,
} as const

// Team ID param schema
const teamIdParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Team ID' },
  },
  required: ['id'],
} as const

/**
 * POST /api/teams
 * Create a new team
 */
export const createTeamSchema: FastifySchema = {
  tags: ['teams'],
  description: 'Create a new team (requires ADMIN or SUPER_ADMIN role)',
  security: [{ bearerAuth: [] }],
  body: createTeamBodySchema,
  response: {
    201: {
      description: 'Team successfully created',
      ...createSuccessResponseSchema(teamSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * GET /api/teams
 * List all teams with pagination
 */
export const listTeamsSchema: FastifySchema = {
  tags: ['teams'],
  description: 'List all teams with pagination (requires authentication)',
  security: [{ bearerAuth: [] }],
  querystring: paginationQuerySchema,
  response: {
    200: {
      description: 'List of teams',
      ...createSuccessResponseSchema(teamsListDataSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * GET /api/teams/:id
 * Get a single team by ID
 */
export const getTeamSchema: FastifySchema = {
  tags: ['teams'],
  description: 'Get a single team by ID (requires authentication)',
  security: [{ bearerAuth: [] }],
  params: teamIdParamSchema,
  response: {
    200: {
      description: 'Team details',
      ...createSuccessResponseSchema(teamSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * PATCH /api/teams/:id
 * Update a team
 */
export const updateTeamSchema: FastifySchema = {
  tags: ['teams'],
  description: 'Update a team (requires ADMIN or SUPER_ADMIN role)',
  security: [{ bearerAuth: [] }],
  params: teamIdParamSchema,
  body: updateTeamBodySchema,
  response: {
    200: {
      description: 'Team successfully updated',
      ...createSuccessResponseSchema(teamSchema),
    },
    ...commonErrorResponses,
  },
}

/**
 * DELETE /api/teams/:id
 * Delete a team
 */
export const deleteTeamSchema: FastifySchema = {
  tags: ['teams'],
  description: 'Delete a team (requires ADMIN or SUPER_ADMIN role)',
  security: [{ bearerAuth: [] }],
  params: teamIdParamSchema,
  response: {
    204: {
      description: 'Team successfully deleted',
      type: 'null',
    },
    ...commonErrorResponses,
  },
}
