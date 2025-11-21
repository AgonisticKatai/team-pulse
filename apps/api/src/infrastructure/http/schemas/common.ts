/**
 * Common OpenAPI/JSON Schema definitions
 *
 * These schemas are reusable across different routes and ensure consistent
 * API responses and documentation.
 */

// Error response schema
export const errorResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'VALIDATION_ERROR' },
        message: { type: 'string', example: 'Validation failed' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['success', 'error'],
} as const

// Success response schema (generic)
export const successResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'object' },
  },
  required: ['success', 'data'],
} as const

// Pagination metadata schema
// Note: Response schemas are flexible to allow natural API responses
export const paginationSchema = {
  type: 'object',
  properties: {
    page: { type: 'number', example: 1, minimum: 1 },
    limit: { type: 'number', example: 10, minimum: 1, maximum: 100 },
    total: { type: 'number', example: 42, minimum: 0 },
    totalPages: { type: 'number', example: 5, minimum: 0 },
  },
} as const

// Security scheme for JWT Bearer token
export const bearerAuthSchema = {
  security: [{ bearerAuth: [] }],
} as const

// Common error responses
export const commonErrorResponses = {
  400: {
    description: 'Bad Request - Validation error',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
          },
        },
      },
    },
  },
  401: {
    description: 'Unauthorized - Authentication required',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication token is missing or invalid',
          },
        },
      },
    },
  },
  403: {
    description: 'Forbidden - Insufficient permissions',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        },
      },
    },
  },
  404: {
    description: 'Not Found - Resource does not exist',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'The requested resource was not found',
          },
        },
      },
    },
  },
  409: {
    description: 'Conflict - Resource already exists',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'A resource with this identifier already exists',
          },
        },
      },
    },
  },
  429: {
    description: 'Too Many Requests - Rate limit exceeded',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please try again later.',
          },
        },
      },
    },
  },
  500: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: errorResponseSchema,
        example: {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
          },
        },
      },
    },
  },
} as const

/**
 * Helper to create a success response schema with custom data type
 */
export function createSuccessResponseSchema(dataSchema: object) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: dataSchema,
    },
    required: ['success', 'data'],
  }
}

/**
 * Helper to create a paginated response schema
 * Note: Response schemas are flexible to allow natural API responses
 */
export function createPaginatedResponseSchema(itemSchema: object) {
  return {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: itemSchema,
          },
          pagination: paginationSchema,
        },
      },
    },
    required: ['success', 'data'],
  }
}
