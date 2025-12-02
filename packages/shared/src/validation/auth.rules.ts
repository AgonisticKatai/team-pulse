import { z } from 'zod'

/**
 * Authentication Validation Rules
 *
 * SINGLE SOURCE OF TRUTH for authentication validation rules across FE and BE.
 * These are DOMAIN RULES (business logic), not implementation details.
 *
 * @module validation/auth.rules
 * @packageDocumentation
 */

// ============================================
// DOMAIN RULES - Business Constraints
// ============================================

/**
 * Authentication rules constants
 * These define the business rules for authentication in the application
 */
export const AUTH_RULES = {
  EMAIL: {
    /**
     * Maximum length for email addresses
     * Based on RFC 5321 specification
     */
    MAX_LENGTH: 255,

    /**
     * Email format regex
     * Basic validation - permissive to avoid false negatives
     */
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  PASSWORD: {
    /**
     * Maximum password length
     * Prevents DOS attacks and ensures reasonable limits
     */
    MAX_LENGTH: 100,
    /**
     * Minimum password length
     * Security requirement: minimum 8 characters
     */
    MIN_LENGTH: 8,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,

    /**
     * Password complexity requirements
     */
    REQUIRE_UPPERCASE: true,
  },
} as const

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Email validation schema
 *
 * Used in both FE (forms) and BE (DTOs) for consistent email validation.
 * Normalizes email to lowercase and trims whitespace.
 *
 * @example
 * ```typescript
 * const result = EmailSchema.safeParse("  User@Example.COM  ")
 * // result.data === "user@example.com"
 * ```
 */
export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(AUTH_RULES.EMAIL.MAX_LENGTH, `Email must not exceed ${AUTH_RULES.EMAIL.MAX_LENGTH} characters`)
  .pipe(z.email({ message: 'Invalid email format' }))

/**
 * Password validation schema - STRICT
 *
 * Used in BE for user creation/registration and password changes.
 * Enforces all complexity requirements.
 *
 * Requirements:
 * - Minimum 8 characters
 * - Maximum 100 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 *
 * @example
 * ```typescript
 * PasswordStrictSchema.parse("Password123") // ✅ Valid
 * PasswordStrictSchema.parse("password")    // ❌ No uppercase
 * PasswordStrictSchema.parse("PASSWORD")    // ❌ No lowercase
 * PasswordStrictSchema.parse("Pass")        // ❌ Too short
 * ```
 */
export const PasswordStrictSchema = z
  .string()
  .min(AUTH_RULES.PASSWORD.MIN_LENGTH, `Password must be at least ${AUTH_RULES.PASSWORD.MIN_LENGTH} characters`)
  .max(AUTH_RULES.PASSWORD.MAX_LENGTH, `Password must not exceed ${AUTH_RULES.PASSWORD.MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Password validation schema - RELAXED
 *
 * Used in FE for login forms.
 * Only validates that password is not empty - actual validation happens on BE.
 *
 * @rationale
 * Login forms don't need strict password validation since we're checking
 * against an existing hashed password. Strict validation only applies
 * when creating or changing passwords.
 */
export const PasswordLoginSchema = z.string().min(1, 'Password is required')

/**
 * Login form validation schema
 *
 * Used in FE login forms and BE login validation.
 * Uses relaxed password validation since we're authenticating,
 * not creating a new password.
 *
 * @example
 * ```typescript
 * const credentials = LoginFormSchema.parse({
 *   email: "user@example.com",
 *   password: "any-password"
 * })
 * ```
 */
export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: PasswordLoginSchema,
})

/**
 * Registration form validation schema
 *
 * Used in FE registration forms and BE user creation.
 * Uses strict password validation to enforce complexity requirements.
 *
 * @example
 * ```typescript
 * const userData = RegisterFormSchema.parse({
 *   email: "newuser@example.com",
 *   password: "SecurePass123"
 * })
 * ```
 */
export const RegisterFormSchema = z.object({
  email: EmailSchema,
  password: PasswordStrictSchema,
})

// ============================================
// TYPESCRIPT TYPES
// ============================================

/**
 * Login form data type
 * Inferred from LoginFormSchema
 */
export type LoginFormData = z.infer<typeof LoginFormSchema>

/**
 * Registration form data type
 * Inferred from RegisterFormSchema
 */
export type RegisterFormData = z.infer<typeof RegisterFormSchema>
