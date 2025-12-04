/**
 * Email primitive type.
 * * We define this explicitly as 'string' to avoid circular dependencies
 * with the schema and to keep the domain definition independent of Zod.
 */
export type EmailType = string
