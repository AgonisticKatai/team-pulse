import type { FastifyDynamicSwaggerOptions } from '@fastify/swagger'
import type { FastifySwaggerUiOptions } from '@fastify/swagger-ui'

/**
 * Swagger/OpenAPI configuration
 *
 * This configuration defines the OpenAPI specification for the API documentation.
 * The documentation is automatically generated from route schemas and displayed via Swagger UI.
 */
export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'TeamPulse API',
      description: 'Modern football team statistics platform with real-time match tracking',
      version: '1.0.0',
      contact: {
        name: 'TeamPulse Team',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.teampulse.example.com',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'auth', description: 'Authentication endpoints' },
      { name: 'users', description: 'User management endpoints' },
      { name: 'teams', description: 'Team management endpoints' },
      { name: 'health', description: 'Health check and monitoring' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
      },
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here',
    },
  },
}

/**
 * Swagger UI configuration
 *
 * This configuration customizes the Swagger UI interface
 */
export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list', // 'list', 'full' or 'none'
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showCommonExtensions: true,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
}
